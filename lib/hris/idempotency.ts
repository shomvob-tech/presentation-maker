/**
 * Idempotency-Key handling for POST /api/v1/documents (diagram steps 2-3).
 * Pure — no I/O.
 *
 * The key binds to one job forever: the same key with the same body replays
 * that job, the same key with a different body is a 422. "Same body" is
 * decided by a fingerprint of the raw parsed JSON with object keys sorted, so
 * key order and whitespace don't matter but values (including 25000 vs
 * "25000") do.
 */

import { createHash } from "node:crypto";

const KEY_PATTERN = /^[A-Za-z0-9_.:-]{1,255}$/;

export type IdempotencyKeyResult =
  | { ok: true; key: string }
  | { ok: false; code: "idempotency_key_missing" | "idempotency_key_invalid"; message: string };

export function readIdempotencyKey(headers: Headers): IdempotencyKeyResult {
  const raw = headers.get("idempotency-key");
  if (raw === null || raw.trim() === "") {
    return {
      ok: false,
      code: "idempotency_key_missing",
      message: "The Idempotency-Key header is required.",
    };
  }

  // The IETF draft shows the key as a quoted string; accept one pair of quotes.
  let key = raw.trim();
  if (key.length >= 2 && key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);

  return KEY_PATTERN.test(key)
    ? { ok: true, key }
    : {
        ok: false,
        code: "idempotency_key_invalid",
        message: "Idempotency-Key must be 1-255 characters of letters, digits, '_', '.', ':' or '-'.",
      };
}

/** JSON with object keys sorted at every level; arrays keep their order. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;

  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`);
  return `{${entries.join(",")}}`;
}

/** sha256 (lowercase hex) of the canonical JSON of the raw parsed body. */
export function requestFingerprint(body: unknown): string {
  return createHash("sha256").update(canonicalJson(body)).digest("hex");
}
