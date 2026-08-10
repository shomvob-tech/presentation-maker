import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
  outputFileTracingIncludes: {
    "/api/export-pdf/route": ["./node_modules/playwright-core/browsers.json"],
  },
};

export default nextConfig;
