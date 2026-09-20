import { after, NextRequest, NextResponse } from "next/server";
import { launchBrowser } from "@/lib/launch-browser";
import {
  buildSuggestedDevicePdfFileName,
  DEVICE_DETAILS_KEY,
  DEVICE_LOGO_KEY,
  isDeviceProposalDetails,
} from "@/lib/device-session";
import { toDhakaTimestamp } from "@/lib/audit/events";
import { safeAppendAuditRow } from "@/lib/audit/sheets";

// Chromium cannot run on the Edge runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

/** The device proposal is always four pages — cover, letter, quotation, terms. */
const EXPECTED_PAGE_COUNT = 4;

/**
 * Server-side outcome of a device export — see the proposal route for the one
 * blind spot (a hard timeout writes no row, showing up as an `export_clicked`
 * with no matching `export_result`).
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
      doc_type: "device",
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
  let deviceDetails: unknown;
  let logoDataUrl: unknown;
  let auditDraftId: unknown;

  const startedAt = Date.now();

  try {
    const body = await request.json();
    url = body?.url;
    deviceDetails = body?.deviceDetails;
    logoDataUrl = body?.logoDataUrl;
    auditDraftId = body?.auditDraftId;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof url !== "string" || !url) {
    return NextResponse.json(
      { error: "A device preview URL is required." },
      { status: 400 },
    );
  }
  if (!isDeviceProposalDetails(deviceDetails)) {
    return NextResponse.json(
      { error: "Valid device proposal details are required." },
      { status: 400 },
    );
  }

  let previewUrl: URL;
  try {
    previewUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { error: "The device preview URL is invalid." },
      { status: 400 },
    );
  }

  // Same guard as the SLA route: this endpoint renders whatever URL it is
  // given in a real browser, so it only ever renders our own preview route.
  if (
    previewUrl.origin !== request.nextUrl.origin ||
    previewUrl.pathname !== "/device-preview"
  ) {
    return NextResponse.json(
      { error: "Only this application's device preview route can be exported." },
      { status: 400 },
    );
  }

  const hasLogo =
    typeof logoDataUrl === "string" && logoDataUrl.startsWith("data:image/");

  let browser;
  try {
    browser = await launchBrowser();
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
        detailsKey: DEVICE_DETAILS_KEY,
        logoKey: DEVICE_LOGO_KEY,
        details: JSON.stringify(deviceDetails),
        logo: hasLogo ? String(logoDataUrl) : "",
      },
    );

    await page.goto(previewUrl.toString(), { waitUntil: "load", timeout: 120_000 });

    // All four pages, not just the first — the preview renders them in one
    // commit, so anything less means the page is still coming up.
    await page.waitForFunction(
      (expected: number) =>
        document.querySelectorAll(".a4-page").length >= expected,
      EXPECTED_PAGE_COUNT,
      { timeout: 30_000 },
    );

    await page.evaluate(async () => {
      await document.fonts?.ready;
      await Promise.race([
        Promise.all(
          [...document.images].map((image) => image.decode().catch(() => undefined)),
        ),
        new Promise((resolve) => setTimeout(resolve, 10_000)),
      ]);
    });
    await page.emulateMedia({ media: "print" });

    const pageCount = await page.locator(".a4-page").count();

    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const filename = buildSuggestedDevicePdfFileName(deviceDetails.clientName);

    logExportResult({
      result: "success",
      startedAt,
      draftId: auditDraftId,
      clientName: deviceDetails.clientName,
      pageCount,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate the device proposal PDF.";
    logExportResult({
      result: "error: " + message.slice(0, 200),
      startedAt,
      draftId: auditDraftId,
      clientName: deviceDetails.clientName,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
