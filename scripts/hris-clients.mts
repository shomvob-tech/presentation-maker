/**
 * Builds and checks HRIS_CLIENTS_B64, the client registry for the async HRIS
 * document API (lib/hris/clients.ts).
 *
 *   npm run hris:clients -- --new-key
 *       A new API key and its sha256. Give HRIS the key; the registry stores the hash.
 *   npm run hris:clients -- --new-secret
 *       A new webhook secret (whsec_…). Goes in the registry AND to HRIS.
 *   npm run hris:clients -- --encode clients.local.json [--queue staging]
 *       Validates a registry file and prints its base64 for Jenkins. Entries may
 *       use plaintext "apiKeys" (hashed here) or "apiKeySha256".
 *   npm run hris:clients -- --decode [<base64>]
 *       Ids, scopes and webhook kinds of a registry (default: HRIS_CLIENTS_B64
 *       from .env.local). Never prints keys, hashes or secrets.
 *   npm run hris:clients -- --local-env [--queue local-yourname]
 *       Prints a complete local test setup as .env lines (fresh keys, a
 *       webhook secret, clients local-test, local-test-b, local-hold,
 *       local-none). Append it to .env.local: it contains secrets.
 *
 * *.local.json files are gitignored.
 */

import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const newKey = () => randomBytes(32).toString("hex");
const newSecret = () => `whsec_${randomBytes(32).toString("base64")}`;
const toB64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64");

async function validate(b64: string, queue: string) {
  process.env.HRIS_CLIENTS_B64 = b64;
  process.env.HRIS_QUEUE_NAME = queue;
  const { loadHrisClients } = await import("../lib/hris/clients");
  return loadHrisClients();
}

function describe(clients: readonly { id: string; scopes: ReadonlySet<string>; webhook: { kind: string } }[]) {
  for (const client of clients) {
    console.log(`  ${client.id.padEnd(16)} webhook=${client.webhook.kind.padEnd(5)} scopes=${[...client.scopes].join(",")}`);
  }
}

if (flag("--new-key")) {
  const key = newKey();
  console.log(`API key (give to HRIS, privately): ${key}`);
  console.log(`sha256 (goes in apiKeySha256):     ${sha256(key)}`);
} else if (flag("--new-secret")) {
  console.log(newSecret());
} else if (flag("--encode")) {
  const file = option("--encode");
  if (!file) throw new Error("--encode needs a file");
  const entries = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>[];
  const registry = entries.map(({ apiKeys, ...rest }) =>
    Array.isArray(apiKeys) ? { ...rest, apiKeySha256: (apiKeys as string[]).map(sha256) } : rest,
  );
  const b64 = toB64(registry);
  const result = await validate(b64, option("--queue") ?? "staging");
  if (!result.ok) {
    console.error(`Invalid registry: ${result.error}`);
    process.exit(1);
  }
  describe(result.clients);
  console.log(`\nHRIS_CLIENTS_B64=${b64}`);
} else if (flag("--decode")) {
  const b64 = args.find((arg) => !arg.startsWith("--")) ?? process.env.HRIS_CLIENTS_B64 ?? "";
  const result = await validate(b64, option("--queue") ?? process.env.HRIS_QUEUE_NAME ?? "staging");
  if (!result.ok) {
    console.error(`Invalid registry: ${result.error}`);
    process.exit(1);
  }
  describe(result.clients);
} else if (flag("--local-env")) {
  const queue = option("--queue") ?? "local-yourname";
  if (!queue.startsWith("local-")) throw new Error("--queue must start with local-");
  const keys = { a: newKey(), b: newKey(), hold: newKey(), none: newKey() };
  const secret = newSecret();
  const hook = { url: "http://localhost:4000/hook", secrets: [secret] };
  const registry = [
    { id: "local-test", apiKeySha256: [sha256(keys.a)], webhook: hook },
    { id: "local-test-b", apiKeySha256: [sha256(keys.b)], webhook: hook },
    { id: "local-hold", apiKeySha256: [sha256(keys.hold)], webhook: "hold" },
    { id: "local-none", apiKeySha256: [sha256(keys.none)], webhook: "none" },
  ];
  const b64 = toB64(registry);
  const result = await validate(b64, queue);
  if (!result.ok) throw new Error(result.error);
  console.log(
    [
      "",
      "# --- HRIS async document API: local test setup (npm run hris:clients -- --local-env) ---",
      `HRIS_QUEUE_NAME=${queue}`,
      "HRIS_WORKER_ENABLED=true",
      "HRIS_WORKER_LEASE_SECONDS=20",
      "HRIS_TEST_HOOKS=true",
      `HRIS_CLIENTS_B64=${b64}`,
      `HRIS_TEST_API_KEY=${keys.a}`,
      `HRIS_TEST_API_KEY_B=${keys.b}`,
      `HRIS_TEST_API_KEY_HOLD=${keys.hold}`,
      `HRIS_TEST_API_KEY_NONE=${keys.none}`,
      `HRIS_TEST_WEBHOOK_SECRET=${secret}`,
      "",
    ].join("\n"),
  );
} else {
  console.error("Usage: --new-key | --new-secret | --encode <file> [--queue q] | --decode [b64] | --local-env [--queue local-x]");
  process.exit(1);
}
