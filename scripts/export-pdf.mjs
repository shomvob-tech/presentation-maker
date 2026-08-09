#!/usr/bin/env node
/**
 * Export a presentation or proposal preview page to PDF.
 *
 * Supports legacy 16:9 `<section>` slides and A4 `.a4-page` proposal pages
 * (e.g. /proposal-preview). Uses preferCSSPageSize so @page rules in
 * globals.css control output size.
 *
 * Usage:
 *   npm run pdf
 *   npm run pdf -- --output output/client-deck.pdf
 *   npm run pdf -- --url http://localhost:3000
 *   npm run pdf -- --url http://localhost:3000/proposal-preview --output output/proposal.pdf
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT = path.join(ROOT, "output", "presentation.pdf");

function parseArgs(args) {
  const options = {
    output: DEFAULT_OUTPUT,
    port: null,
    url: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--output" || arg === "-o") {
      const value = args[++index];
      if (!value) throw new Error(`${arg} requires a file path`);
      options.output = path.resolve(ROOT, value);
    } else if (arg === "--url") {
      const value = args[++index];
      if (!value) throw new Error("--url requires a URL");
      options.url = value.replace(/\/$/, "");
    } else if (arg === "--port" || arg === "-p") {
      const value = Number(args[++index]);
      if (!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new Error(`${arg} requires a valid port number`);
      }
      options.port = value;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: npm run pdf -- [--output FILE] [--url URL] [--port PORT]",
      );
      return null;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function spawnNpx(args, options = {}) {
  const command =
    process.platform === "win32"
      ? ["cmd.exe", ["/d", "/s", "/c", "npx", ...args]]
      : ["npx", args];

  return spawn(command[0], command[1], {
    cwd: ROOT,
    env: process.env,
    ...options,
  });
}

function runNpx(args) {
  return new Promise((resolve, reject) => {
    const child = spawnNpx(args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npx ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close(() => {
        if (port) resolve(port);
        else reject(new Error("Could not allocate a port for the PDF server"));
      });
    });
  });
}

async function serverIsAvailable(url, timeout = 5_000) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeout),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeout = 60_000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await serverIsAvailable(url, 2_000)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Next.js did not start at ${url}`);
}

function startProductionServer(port) {
  const child = spawnNpx(["next", "start", "-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => process.stdout.write(data));
  child.stderr.on("data", (data) => process.stderr.write(data));
  return child;
}

async function stopProcessTree(child) {
  if (!child || child.exitCode !== null || !child.pid) return;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn(
        "taskkill",
        ["/pid", String(child.pid), "/T", "/F"],
        { stdio: "ignore" },
      );
      killer.once("error", resolve);
      killer.once("exit", resolve);
    });
  } else {
    child.kill("SIGTERM");
  }
}

async function launchBrowser() {
  const candidates =
    process.platform === "win32"
      ? [{ channel: "msedge" }, { channel: "chrome" }, {}]
      : [{ channel: "chrome" }, {}];
  const errors = [];

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
    ].join("\n"),
  );
}

async function exportPdf(url, output) {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });

    console.log(`Loading ${url}`);
    await page.goto(url, { waitUntil: "load", timeout: 120_000 });

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

    // Strip preview chrome when exporting A4 proposal pages.
    const a4Count = await page.locator(".a4-page").count();
    if (a4Count > 0) {
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
    }

    const sectionCount = await page.locator("section").count();
    const pageCount = a4Count > 0 ? a4Count : sectionCount;
    if (pageCount === 0) {
      throw new Error(
        "No <section> slides or .a4-page proposal pages were found on the page",
      );
    }

    fs.mkdirSync(path.dirname(output), { recursive: true });
    await page.pdf({
      path: output,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    console.log(`Created ${output} (${pageCount} pages)`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options) return;

  let server = null;
  let url = options.url;

  try {
    if (!url && (await serverIsAvailable("http://localhost:3000"))) {
      url = "http://localhost:3000";
      console.log(`Using running development server at ${url}`);
    }

    if (!url) {
      console.log("Building the presentation...");
      await runNpx(["next", "build"]);

      const port = options.port ?? (await getFreePort());
      url = `http://localhost:${port}`;
      server = startProductionServer(port);
      await waitForServer(url);
    }

    await exportPdf(url, options.output);
  } finally {
    await stopProcessTree(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
