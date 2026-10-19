import type { NextRequest } from "next/server";
import { parseHrisProposalInput } from "@/lib/hris/proposal-input";
import {
  clientIp,
  corsHeaders,
  hasValidApiKey,
  isApiKeyConfigured,
  isOriginAllowed,
  rateLimitRetryAfter,
} from "@/lib/hris/request-guards";
import { isStorageConfigured, saveVersionedPdf } from "@/lib/hris/storage";
import { RenderQueueFullError, renderProposalPdf } from "@/lib/render-proposal-pdf";

// Chromium and node:crypto — this cannot run on the Edge runtime.
export const runtime = "nodejs";

// Queue wait + render + upload. nginx in front allows 120s.
export const maxDuration = 120;

/** A 1 MB logo is ~1.4M base64 characters; everything else is small. */
const MAX_BODY_CHARS = 2_000_000;

/**
 * Creates an HRIS proposal PDF, stores it as the next version for the company,
 * and returns where it was stored. Independent of the public builder: it
 * shares only the /proposal-preview template, so both produce identical PDFs.
 *
 * Request:  POST, `x-api-key: <HRIS_API_KEY>`, JSON body — see
 *           lib/hris/proposal-input.ts for the fields.
 * Response: 201 { id, companyId, docType, version, path, url, pageCount,
 *           sizeBytes, createdAt }
 * Errors:   { error: <code>, message, fields? } with 400 / 401 / 403 / 413 /
 *           429 / 500 / 503.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  const fail = (
    status: number,
    error: string,
    message: string,
    extra: Record<string, unknown> = {},
    headers: Record<string, string> = {},
  ) =>
    Response.json(
      { error, message, ...extra },
      { status, headers: { ...cors, ...headers } },
    );

  if (!isOriginAllowed(origin)) {
    return fail(403, "origin_not_allowed", "This origin may not call the HRIS API.");
  }

  const retryAfter = rateLimitRetryAfter(clientIp(request));
  if (retryAfter > 0) {
    return fail(429, "rate_limited", "Too many requests. Try again later.", {}, {
      "Retry-After": String(retryAfter),
    });
  }

  if (!isApiKeyConfigured() || !isStorageConfigured()) {
    console.error(
      "[hris-api] Not configured: HRIS_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_KEY are all required.",
    );
    return fail(503, "not_configured", "The HRIS API is not configured on this server.");
  }

  if (!hasValidApiKey(request)) {
    return fail(401, "unauthorized", "Missing or invalid x-api-key header.");
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(400, "invalid_body", "Could not read the request body.");
  }
  if (raw.length > MAX_BODY_CHARS) {
    return fail(413, "body_too_large", "Request body is too large.");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_json", "Request body must be valid JSON.");
  }

  const parsed = parseHrisProposalInput(json);
  if (!parsed.ok) {
    return fail(400, "invalid_fields", "Some fields are missing or invalid.", {
      fields: parsed.errors,
    });
  }
  const input = parsed.value;

  let rendered;
  try {
    rendered = await renderProposalPdf(input);
  } catch (error) {
    if (error instanceof RenderQueueFullError) {
      return fail(503, "busy", error.message, {}, { "Retry-After": "30" });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[hris-api] Render failed:", message);
    return fail(500, "render_failed", `Could not generate the PDF: ${message}`);
  }

  if (rendered.pageCount === 0) {
    return fail(500, "render_failed", "The proposal rendered with no pages.");
  }

  try {
    const stored = await saveVersionedPdf({
      companyId: input.companyId,
      docType: "proposal",
      clientName: input.clientName,
      pdf: rendered.pdf,
      pageCount: rendered.pageCount,
      // The logo is left out: up to 1 MB per row for something already in the PDF.
      renderInput: {
        clientName: input.clientName,
        logoIncluded: Boolean(input.logoDataUrl),
        details: input.details,
      },
      requestedBy: input.requestedBy,
    });

    return Response.json(stored, { status: 201, headers: cors });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[hris-api] Storage failed:", message);
    return fail(500, "storage_failed", `Could not store the PDF: ${message}`);
  }
}

/** Browser preflight. Only allowed origins get the Access-Control-* headers back. */
export function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
