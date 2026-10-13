import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
  outputFileTracingIncludes: {
    // Every export-pdf* route launches Chromium via lib/launch-browser.ts —
    // all of them need browsers.json traced into the standalone output, not
    // just the first one that was wired up.
    "/api/export-pdf/route": ["./node_modules/playwright-core/browsers.json"],
    "/api/export-pdf-sla/route": ["./node_modules/playwright-core/browsers.json"],
    "/api/export-pdf-device/route": ["./node_modules/playwright-core/browsers.json"],
    "/api/export-pdf-presentation/route": ["./node_modules/playwright-core/browsers.json"],
    "/api/export-pdf-combined/route": ["./node_modules/playwright-core/browsers.json"],
  },
};

export default nextConfig;
