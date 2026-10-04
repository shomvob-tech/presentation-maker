import { after, NextRequest, NextResponse } from "next/server";
import { launchBrowser } from "@/lib/launch-browser";
import { buildDeckPlan } from "@/lib/deck-catalog";
import {
  buildSuggestedDeckPdfFileName,
  DECK_DETAILS_KEY,
  DECK_LOGO_KEY,
  isPresentationDeckDetails,
} from "@/lib/deck-session";
import { toDhakaTimestamp } from "@/lib/audit/events";
import { safeAppendAuditRow } from "@/lib/audit/sheets";

// Chromium cannot run on the Edge runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Server-side outcome of a presentation export — see the proposal route for
 * the one blind spot (a hard timeout writes no row, showing up as an
 * `export_clicked` with no matching `export_result`).
 */
function logExportResult(fields: {
  result: string;
  startedAt: number;
  draftId: unknown;
  clientName: string;
  pageCount?: number;
}) {
  const now = new Date();

  after(() =>
    safeAppendAuditRow({
      event_id: "srv-" + now.getTime() + "-" + Math.random().toString(36).slice(2, 8),
      ts_utc: now.toISOString(),
      ts_local: toDhakaTimestamp(now),
      event: "export_result",
      doc_type: "presentation",
      draft_id: typeof fields.draftId === "string" ? fields.draftId : "",
      client_name: fields.clientName,
      export_method: "api",
      export_result: fields.result,
      export_ms: Date.now() - fields.startedAt,
      page_count: fields.pageCount ?? "",
      app_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    }),
  );
}

export async function POST(request: NextRequest) {
  let url: unknown;
  let deckDetails: unknown;
  let logoDataUrl: unknown;
  let auditDraftId: unknown;

  const startedAt = Date.now();

  try {
    const body = await request.json();
    url = body?.url;
    deckDetails = body?.deckDetails;
    logoDataUrl = body?.logoDataUrl;
    auditDraftId = body?.auditDraftId;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof url !== "string" || !url) {
    return NextResponse.json(
      { error: "A presentation preview URL is required." },
      { status: 400 },
    );
  }
  if (!isPresentationDeckDetails(deckDetails)) {
    return NextResponse.json(
      { error: "A client name and at least one module are required." },
      { status: 400 },
    );
  }

  let previewUrl: URL;
  try {
    previewUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { error: "The presentation preview URL is invalid." },
      { status: 400 },
    );
  }

  // Same guard as the other export routes: this endpoint renders whatever URL
  // it is given in a real browser, so it only ever renders our own preview.
  if (
    previewUrl.origin !== request.nextUrl.origin ||
    previewUrl.pathname !== "/presentation-preview"
  ) {
    return NextResponse.json(
      { error: "Only this application's presentation preview can be exported." },
      { status: 400 },
    );
  }

  const hasLogo =
    typeof logoDataUrl === "string" && logoDataUrl.startsWith("data:image/");
  const expectedSlideCount = buildDeckPlan(deckDetails.moduleIds).length;

  let browser;
  try {
    browser = await launchBrowser();
    // The size the slides are designed at, and the CSS-pixel size of the
    // 13.333in × 7.5in page PresentationDeck prints them on.
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    await page.addInitScript(
      ({
        detailsKey,
        logoKey,
        details,
        logo,
      }: {
        detailsKey: string;
        logoKey: string;
        details: string;
        logo: string;
      }) => {
        localStorage.setItem(detailsKey, details);
        if (logo) localStorage.setItem(logoKey, logo);
        else localStorage.removeItem(logoKey);
      },
      {
        detailsKey: DECK_DETAILS_KEY,
        logoKey: DECK_LOGO_KEY,
        details: JSON.stringify(deckDetails),
        logo: hasLogo ? String(logoDataUrl) : "",
      },
    );

    await page.goto(previewUrl.toString(), { waitUntil: "load", timeout: 120_000 });

    // Every slide, not just the first — the preview renders them in one
    // commit, so anything less means the page is still coming up.
    await page.waitForFunction(
      (expected: number) =>
        document.querySelectorAll(".deck-root > section").length >= expected,
      expectedSlideCount,
      { timeout: 30_000 },
    );

    // Slide images are lazy; below the first slide none have started loading.
    // Same fix as PresentationPrintPdfButton: make them eager, then wait for
    // the loads, capped so one stuck image cannot cost the whole export.
    await page.evaluate(async () => {
      for (const image of document.querySelectorAll<HTMLImageElement>(
        'img[loading="lazy"]',
      )) {
        image.loading = "eager";
      }

      await document.fonts?.ready;
      await Promise.race([
        Promise.all(
          [...document.images].map((image) =>
            image.complete
              ? undefined
              : new Promise<void>((resolve) => {
                  image.addEventListener("load", () => resolve(), { once: true });
                  image.addEventListener("error", () => resolve(), { once: true });
                }),
          ),
        ),
        new Promise((resolve) => setTimeout(resolve, 10_000)),
      ]);
    });
    await page.emulateMedia({ media: "print" });

    const pageCount = await page.locator(".deck-root > section").count();

    // The page size is passed explicitly, not left to PresentationDeck's
    // @page rule via preferCSSPageSize. With preferCSSPageSize, Chromium still
    // lays the document out against the default paper — Letter, 816px wide —
    // and only sizes the output pages from CSS, so every `lg:` style and every
    // vw-based font on the slides comes out as if on a narrow screen.
    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: "13.333in",
      height: "7.5in",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const filename = buildSuggestedDeckPdfFileName(deckDetails.clientName);
    // Header values must be Latin-1, and a Bangla client name would make the
    // response throw after the PDF is already rendered. So: an ASCII-only
    // `filename` plus the real one as RFC 5987 `filename*`, which browsers
    // prefer when present. The builder names the download itself anyway.
    const asciiFilename = filename.replace(/[^\x20-\x7e]/g, "");
    // encodeURIComponent leaves ' ( ) * alone; RFC 5987 does not allow them.
    const encodedFilename = encodeURIComponent(filename).replace(
      /['()*]/g,
      (char) => "%" + char.charCodeAt(0).toString(16).toUpperCase(),
    );

    logExportResult({
      result: "success",
      startedAt,
      draftId: auditDraftId,
      clientName: deckDetails.clientName,
      pageCount,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate the presentation PDF.";
    logExportResult({
      result: "error: " + message.slice(0, 200),
      startedAt,
      draftId: auditDraftId,
      clientName: deckDetails.clientName,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
