/**
 * Server-side render of /proposal-preview to PDF, for callers that have the
 * proposal as data rather than a browser tab (the HRIS API today).
 *
 * SERVER ONLY — launches Chromium.
 *
 * Same technique as the export-pdf-* routes: seed the preview page's
 * localStorage before it loads, wait for the A4 pages, print. Three things
 * differ, all because the input arrives from outside rather than from our own
 * form:
 *
 * - The page is loaded from this server directly (INTERNAL_BASE_URL), never
 *   from a URL in the request.
 * - Every request the page makes outside that origin is aborted, and so is any
 *   request to our own /api/*. `problemStatementText` is HTML rendered with
 *   dangerouslySetInnerHTML; without this an <img> or <iframe> in it could
 *   make the server fetch internal addresses and print the result.
 * - Renders are capped at MAX_CONCURRENT_RENDERS. Each one is a full Chromium,
 *   and a burst of API calls must not starve the public site on the same box.
 */

import { launchBrowser } from "@/lib/launch-browser";
import {
  PREVIEW_CLIENT_NAME_KEY,
  PREVIEW_LOGO_KEY,
  PROPOSAL_DETAILS_KEY,
  type ProposalDetails,
} from "@/lib/presentation-session";

const MAX_CONCURRENT_RENDERS = 2;
/** Beyond this many waiting, callers get RenderQueueFullError straight away. */
const MAX_QUEUED_RENDERS = 8;

export class RenderQueueFullError extends Error {
  constructor() {
    super("Too many PDFs are being generated right now. Try again shortly.");
    this.name = "RenderQueueFullError";
  }
}

let activeRenders = 0;
const waitingRenders: (() => void)[] = [];

async function acquireRenderSlot(): Promise<void> {
  if (activeRenders < MAX_CONCURRENT_RENDERS) {
    activeRenders++;
    return;
  }
  if (waitingRenders.length >= MAX_QUEUED_RENDERS) {
    throw new RenderQueueFullError();
  }
  // The releasing render hands its slot straight over, so `activeRenders`
  // is not incremented here.
  await new Promise<void>((resolve) => waitingRenders.push(resolve));
}

function releaseRenderSlot(): void {
  const next = waitingRenders.shift();
  if (next) next();
  else activeRenders--;
}

/**
 * Where Chromium loads the preview from. Inside the container that's the
 * Next server itself on PORT — going out through the public domain would
 * route every render via Cloudflare and back. In development the host must
 * be `localhost`: `next dev` blocks its dev resources for any other host (see
 * allowedDevOrigins). In production it's 127.0.0.1, because the container's
 * server listens on IPv4 only and `localhost` may resolve to ::1 first.
 * Override for a dev server on a non-default port.
 */
function internalBaseUrl(): URL {
  const configured = process.env.INTERNAL_BASE_URL?.trim();
  const host = process.env.NODE_ENV === "production" ? "127.0.0.1" : "localhost";
  return new URL(configured || `http://${host}:${process.env.PORT || 3000}`);
}

export type RenderedPdf = { pdf: Buffer; pageCount: number };

export async function renderProposalPdf(input: {
  clientName: string;
  logoDataUrl?: string;
  details: ProposalDetails;
}): Promise<RenderedPdf> {
  await acquireRenderSlot();

  let browser;
  try {
    const baseUrl = internalBaseUrl();
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      const allowed =
        url.protocol === "data:" ||
        url.protocol === "blob:" ||
        (url.origin === baseUrl.origin && !url.pathname.startsWith("/api/"));
      return allowed ? route.continue() : route.abort("blockedbyclient");
    });

    // Every key the preview components read — see loadClientName,
    // loadPreviewLogo and loadProposalDetails in lib/presentation-session.ts.
    await page.addInitScript(
      ({ nameKey, logoKey, detailsKey, name, logo, details }) => {
        localStorage.setItem(nameKey, name);
        localStorage.setItem(detailsKey, details);
        if (logo) localStorage.setItem(logoKey, logo);
      },
      {
        nameKey: PREVIEW_CLIENT_NAME_KEY,
        logoKey: PREVIEW_LOGO_KEY,
        detailsKey: PROPOSAL_DETAILS_KEY,
        name: input.clientName,
        logo: input.logoDataUrl ?? "",
        details: JSON.stringify(input.details),
      },
    );

    await page.goto(new URL("/proposal-preview", baseUrl).toString(), {
      waitUntil: "load",
      timeout: 60_000,
    });

    await page.waitForFunction(
      () => document.querySelectorAll(".a4-page").length > 0,
      undefined,
      { timeout: 30_000 },
    );

    await page.evaluate(async () => {
      // Each preview section loads its data in its own effect, so pages can
      // arrive across several commits. Wait for the count to hold still.
      let lastCount = -1;
      let stableChecks = 0;
      const deadline = Date.now() + 5_000;
      while (stableChecks < 3 && Date.now() < deadline) {
        const count = document.querySelectorAll(".a4-page").length;
        stableChecks = count === lastCount ? stableChecks + 1 : 0;
        lastCount = count;
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

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
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return { pdf, pageCount };
  } finally {
    await browser?.close();
    releaseRenderSlot();
  }
}
