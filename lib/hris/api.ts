/**
 * Request handling for the async HRIS document API:
 *
 *   POST /api/v1/documents          diagram steps 2-3 (enqueue, 202 + jobId)
 *   GET  /api/v1/documents/{jobId}  diagram step 7 (status, for HRIS's cron)
 *   GET  /api/v1/health             ops
 *
 * HRIS's base URL is https://proposal-builder.shomvob.com/api, so the
 * diagram's `/v1/documents` paths apply literally under it.
 *
 * The route files are thin wrappers around these handlers. Nothing here
 * imports the worker or the renderer, so the route bundles never trace
 * Playwright; a new job just wakes the worker through its globalThis handle.
 */

import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { loadHrisClients, resolveHrisClient, sendableWebhookClientIds, type HrisClient, type HrisScope } from "./clients";
import { hrisQueueName } from "./config";
import { parseDocumentRequest } from "./document-input";
import { readIdempotencyKey, requestFingerprint } from "./idempotency";
import { toJobResource } from "./job-resource";
import {
  documentQueueStats,
  enqueueDocumentJob,
  findJobByKey,
  getDocumentJobForClient,
  SchemaMissingError,
  type DocumentJobRow,
} from "./jobs";
import { clientIp, corsHeaders, isOriginAllowed, rateLimitRetryAfter } from "./request-guards";
import { isStorageConfigured } from "./storage";
import { getHrisWorkerHandle, wakeHrisWorker } from "./worker-handle";

/** A 1 MB logo is ~1.4M base64 characters; everything else is small. */
const MAX_BODY_CHARS = 2_000_000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DOCUMENT_CORS = {
  methods: "GET, POST, OPTIONS",
  allowHeaders: "Content-Type, X-API-Key, Idempotency-Key",
  exposeHeaders: "Location, Retry-After, Idempotent-Replayed, PB-Request-Id",
};

type RateKind = "post" | "get" | "health";

const RATE_LIMITS: Record<RateKind, number> = { post: 600, get: 3000, health: 120 };
const AUTH_FAILURE_LIMIT = 30;

/** Per-request context: the id echoed in PB-Request-Id and the CORS headers to send. */
type Ctx = { requestId: string; cors: Record<string, string> };

function respond(ctx: Ctx, status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: { ...ctx.cors, "Cache-Control": "no-store", "PB-Request-Id": ctx.requestId, ...headers },
  });
}

/** The error envelope, same shape as the legacy route: { error, message, fields?, jobId? }. */
export function hrisError(
  ctx: Ctx,
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Response {
  return respond(ctx, status, { error: code, message, ...extra }, headers);
}

function log(level: "warn" | "error", event: string, fields: Record<string, unknown>) {
  console[level](`[hris-api] ${JSON.stringify({ event, ...fields })}`);
}

let lastConfigWarning = "";

/** Logs a configuration problem once per distinct message, not per request. */
function configProblem(): string | null {
  const clients = loadHrisClients();
  const problem = !clients.ok
    ? clients.error
    : hrisQueueName() === null
      ? "HRIS_QUEUE_NAME is not set or invalid"
      : !isStorageConfigured()
        ? "SUPABASE_URL and SUPABASE_SERVICE_KEY must both be set"
        : null;
  if (problem && problem !== lastConfigWarning) {
    lastConfigWarning = problem;
    log("error", "not_configured", { problem });
  }
  return problem;
}

/**
 * Origin → configuration → API key → per-client rate limit, in that order.
 * Failed keys are rate-limited per IP so guessing is bounded.
 */
export function guardHrisRequest(
  request: NextRequest,
  scope: HrisScope,
  rateKind: RateKind,
): { ok: true; client: HrisClient; ctx: Ctx } | { ok: false; response: Response } {
  const origin = request.headers.get("origin");
  const ctx: Ctx = {
    requestId: randomUUID(),
    cors: scope === "health" ? {} : corsHeaders(origin, DOCUMENT_CORS),
  };

  if (!isOriginAllowed(origin)) {
    return { ok: false, response: hrisError(ctx, 403, "origin_not_allowed", "This origin may not call the HRIS API.") };
  }

  if (configProblem()) {
    return {
      ok: false,
      response: hrisError(ctx, 503, "not_configured", "The HRIS API is not configured on this server.", {}, {
        "Retry-After": "60",
      }),
    };
  }

  const client = resolveHrisClient(request, scope);
  if (!client) {
    const retryAfter = rateLimitRetryAfter(`authfail:${clientIp(request)}`, AUTH_FAILURE_LIMIT);
    if (retryAfter > 0) {
      return {
        ok: false,
        response: hrisError(ctx, 429, "rate_limited", "Too many requests. Try again later.", {}, {
          "Retry-After": String(retryAfter),
        }),
      };
    }
    return { ok: false, response: hrisError(ctx, 401, "unauthorized", "Missing or invalid x-api-key header.") };
  }

  const retryAfter = rateLimitRetryAfter(`${rateKind}:${client.id}`, RATE_LIMITS[rateKind]);
  if (retryAfter > 0) {
    return {
      ok: false,
      response: hrisError(ctx, 429, "rate_limited", "Too many requests. Try again later.", {}, {
        "Retry-After": String(retryAfter),
      }),
    };
  }

  return { ok: true, client, ctx };
}

function accepted(ctx: Ctx, job: DocumentJobRow, replayed: boolean): Response {
  return respond(ctx, 202, toJobResource(job), {
    Location: `/api/v1/documents/${job.id}`,
    ...(replayed ? { "Idempotent-Replayed": "true" } : {}),
  });
}

function storageFailure(ctx: Ctx, error: unknown, event: string): Response {
  if (error instanceof SchemaMissingError) {
    log("error", event, { requestId: ctx.requestId, error: error.message });
    return hrisError(ctx, 503, "not_configured", "The HRIS API is not configured on this server.", {}, {
      "Retry-After": "60",
    });
  }
  log("error", event, { requestId: ctx.requestId, error: error instanceof Error ? error.message : String(error) });
  return hrisError(ctx, 503, "storage_unavailable", "The document store is unavailable. Try again shortly.", {}, {
    "Retry-After": "30",
  });
}

/** POST /api/v1/documents — diagram steps 2-3. */
export async function handleCreateDocument(request: NextRequest): Promise<Response> {
  const guard = guardHrisRequest(request, "documents", "post");
  if (!guard.ok) return guard.response;
  const { client, ctx } = guard;
  const queue = hrisQueueName()!;

  const key = readIdempotencyKey(request.headers);
  if (!key.ok) return hrisError(ctx, 400, key.code, key.message);

  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json\s*(;|$)/i.test(contentType.trim())) {
    return hrisError(ctx, 415, "unsupported_media_type", "Content-Type must be application/json.");
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return hrisError(ctx, 400, "invalid_body", "Could not read the request body.");
  }
  if (raw.length > MAX_BODY_CHARS) {
    return hrisError(ctx, 413, "body_too_large", "Request body is too large.");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return hrisError(ctx, 400, "invalid_json", "Request body must be valid JSON.");
  }

  // Fingerprint the raw body, before defaults, so a retry matches exactly.
  const fingerprint = requestFingerprint(json);

  const parsed = parseDocumentRequest(json);
  if (!parsed.ok) {
    // A body accepted earlier may fail today's rules (e.g. after a deploy);
    // its retry must still replay rather than turn into a permanent 400.
    try {
      const existing = await findJobByKey(client.id, key.key);
      if (existing && existing.request_sha256 === fingerprint) return accepted(ctx, existing, true);
    } catch (error) {
      return storageFailure(ctx, error, "lookup_failed");
    }
    return hrisError(ctx, 400, "invalid_fields", "Some fields are missing or invalid.", { fields: parsed.errors });
  }

  let result;
  try {
    result = await enqueueDocumentJob({
      queue,
      clientId: client.id,
      idempotencyKey: key.key,
      fingerprint,
      request: parsed.value,
    });
  } catch (error) {
    return storageFailure(ctx, error, "enqueue_failed");
  }

  if (result.outcome === "key_reused") {
    log("warn", "idempotency_key_reused", { requestId: ctx.requestId, clientId: client.id, jobId: result.job.id });
    return hrisError(
      ctx,
      422,
      "idempotency_key_reused",
      "This Idempotency-Key was already used with a different body.",
      { jobId: result.job.id },
    );
  }

  if (result.outcome === "created") wakeHrisWorker();
  return accepted(ctx, result.job, result.outcome === "replayed");
}

/** GET /api/v1/documents/{jobId} — diagram step 7. */
export async function handleGetDocument(request: NextRequest, jobId: string): Promise<Response> {
  const guard = guardHrisRequest(request, "documents", "get");
  if (!guard.ok) return guard.response;
  const { client, ctx } = guard;

  if (!UUID_PATTERN.test(jobId)) {
    return hrisError(ctx, 400, "invalid_job_id", "jobId must be a UUID.");
  }

  let found;
  try {
    found = await getDocumentJobForClient(jobId, client.id);
  } catch (error) {
    return storageFailure(ctx, error, "get_failed");
  }
  if (!found) return hrisError(ctx, 404, "not_found", "No such job for this client.");

  const pending = found.job.status === "queued" || found.job.status === "processing";
  return respond(ctx, 200, toJobResource(found.job, { delivery: found.delivery }), pending ? { "Retry-After": "10" } : {});
}

/** GET /api/v1/health — needs a key with the `health` scope; no CORS. */
export async function handleHealth(request: NextRequest): Promise<Response> {
  const guard = guardHrisRequest(request, "health", "health");
  if (!guard.ok) return guard.response;
  const { ctx } = guard;
  const queue = hrisQueueName()!;

  const handle = getHrisWorkerHandle();
  const worker = {
    ...(handle?.status() ?? {
      enabled: false,
      running: false,
      id: "",
      queue,
      lastJobTickAt: null,
      lastWebhookTickAt: null,
      loopRestarts: { jobs: 0, webhooks: 0 },
      inFlight: [],
      concurrency: 0,
      lastError: null,
    }),
    clientsConfigOk: loadHrisClients().ok,
  };

  let stats;
  try {
    stats = await documentQueueStats(queue, sendableWebhookClientIds());
  } catch (error) {
    return storageFailure(ctx, error, "health_stats_failed");
  }

  const body = { worker, queue: stats };
  if (request.nextUrl.searchParams.get("strict") === "1") {
    const now = Date.now();
    const stale = (at: string | null) => !at || now - Date.parse(at) > 60_000;
    const problems = [
      worker.enabled && (stale(worker.lastJobTickAt) || stale(worker.lastWebhookTickAt)) && "worker_stalled",
      !worker.clientsConfigOk && "clients_config",
      (stats.oldestQueuedSeconds ?? 0) > 600 && "queue_backlog",
      stats.expiredLeases > 0 && "expired_leases",
      worker.inFlight.some((job) => job.renderAgeSeconds > 180) && "render_stuck",
      (stats.oldestPendingWebhookSeconds ?? 0) > 3600 && "webhook_backlog",
    ].filter(Boolean);
    if (problems.length > 0) return respond(ctx, 503, { ...body, problems });
  }
  return respond(ctx, 200, body);
}

/** CORS preflight for the document routes. */
export function handleOptions(request: NextRequest): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin"), DOCUMENT_CORS),
  });
}
