/**
 * Environment-aware Chromium launcher for PDF export.
 *
 * Local dev / CI: tries system Chrome/Edge first, falls back to Playwright's
 * own bundled Chromium (same behavior as scripts/export-pdf.mjs — untouched).
 *
 * Vercel (or any environment with VERCEL set, which Vercel sets
 * automatically on every deployment): system Chrome doesn't exist and
 * Playwright's bundled browser is too large for the serverless bundle. Uses
 * @sparticuz/chromium (a Chromium build packaged specifically for AWS
 * Lambda / Vercel serverless functions) via playwright-core instead.
 *
 * Install:
 *   npm install playwright-core @sparticuz/chromium
 *
 * The API route should import ONLY from this file for its browser launch —
 * don't import `chromium` from "playwright" directly in route.ts, or the
 * full (browser-bundled) package will try to get pulled into the serverless
 * function trace.
 */

import { chromium as playwrightChromium, type Browser } from "playwright-core";

/** Mirrors scripts/export-pdf.mjs's candidate list exactly — local dev only. */
async function launchLocalBrowser(): Promise<Browser> {
  const candidates =
    process.platform === "win32"
      ? [{ channel: "msedge" }, { channel: "chrome" }, {}]
      : [{ channel: "chrome" }, {}];

  const errors: string[] = [];

  for (const candidate of candidates) {
    try {
      return await playwrightChromium.launch({ headless: true, ...candidate });
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

async function launchServerlessBrowser(): Promise<Browser> {
  // Dynamic import: @sparticuz/chromium is a large, platform-specific
  // package. Keeping the import inside this branch means local dev never
  // needs it installed to run, and Next's file tracing only bundles it for
  // the serverless build where it's actually reached.
  const { default: chromium } = await import("@sparticuz/chromium");

  return await playwrightChromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

/**
 * `VERCEL` is set automatically by Vercel on every deployment (preview and
 * production) — no manual env var configuration needed. Everywhere else
 * (localhost, other hosts) falls through to the local-browser path.
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    return launchServerlessBrowser();
  }

  return launchLocalBrowser();
}