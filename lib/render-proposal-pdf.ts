/**
 * Server-side render of /proposal-preview to PDF, for callers that have the
 * proposal as data rather than a browser tab: the legacy synchronous HRIS
 * route and the async HRIS worker.
 *
 * SERVER ONLY — launches Chromium.
 *
 * Same technique as the export-pdf-* routes: seed the preview page's
 * localStorage before it loads, wait for the A4 pages, print. Differences,
 * all because the input arrives from outside rather than from our own form:
 *
 * - The page is loaded from this server directly (INTERNAL_BASE_URL), never
 *   from a URL in the request.
 * - The page may only make GET requests to this origin (minus /api/*), and may
 *   only navigate to the preview itself. `problemStatementText` is HTML
 *   rendered with dangerouslySetInnerHTML; without this an <img>, <iframe> or
 *   form in it could make the server fetch internal addresses or call its own
 *   API and print the result.
 * - Renders share MAX_CONCURRENT_RENDERS slots across the whole process (on
 *   globalThis, because the worker runs in the instrumentation bundle and the
 *   legacy route in a route bundle). Each render is a full Chromium, and a
 *   burst of API calls must not starve the public site on the same box.
 * - The worker can cancel a render (signal) or bound it (timeoutMs). Either
 *   closes Chromium immediately; the slot is released only after the close.
 */

import type { Browser } from "playwright-core";
import { launchBrowser } from "@/lib/launch-browser";
import {
  PREVIEW_CLIENT_NAME_KEY,
  PREVIEW_LOGO_KEY,
  PROPOSAL_DETAILS_KEY,
  type ProposalDetails,
} from "@/lib/presentation-session";

export const MAX_CONCURRENT_RENDERS = 2;
/** Beyond this many waiting, callers get RenderQueueFullError straight away. */
const MAX_QUEUED_RENDERS = 8;

export class RenderQueueFullError extends Error {
  constructor() {
    super("Too many PDFs are being generated right now. Try again shortly.");
    this.name = "RenderQueueFullError";
  }
}

/** `timeoutMs` elapsed; Chromium was closed. */
export class RenderTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Rendering took longer than ${timeoutMs} ms.`);
    this.name = "RenderTimeoutError";
  }
}

/** `signal` aborted (lease lost or shutdown); Chromium was closed. */
export class RenderAbortedError extends Error {
  constructor() {
    super("Rendering was cancelled.");
    this.name = "RenderAbortedError";
  }
}

type Waiter = { resolve: () => void };
type Slots = { active: number; waiting: Waiter[] };

const SLOTS_KEY = Symbol.for("pb.renderSlots");

function slots(): Slots {
  const store = globalThis as unknown as Record<symbol, Slots | undefined>;
  return (store[SLOTS_KEY] ??= { active: 0, waiting: [] });
}

/** Waits for a slot; leaves the queue and rejects if `signal` aborts first. */
async function acquireRenderSlot(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new RenderAbortedError();
  const state = slots();
  if (state.active < MAX_CONCURRENT_RENDERS) {
    state.active++;
    return;
  }
  if (state.waiting.length >= MAX_QUEUED_RENDERS) {
    throw new RenderQueueFullError();
  }

  // The releasing render hands its slot straight over, so `active` is not
  // incremented here.
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      const index = state.waiting.indexOf(waiter);
      if (index >= 0) state.waiting.splice(index, 1);
      reject(new RenderAbortedError());
    };
    const waiter: Waiter = {
      resolve: () => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      },
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    state.waiting.push(waiter);
  });
}

function releaseRenderSlot(): void {
  const state = slots();
  const next = state.waiting.shift();
  if (next) next.resolve();
  else state.active--;
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
export function internalBaseUrl(): URL {
  const configured = process.env.INTERNAL_BASE_URL?.trim();
  const host = process.env.NODE_ENV === "production" ? "127.0.0.1" : "localhost";
  return new URL(configured || `http://${host}:${process.env.PORT || 3000}`);
}

export type RenderedPdf = { pdf: Buffer; pageCount: number };

export type RenderProposalInput = {
  clientName: string;
  logoDataUrl?: string;
  details: ProposalDetails;
  /** Wait (up to 30 s) for at least this many pages. Never throws on a shortfall. */
  expectedPageCount?: number;
  /** Abort → close Chromium now → RenderAbortedError. */
  signal?: AbortSignal;
  /** Armed AFTER the slot is acquired → close Chromium → RenderTimeoutError. */
  timeoutMs?: number;
  onSlotAcquired?: () => void;
  /** Environment for Chromium (see launchBrowser). */
  launchEnv?: Record<string, string>;
  /** Test hook: never finish (exercises timeoutMs). */
  testHang?: boolean;
  /** Test hook: wait this long after acquiring the slot (a slow render). */
  testDelayMs?: number;
};

export async function renderProposalPdf(input: RenderProposalInput): Promise<RenderedPdf> {
  await acquireRenderSlot(input.signal);
  input.onSlotAcquired?.();

  let browser: Browser | undefined;
  let stopReason: "abort" | "timeout" | null = null;
  // A function, so reads after an await see writes made by the timer/listener.
  const stopped = () => stopReason;
  const stop = (reason: "abort" | "timeout") => {
    if (stopReason) return;
    stopReason = reason;
    void browser?.close().catch(() => undefined);
  };
  const stoppedError = () =>
    stopped() === "timeout" ? new RenderTimeoutError(input.timeoutMs ?? 0) : new RenderAbortedError();

  const onAbort = () => stop("abort");
  input.signal?.addEventListener("abort", onAbort, { once: true });
  if (input.signal?.aborted) stop("abort");
  const timer = input.timeoutMs ? setTimeout(() => stop("timeout"), input.timeoutMs) : null;

  try {
    if (input.testDelayMs) {
      const until = Date.now() + input.testDelayMs;
      while (!stopped() && Date.now() < until) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    if (stopped()) throw stoppedError();

    const baseUrl = internalBaseUrl();
    const previewUrl = new URL("/proposal-preview", baseUrl).toString();
    browser = await launchBrowser(input.launchEnv ? { env: input.launchEnv } : {});
    if (stopped()) throw stoppedError();

    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(30_000);

    await page.route("**/*", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const permitted =
        url.protocol === "data:" ||
        url.protocol === "blob:" ||
        (url.origin === baseUrl.origin && !url.pathname.startsWith("/api/"));
      const ok =
        permitted &&
        request.method() === "GET" &&
        (!request.isNavigationRequest() || request.url() === previewUrl);
      return ok ? route.continue() : route.abort("blockedbyclient");
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

    await page.goto(previewUrl, { waitUntil: "load", timeout: 60_000 });

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

    if (input.expectedPageCount) {
      await page
        .waitForFunction(
          (expected) => document.querySelectorAll(".a4-page").length >= expected,
          input.expectedPageCount,
          { timeout: 30_000 },
        )
        .catch(() => undefined);
    }

    if (input.testHang) await page.evaluate(() => new Promise(() => {}));

    await page.emulateMedia({ media: "print" });

    const pageCount = await page.locator(".a4-page").count();
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    if (stopped()) throw stoppedError();
    return { pdf, pageCount };
  } catch (error) {
    // Closing Chromium makes pending calls reject with Playwright errors;
    // report why it was closed instead.
    if (stopped()) throw stoppedError();
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
    input.signal?.removeEventListener("abort", onAbort);
    await browser?.close().catch(() => undefined);
    releaseRenderSlot();
  }
}
