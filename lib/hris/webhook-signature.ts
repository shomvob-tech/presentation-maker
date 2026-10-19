/**
 * Standard Webhooks signatures (https://www.standardwebhooks.com), diagram
 * step 6's "HMAC-SHA256". Pure — no I/O.
 *
 *   signature = base64(HMAC_SHA256(base64decode(secret minus "whsec_"),
 *                                  "{webhook-id}.{webhook-timestamp}.{rawBody}"))
 *   header    = "v1,<signature>"  (space-separated, one per secret during rotation)
 *
 * HRIS can verify with any Standard Webhooks library, or with the sample in
 * docs/hris-documents-api-v3.md.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

function secretBytes(secret: string): Buffer {
  return Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
}

function hmac(secret: string, msgId: string, timestamp: number | string, body: string): Buffer {
  return createHmac("sha256", secretBytes(secret)).update(`${msgId}.${timestamp}.${body}`).digest();
}

/** "v1,<b64>" per secret, space-separated. */
export function signWebhook(
  secrets: readonly string[],
  msgId: string,
  timestamp: number,
  body: string,
): string {
  return secrets.map((secret) => `v1,${hmac(secret, msgId, timestamp, body).toString("base64")}`).join(" ");
}

/** True if any v1 signature in the header matches and the timestamp is fresh. */
export function verifyWebhook(
  rawBody: string,
  headers: { id?: string; timestamp?: string; signature?: string },
  secret: string,
  opts: { toleranceSeconds?: number; nowSeconds?: number } = {},
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;

  const t = Number(timestamp);
  const now = opts.nowSeconds ?? Date.now() / 1000;
  if (!Number.isInteger(t) || Math.abs(now - t) > (opts.toleranceSeconds ?? 300)) return false;

  const expected = hmac(secret, id, timestamp, rawBody);
  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const got = Buffer.from(value, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
