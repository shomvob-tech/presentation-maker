import { NextRequest, NextResponse } from "next/server";
import { launchBrowser } from "@/lib/launch-browser";
import {
  PRESENTATION_SESSION_KEY,
  PREVIEW_CLIENT_NAME_KEY,
  PREVIEW_LOGO_KEY,
  PROPOSAL_DETAILS_KEY,
  type ProposalDetails,
} from "@/lib/presentation-session";
import {
  isPresentationContent,
  PRESENTATION_CONTENT_SESSION_KEY,
  PREVIEW_CONTENT_KEY,
} from "@/lib/presentation-content-storage";

// Chromium (real or @sparticuz/chromium) cannot run on the Edge runtime —
// this must stay on Node.js.
export const runtime = "nodejs";

// Cold start + page render + font/image wait + PDF export can run well
// past the default timeout. 60s is the Hobby-plan ceiling; raise this if
// you're on Pro/Enterprise and still see timeouts on larger proposals.
export const maxDuration = 60;

function isProposalDetails(value: unknown): value is ProposalDetails {
  if (!value || typeof value !== "object") return false;
  const details = value as Record<string, unknown>;
  return (
    typeof details.documentTitle === "string" &&
    typeof details.preparedDate === "string" &&
    typeof details.recipientTitle === "string" &&
    typeof details.employeeCount === "number" &&
    typeof details.mrcFee === "number" &&
    (details.rolloutCharge === undefined ||
      typeof details.rolloutCharge === "number")
  );
}

/**
 * Generates a PDF from a presentation/proposal URL using the same
 * page-by-page capture approach as scripts/export-pdf.mjs, exposed here as
 * an API route so the UI can trigger a download directly.
 *
 * Supports both legacy 16:9 `<section>` slides and A4 `.a4-page` proposal
 * pages (e.g. /proposal-preview).
 */
export async function POST(request: NextRequest) {
  let url: unknown;
  let logoDataUrl: unknown;
  let clientName: unknown;
  let presentationContent: unknown;
  let proposalDetails: unknown;

  try {
    const body = await request.json();
    url = body?.url;
    logoDataUrl = body?.logoDataUrl;
    clientName = body?.clientName;
    presentationContent = body?.presentationContent;
    proposalDetails = body?.proposalDetails;
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

    const hasLogo =
      typeof logoDataUrl === "string" && logoDataUrl.startsWith("data:image/");
    const hasClientName =
      typeof clientName === "string" && clientName.trim().length > 0;
    const hasContent = isPresentationContent(presentationContent);
    const hasProposalDetails = isProposalDetails(proposalDetails);

    if (hasLogo || hasClientName || hasContent || hasProposalDetails) {
      await page.addInitScript(
        ({
          sessionKey,
          previewLogoKey,
          previewClientNameKey,
          contentSessionKey,
          previewContentKey,
          proposalDetailsKey,
          logo,
          name,
          content,
          details,
        }: {
          sessionKey: string;
          previewLogoKey: string;
          previewClientNameKey: string;
          contentSessionKey: string;
          previewContentKey: string;
          proposalDetailsKey: string;
          logo: string;
          name: string;
          content: string;
          details: string;
        }) => {
          const sessionPayload: {
            logoDataUrl?: string;
            clientDetails?: { clientName: string };
          } = {};

          if (logo) sessionPayload.logoDataUrl = logo;
          if (name) sessionPayload.clientDetails = { clientName: name };

          if (Object.keys(sessionPayload).length > 0) {
            sessionStorage.setItem(sessionKey, JSON.stringify(sessionPayload));
          }
          if (logo) localStorage.setItem(previewLogoKey, logo);
          if (name) localStorage.setItem(previewClientNameKey, name);
          if (content) {
            sessionStorage.setItem(contentSessionKey, content);
            localStorage.setItem(previewContentKey, content);
          }
          if (details) {
            localStorage.setItem(proposalDetailsKey, details);
          }
        },
        {
          sessionKey: PRESENTATION_SESSION_KEY,
          previewLogoKey: PREVIEW_LOGO_KEY,
          previewClientNameKey: PREVIEW_CLIENT_NAME_KEY,
          contentSessionKey: PRESENTATION_CONTENT_SESSION_KEY,
          previewContentKey: PREVIEW_CONTENT_KEY,
          proposalDetailsKey: PROPOSAL_DETAILS_KEY,
          logo: hasLogo ? String(logoDataUrl) : "",
          name: hasClientName ? String(clientName).trim() : "",
          content: hasContent ? JSON.stringify(presentationContent) : "",
          details: hasProposalDetails ? JSON.stringify(proposalDetails) : "",
        },
      );
    }

    await page.goto(url, { waitUntil: "load", timeout: 120_000 });

    if (hasLogo) {
      await page.waitForFunction(
        () => {
          const logos = [
            ...document.querySelectorAll<HTMLImageElement>(
              "img[data-client-logo]",
            ),
          ];
          // Cover may use a plain img without the data attribute — also wait
          // for any data-URL logo image when present.
          const dataLogos = [
            ...document.querySelectorAll<HTMLImageElement>(
              'img[src^="data:image/"]',
            ),
          ];
          return (
            (logos.length > 0 &&
              logos.every((logo) => logo.src.startsWith("data:image/"))) ||
            dataLogos.length > 0
          );
        },
        undefined,
        { timeout: 15_000 },
      ).catch(() => undefined);
    }

    // Wait until either A4 proposal pages or legacy slide sections render.
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".a4-page").length > 0 ||
        document.querySelectorAll("section").length > 0,
      undefined,
      { timeout: 30_000 },
    );

    await page.evaluate(async () => {
      const pages = document.querySelectorAll(".a4-page, section");
      for (const pageEl of pages) {
        pageEl.scrollIntoView();
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

    // Strip preview chrome (labels, edit links, gray backdrop padding) so
    // only physical A4 pages land in the PDF.
    await page.addStyleTag({
      content: `
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            box-shadow: none !important;
          }
          body > * {
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          body > * > *:not(.a4-page):not(:has(.a4-page)) {
            display: none !important;
          }
        }
      `,
    });

    const a4Count = await page.locator(".a4-page").count();
    const sectionCount = await page.locator("section").count();
    const pageCount = a4Count > 0 ? a4Count : sectionCount;

    if (pageCount === 0) {
      return NextResponse.json(
        { error: "No slides or proposal pages were found at the preview URL." },
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
        "Content-Disposition": 'attachment; filename="proposal.pdf"',
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