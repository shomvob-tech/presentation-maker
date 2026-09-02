import { NextRequest, NextResponse } from "next/server";
import { launchBrowser } from "@/lib/launch-browser";
import {
  buildSuggestedSlaPdfFileName,
  isSlaDetails,
  SLA_DETAILS_KEY,
} from "@/lib/sla-session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let url: unknown;
  let slaDetails: unknown;

  try {
    const body = await request.json();
    url = body?.url;
    slaDetails = body?.slaDetails;
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
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
