/**
 * Environment-aware Chromium launcher for PDF export.
 *
 * Local dev / CI: tries system Chrome/Edge first, falls back to Playwright's
 * own bundled Chromium (same behavior as scripts/export-pdf.mjs — untouched).
 *
 * Vercel: uses @sparticuz/chromium-min, NOT the full @sparticuz/chromium
 * package. The full package bundles the actual Chromium binary (~50-60MB),
 * which is a documented source of "works locally, crashes on Vercel"
 * failures — the binary can trigger a native process crash (missing shared
 * libraries) that no JS try/catch can intercept, surfacing as Next's generic
 * platform error page instead of a normal thrown error.
 *
 * chromium-min ships NO binary at all — it downloads one from a URL you
 * provide, once per cold start, into /tmp. That's why executablePath()
 * below takes an argument: without one, there's nothing for it to resolve.
 *
 * The pack file is hosted on Vercel Blob storage (see resolvePackUrl below),
 * not self-hosted in this app's own /public — self-hosting hit Vercel
 * Deployment Protection, which intercepted the function's self-fetch the
 * same way it would an unauthenticated visitor.
 *
 * Setup required:
 *   npm uninstall @sparticuz/chromium   (if still installed — check package.json)
 *   npm install @sparticuz/chromium-min
 *   Upload the release asset matching the EXACT installed chromium-min
 *   version from https://github.com/Sparticuz/chromium/releases —
 *   chromium-vX.X.X-pack.x64.tar for Vercel's default x64 runtime — to the
 *   proposal-chromium Blob store, and set its public URL as CHROMIUM_PACK_URL
 *   in Vercel's Environment Variables (Production + Preview). Version
 *   mismatch between the installed package and the uploaded pack = launch
 *   failure.
 */

import { chromium as playwrightChromium, type Browser } from "playwright-core";

export type LaunchOptions = {
  /**
   * Environment for the Chromium process. Omitted, Chromium inherits the
   * server's full env (the existing behaviour). The HRIS worker passes a
   * scrubbed one so service keys and webhook secrets never reach it.
   */
  env?: Record<string, string>;
};

/** Mirrors scripts/export-pdf.mjs's candidate list exactly — local dev only. */
async function launchLocalBrowser(options: LaunchOptions): Promise<Browser> {
  const candidates =
    process.platform === "win32"
      ? [{ channel: "msedge" }, { channel: "chrome" }, {}]
      : [{ channel: "chrome" }, {}];

  const errors: string[] = [];

  for (const candidate of candidates) {
    try {
      return await playwrightChromium.launch({
        headless: true,
        ...candidate,
        ...(options.env ? { env: options.env } : {}),
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(
    [
      "Could not launch Edge, Chrome, or Playwright Chromium locally.",
      "Install Edge/Chrome, or run: npx playwright install chromium",
      errors.at(-1),
    ].join("\n"),
  );
}

// Cached across warm invocations of the same function instance — avoids
// re-downloading and re-extracting the ~65MB pack on every request. Cold
// starts still pay this cost once.
let cachedExecutablePath: string | null = null;

function resolvePackUrl(): string {
  // Hosted on Vercel Blob storage (a separate domain from the app itself),
  // NOT self-hosted in /public. Self-hosting on the app's own domain hit
  // Vercel Deployment Protection — the function's self-fetch to its own
  // deployment got intercepted the same way an unauthenticated visitor
  // would be, returning an HTML auth page instead of the tar file (which
  // is what produced the "Invalid tar header" error). Blob storage has no
  // such issue since it's not part of the app's own protected deployment.
  const url = process.env.CHROMIUM_PACK_URL;

  if (!url) {
    throw new Error(
      "CHROMIUM_PACK_URL is not set. Add it in Vercel Project Settings > " +
        "Environment Variables (Production and Preview) — it should point " +
        "to the chromium-pack.tar uploaded in the proposal-chromium Blob store.",
    );
  }

  return url;
}

async function launchServerlessBrowser(options: LaunchOptions): Promise<Browser> {
  // Dynamic import: keeps this package out of the local-dev path entirely,
  // and out of anything Next traces for routes that don't reach this branch.
  const { default: chromium } = await import("@sparticuz/chromium-min");

  if (!cachedExecutablePath) {
    cachedExecutablePath = await chromium.executablePath(resolvePackUrl());
  }

  return await playwrightChromium.launch({
    args: chromium.args,
    executablePath: cachedExecutablePath,
    headless: true,
    ...(options.env ? { env: options.env } : {}),
  });
}

/**
 * `VERCEL` is set automatically by Vercel on every deployment (preview and
 * production) — no manual env var configuration needed. Everywhere else
 * (localhost, other hosts) falls through to the local-browser path.
 */
export async function launchBrowser(options: LaunchOptions = {}): Promise<Browser> {
  if (process.env.VERCEL) {
    return launchServerlessBrowser(options);
  }

  return launchLocalBrowser(options);
}