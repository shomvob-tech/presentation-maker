import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

/**
 * Tries the same browser candidates as scripts/export-pdf.mjs: system Edge
 * or Chrome first (already installed on most machines), falling back to the
 * Playwright-managed Chromium if neither is available.
 */
async function launchBrowser() {
  const candidates =
    process.platform === "win32"
      ? [{ channel: "msedge" }, { channel: "chrome" }, {}]
      : [{ channel: "chrome" }, {}];
  const errors: string[] = [];

  for (const candidate of candidates) {
    try {
      return await chromium.launch({ headless: true, ...candidate });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(
    [
      "Could not launch Edge, Chrome, or Playwright Chromium.",
      "Install Edge/Chrome, or run: npx playwright install chromium",
      errors.at(-1),
    ].join(" "),
  );
}

/**
 * Generates a PDF from a presentation URL using the same section-by-section
 * capture approach as scripts/export-pdf.mjs, exposed here as an API route
 * so the UI can trigger a download directly for a temporary preview link.
 */
export async function POST(request: NextRequest) {
  let url: unknown;

  try {
    const body = await request.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof url !== "string" || !url) {
    return NextResponse.json(
      { error: "A preview URL is required." },
      { status: 400 },
    );
  }

  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    await page.goto(url, { waitUntil: "load", timeout: 120_000 });

    await page.evaluate(async () => {
      for (const section of document.querySelectorAll("section")) {
        section.scrollIntoView();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      window.scrollTo(0, 0);

      await document.fonts?.ready;
      await Promise.race([
        Promise.all(
          [...document.images].map((image) =>
            image.decode().catch(() => undefined),
          ),
        ),
        new Promise((resolve) => setTimeout(resolve, 10_000)),
      ]);
    });

    const slideCount = await page.locator("section").count();
    if (slideCount === 0) {
      return NextResponse.json(
        { error: "No slides were found at the preview URL." },
        { status: 422 },
      );
    }

    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="presentation.pdf"',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
