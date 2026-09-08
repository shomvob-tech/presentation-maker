import { after, NextRequest, NextResponse } from "next/server";
import { launchBrowser } from "@/lib/launch-browser";
import {
  buildSuggestedSlaPdfFileName,
  isSlaDetails,
  SLA_DETAILS_KEY,
} from "@/lib/sla-session";
import { toDhakaTimestamp } from "@/lib/audit/events";
import { safeAppendAuditRow } from "@/lib/audit/sheets";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Server-side outcome of an SLA export — see the proposal route for the one
 * blind spot (a hard timeout writes no row, showing up as an
 * `export_clicked` with no matching `export_result`).
 */
function logExportResult(fields: {
  result: string;
  startedAt: number;
  draftId: unknown;
  clientName: string;
}) {
  const now = new Date();

  after(() =>
    safeAppendAuditRow({
      event_id: "srv-" + now.getTime() + "-" + Math.random().toString(36).slice(2, 8),
      ts_utc: now.toISOString(),
      ts_local: toDhakaTimestamp(now),
      event: "export_result",
      doc_type: "sla",
      draft_id: typeof fields.draftId === "string" ? fields.draftId : "",
      client_name: fields.clientName,
      export_method: "api",
      export_result: fields.result,
      export_ms: Date.now() - fields.startedAt,
      app_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    }),
  );
}

export async function POST(request: NextRequest) {
  let url: unknown;
  let slaDetails: unknown;
  let auditDraftId: unknown;

  const startedAt = Date.now();

  try {
    const body = await request.json();
    url = body?.url;
    slaDetails = body?.slaDetails;
    auditDraftId = body?.auditDraftId;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof url !== "string" || !url) {
    return NextResponse.json({ error: "An SLA preview URL is required." }, { status: 400 });
  }
  if (!isSlaDetails(slaDetails)) {
    return NextResponse.json({ error: "Valid SLA details are required." }, { status: 400 });
  }

  let previewUrl: URL;
  try {
    previewUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "The SLA preview URL is invalid." }, { status: 400 });
  }

  if (
    previewUrl.origin !== request.nextUrl.origin ||
    previewUrl.pathname !== "/sla-preview"
  ) {
    return NextResponse.json(
      { error: "Only this application's SLA preview route can be exported." },
      { status: 400 },
    );
  }

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    await page.addInitScript(
      ({ storageKey, details }) => {
        localStorage.setItem(storageKey, details);
      },
      {
        storageKey: SLA_DETAILS_KEY,
        details: JSON.stringify(slaDetails),
      },
    );

    await page.goto(previewUrl.toString(), {
      waitUntil: "load",
      timeout: 120_000,
    });
    await page.waitForSelector(".sla-doc", { timeout: 30_000 });

    await page.evaluate(async () => {
      await document.fonts?.ready;
    });
    await page.emulateMedia({ media: "print" });

    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const filename = buildSuggestedSlaPdfFileName(slaDetails.clientName);

    logExportResult({
      result: "success",
      startedAt,
      draftId: auditDraftId,
      clientName: slaDetails.clientName,
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
      error instanceof Error ? error.message : "Failed to generate the SLA PDF.";
    logExportResult({
      result: "error: " + message.slice(0, 200),
      startedAt,
      draftId: auditDraftId,
      clientName: slaDetails.clientName,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
