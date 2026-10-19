/**
 * Who may call the HRIS API, and how the browser is told about it.
 *
 * SERVER ONLY — reads HRIS_API_KEY.
 *
 * Two independent checks, and both matter:
 *
 * - CORS (HRIS_ALLOWED_ORIGINS) decides which websites' scripts may call the
 *   API from a browser. It does nothing against curl, Postman or a script —
 *   they never send an Origin header and never enforce CORS. `*` allows every
 *   origin; that's for testing, and tightening it later is an env change.
 * - The API key (HRIS_API_KEY, sent as `x-api-key`) is what actually keeps
 *   everyone else out.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

type OriginPolicy = { anyOrigin: boolean; origins: Set<string> };

let cachedPolicy: { raw: string; policy: OriginPolicy } | null = null;

/**
 * Parsed once per distinct env value. Entries are normalised with `new
 * URL().origin`, so a pasted trailing slash ("https://hr.shomvob.com/") still
 * matches what browsers send. Unparseable entries are dropped. A `*` entry
 * anywhere in the list allows every origin.
 */
function originPolicy(): OriginPolicy {
  const raw = process.env.HRIS_ALLOWED_ORIGINS ?? "";
  if (cachedPolicy?.raw === raw) return cachedPolicy.policy;

  const policy: OriginPolicy = { anyOrigin: false, origins: new Set() };
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (trimmed === "*") {
      policy.anyOrigin = true;
      continue;
    }
    try {
      policy.origins.add(new URL(trimmed).origin);
    } catch {
      console.warn(`[hris-api] Ignoring invalid HRIS_ALLOWED_ORIGINS entry: ${trimmed}`);
    }
  }

  cachedPolicy = { raw, policy };
  return policy;
}

function isListedOrigin(origin: string): boolean {
  const policy = originPolicy();
  return policy.anyOrigin || policy.origins.has(origin);
}

/** No Origin header means a non-browser caller — allowed here, the key still applies. */
export function isOriginAllowed(origin: string | null): boolean {
  return origin === null || isListedOrigin(origin);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = { Vary: "Origin" };
  if (origin && isListedOrigin(origin)) {
    // Echo the origin rather than sending `*`: same effect for this
    // credential-less API, and it works unchanged once the list is narrowed.
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, X-API-Key";
    headers["Access-Control-Max-Age"] = "600";
  }
  return headers;
}

export function isApiKeyConfigured(): boolean {
  return Boolean(process.env.HRIS_API_KEY?.trim());
}

/** Hashing both sides first gives timingSafeEqual equal-length inputs. */
export function hasValidApiKey(request: NextRequest): boolean {
  const expected = process.env.HRIS_API_KEY?.trim();
  const provided = request.headers.get("x-api-key")?.trim();
  if (!expected || !provided) return false;

  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(expected), digest(provided));
}

/** Cloudflare's header first, then what nginx forwards. */
export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

const requestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window limit per IP, in memory. Fine for the single container this
 * runs in; it resets on restart and isn't shared across instances.
 * Returns the seconds to wait when over the limit, or 0 when allowed.
 */
export function rateLimitRetryAfter(ip: string): number {
  const now = Date.now();

  if (requestCounts.size > 10_000) {
    for (const [key, entry] of requestCounts) {
      if (entry.resetAt <= now) requestCounts.delete(key);
    }
  }

  const entry = requestCounts.get(ip);
  if (!entry || entry.resetAt <= now) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return 0;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS
    ? Math.ceil((entry.resetAt - now) / 1000)
    : 0;
}
