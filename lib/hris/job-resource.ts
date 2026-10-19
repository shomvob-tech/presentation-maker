/**
 * The job resource: the one JSON shape HRIS sees for a job, in the 202 body,
 * the GET 200 body and the webhook `data` (diagram steps 3, 6 and 7).
 *
 * Never contains a URL (step 8: HRIS signs its own short-lived links), and
 * never contains `last_error`, which can carry internal hostnames — each error
 * code maps to a fixed short message instead.
 */

import type { HrmModuleId } from "./hrm-modules";
import type { DeliverySummary, DocumentJobRow, HrisJobStatus } from "./jobs";

export type HrisJobErrorCode =
  | "render_failed"
  | "render_timeout"
  | "render_incomplete"
  | "pdf_too_large"
  | "storage_upload_failed"
  | "object_key_conflict"
  | "invalid_job_input"
  | "attempts_exhausted"
  | "internal_error";

export const JOB_ERROR_MESSAGES: Record<HrisJobErrorCode, string> = {
  render_failed: "The PDF could not be rendered.",
  render_timeout: "Rendering the PDF timed out.",
  render_incomplete: "The rendered PDF was missing pages.",
  pdf_too_large: "The rendered PDF exceeded the 50 MB limit.",
  storage_upload_failed: "The PDF could not be stored.",
  object_key_conflict: "A different file already exists at this document's storage key.",
  invalid_job_input: "The stored job input could not be rendered.",
  attempts_exhausted: "The document could not be produced after all attempts.",
  internal_error: "An internal error occurred.",
};

export type HrisJobResource = {
  jobId: string;
  idempotencyKey: string;
  status: HrisJobStatus;
  tenantId: string;
  quotationId: string;
  docType: "proposal";
  version: number;
  modules: HrmModuleId[];
  attempts: number;
  document: {
    bucket: "proposal-pdfs";
    objectKey: string;
    sha256: string;
    sizeBytes: number;
    pageCount: number;
  } | null;
  /** The last attempt's error while retrying; the final error once failed. */
  error: { code: HrisJobErrorCode; message: string } | null;
  /** GET only: the state of this job's webhook. */
  notification?: {
    eventId: string;
    status: DeliverySummary["status"];
    attempts: number;
    lastStatusCode: number | null;
    deliveredAt: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

function iso(value: string | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

function errorFor(code: string | null): HrisJobResource["error"] {
  if (!code) return null;
  const known = code in JOB_ERROR_MESSAGES ? (code as HrisJobErrorCode) : "internal_error";
  return { code: known, message: JOB_ERROR_MESSAGES[known] };
}

export function toJobResource(
  row: DocumentJobRow,
  opts: { delivery?: DeliverySummary | null } = {},
): HrisJobResource {
  const ready =
    row.status === "ready" && row.sha256 && row.size_bytes && row.page_count
      ? {
          bucket: row.bucket,
          objectKey: row.object_key,
          sha256: row.sha256,
          sizeBytes: row.size_bytes,
          pageCount: row.page_count,
        }
      : null;

  const resource: HrisJobResource = {
    jobId: row.id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    tenantId: row.tenant_id,
    quotationId: row.quotation_id,
    docType: row.doc_type,
    version: row.version,
    modules: row.hrm_modules as HrmModuleId[],
    attempts: row.attempts,
    document: ready,
    error: row.status === "ready" ? null : errorFor(row.error_code),
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
    completedAt: iso(row.completed_at),
  };

  if (opts.delivery !== undefined) {
    resource.notification = opts.delivery
      ? {
          eventId: opts.delivery.event_id,
          status: opts.delivery.status,
          attempts: opts.delivery.attempts,
          lastStatusCode: opts.delivery.last_status_code,
          deliveredAt: iso(opts.delivery.delivered_at),
        }
      : null;
  }
  return resource;
}
