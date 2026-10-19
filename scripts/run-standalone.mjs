/**
 * Runs the production standalone build locally, the way the Docker image does:
 * copies public/ and .next/static into .next/standalone (the Dockerfile does
 * the same), then starts `node .next/standalone/server.js` with .env.local
 * loaded. Run `npm run build` first.
 *
 *   npm run start:standalone                 (port 3000)
 *   PORT=3100 npm run start:standalone       (another port)
 *
 * Prints the server PID so a test can kill it (taskkill /PID <pid> /F on
 * Windows, kill -9 elsewhere) and restart it.
 */

import { spawn } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
if (!existsSync(path.join(standalone, "server.js"))) {
  console.error("No .next/standalone/server.js — run `npm run build` first.");
  process.exit(1);
}

cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });

const envFile = path.join(root, ".env.local");
const nodeArgs = [
  ...(existsSync(envFile) ? [`--env-file=${envFile}`] : []),
  path.join(standalone, "server.js"),
];

const child = spawn(process.execPath, nodeArgs, {
  stdio: "inherit",
  // HOSTNAME is the bind address for Next's standalone server; shells often set
  // it to the machine name, so pin it like the Dockerfile does.
  env: { ...process.env, PORT: process.env.PORT ?? "3000", HOSTNAME: "0.0.0.0" },
});
console.log(`[start:standalone] server PID ${child.pid} on port ${process.env.PORT ?? "3000"}`);

const forward = (signal) => () => child.kill(signal);
process.on("SIGINT", forward("SIGINT"));
process.on("SIGTERM", forward("SIGTERM"));
child.on("exit", (code, signal) => {
  console.log(`[start:standalone] server exited (${signal ?? code})`);
  process.exit(code ?? 0);
});
