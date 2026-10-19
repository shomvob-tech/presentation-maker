/**
 * Who may call the async HRIS API: one entry per HRIS environment, each with
 * its own API key(s) and webhook target.
 *
 * SERVER ONLY — holds webhook secrets.
 *
 * HRIS_CLIENTS_B64 is base64 of a JSON array (base64 survives the quoting in
 * Jenkins' ssh/docker-run string, the same trick as GOOGLE_PRIVATE_KEY_B64):
 *
 *   [ { "id": "hris-staging", "apiKeySha256": ["<64 hex>"],
 *       "webhook": { "url": "https://…", "secrets": ["whsec_…"], "stopOn410": false } },
 *     { "id": "hris-dev",   "apiKeySha256": ["<64 hex>"], "webhook": "hold" },
 *     { "id": "pb-monitor", "apiKeySha256": ["<64 hex>"], "webhook": "none", "scopes": ["health"] } ]
 *
 * Only key HASHES are stored, so the blob never contains a usable key. Two
 * hashes or two secrets per client allow rotation. `scripts/hris-clients.mts`
 * builds and checks the blob.
 *
 * Webhook kinds:
 *   url  — deliveries are sent to it.
 *   hold — not configured yet: deliveries wait unclaimed and use no attempts.
 *   none — never receives webhooks: deliveries end 'skipped'.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { hrisQueueName } from "./config";

export type HrisScope = "documents" | "health";

export type HrisWebhookTarget =
  | { kind: "url"; url: URL; secrets: string[]; stopOn410: boolean }
  | { kind: "hold" }
  | { kind: "none" };

export type HrisClient = {
  id: string;
  apiKeySha256: Buffer[];
  webhook: HrisWebhookTarget;
  scopes: ReadonlySet<HrisScope>;
};

export type LoadResult =
  | { ok: true; clients: readonly HrisClient[] }
  | { ok: false; error: string };

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const SECRET_PATTERN = /^whsec_[A-Za-z0-9+/]+={0,2}$/;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "host.docker.internal"]);
const ALL_SCOPES: HrisScope[] = ["documents", "health"];

let cached: { raw: string; queue: string | null; result: LoadResult } | null = null;

function fail(error: string): LoadResult {
  return { ok: false, error };
}

function parseWebhook(id: string, value: unknown): HrisWebhookTarget | string {
  if (value === "hold") return { kind: "hold" };
  if (value === "none") return { kind: "none" };
  if (!value || typeof value !== "object") {
    return `client ${id}: webhook must be "hold", "none" or { url, secrets }`;
  }

  const { url: rawUrl, secrets, stopOn410 } = value as Record<string, unknown>;
  let url: URL;
  try {
    url = new URL(String(rawUrl));
  } catch {
    return `client ${id}: webhook.url is not a valid URL`;
  }
  if (url.username || url.password) return `client ${id}: webhook.url must not contain credentials`;

  const localHttp =
    url.protocol === "http:" &&
    LOOPBACK_HOSTS.has(url.hostname) &&
    (hrisQueueName()?.startsWith("local-") ?? false);
  if (url.protocol !== "https:" && !localHttp) {
    return `client ${id}: webhook.url must be https (http only for localhost on a local- queue)`;
  }

  if (!Array.isArray(secrets) || secrets.length < 1 || secrets.length > 2) {
    return `client ${id}: webhook.secrets must hold 1 or 2 secrets`;
  }
  for (const secret of secrets) {
    if (typeof secret !== "string" || !SECRET_PATTERN.test(secret)) {
      return `client ${id}: each webhook secret must look like whsec_<base64>`;
    }
    if (Buffer.from(secret.slice(6), "base64").length < 24) {
      return `client ${id}: each webhook secret must decode to at least 24 bytes`;
    }
  }
  if (stopOn410 !== undefined && typeof stopOn410 !== "boolean") {
    return `client ${id}: webhook.stopOn410 must be a boolean`;
  }

  return { kind: "url", url, secrets: secrets as string[], stopOn410: stopOn410 === true };
}

function parseClients(raw: string): LoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return fail("HRIS_CLIENTS_B64 is not base64-encoded JSON");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return fail("HRIS_CLIENTS_B64 must be a non-empty JSON array");
  }

  const ids = new Set<string>();
  const hashes = new Set<string>();
  const clients: HrisClient[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") return fail("every client must be an object");
    const { id, apiKeySha256, webhook, scopes } = entry as Record<string, unknown>;

    if (typeof id !== "string" || !ID_PATTERN.test(id)) {
      return fail(`client id ${JSON.stringify(id)} must match ${ID_PATTERN}`);
    }
    if (ids.has(id)) return fail(`duplicate client id ${id}`);
    ids.add(id);

    if (!Array.isArray(apiKeySha256) || apiKeySha256.length < 1 || apiKeySha256.length > 2) {
      return fail(`client ${id}: apiKeySha256 must hold 1 or 2 hashes`);
    }
    for (const hash of apiKeySha256) {
      if (typeof hash !== "string" || !HASH_PATTERN.test(hash)) {
        return fail(`client ${id}: apiKeySha256 values must be lowercase 64-char hex`);
      }
      if (hashes.has(hash)) return fail(`client ${id}: an API key hash is used twice`);
      hashes.add(hash);
    }

    let scopeSet: Set<HrisScope>;
    if (scopes === undefined) {
      scopeSet = new Set(ALL_SCOPES);
    } else if (
      Array.isArray(scopes) &&
      scopes.length > 0 &&
      scopes.every((scope) => ALL_SCOPES.includes(scope as HrisScope))
    ) {
      scopeSet = new Set(scopes as HrisScope[]);
    } else {
      return fail(`client ${id}: scopes must be a non-empty subset of ${ALL_SCOPES.join(", ")}`);
    }

    const target = parseWebhook(id, webhook);
    if (typeof target === "string") return fail(target);

    clients.push({
      id,
      apiKeySha256: (apiKeySha256 as string[]).map((hash) => Buffer.from(hash, "hex")),
      webhook: target,
      scopes: scopeSet,
    });
  }

  return { ok: true, clients };
}

/**
 * Parsed and validated once per distinct env value (and queue name, which
 * decides whether loopback http webhooks are allowed).
 */
export function loadHrisClients(): LoadResult {
  const raw = process.env.HRIS_CLIENTS_B64?.trim() ?? "";
  const queue = hrisQueueName();
  if (cached?.raw === raw && cached.queue === queue) return cached.result;

  const result = raw ? parseClients(raw) : fail("HRIS_CLIENTS_B64 is not set");
  cached = { raw, queue, result };
  return result;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * The client whose key matches `x-api-key`, if it has `scope`. Every stored
 * hash is compared (no early exit), so timing doesn't reveal which client or
 * how many exist.
 */
export function resolveHrisClient(request: NextRequest, scope: HrisScope): HrisClient | null {
  const loaded = loadHrisClients();
  const provided = request.headers.get("x-api-key")?.trim();
  if (!loaded.ok || !provided) return null;

  const digest = createHash("sha256").update(provided).digest();
  let match: HrisClient | null = null;
  for (const client of loaded.clients) {
    for (const hash of client.apiKeySha256) {
      if (timingSafeEqual(digest, hash) && !match) match = client;
    }
  }
  return match && match.scopes.has(scope) ? match : null;
}

/** Clients whose deliveries the sender may claim: kind 'url' (send) or 'none' (skip). */
export function sendableWebhookClientIds(): string[] {
  const loaded = loadHrisClients();
  if (!loaded.ok) return [];
  return loaded.clients.filter((client) => client.webhook.kind !== "hold").map((client) => client.id);
}

export function getHrisClient(id: string): HrisClient | null {
  const loaded = loadHrisClients();
  return loaded.ok ? (loaded.clients.find((client) => client.id === id) ?? null) : null;
}
