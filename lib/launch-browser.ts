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
 * Setup required:
 *   npm uninstall @sparticuz/chromium   (if still installed — check package.json)
 *   npm install @sparticuz/chromium-min
 *   Download the release asset matching the EXACT installed chromium-min
 *   version from https://github.com/Sparticuz/chromium/releases —
 *   chromium-vX.X.X-pack.x64.tar for Vercel's default x64 runtime — and
 *   place it at public/chromium-pack.tar. Version mismatch = launch failure.
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

// Cached across warm invocations of the same function instance — avoids
// re-downloading and re-extracting the ~65MB pack on every request. Cold
// starts still pay this cost once.
let cachedExecutablePath: string | null = null;

function resolvePackUrl(): string {
  // VERCEL_URL is set automatically by Vercel for every deployment
  // (production and preview) — no manual configuration needed. Falls back
  // to localhost only so this function doesn't crash if somehow called
  // outside a Vercel deployment without VERCEL_URL set.
  const host = process.env.VERCEL_URL ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}/chromium-pack.tar`;
}

async function launchServerlessBrowser(): Promise<Browser> {
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