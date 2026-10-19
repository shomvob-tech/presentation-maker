/**
 * Typed wrappers around the pipeline's SQL functions and tables
 * (supabase/pb_hris_document_*.sql). Every state change goes through a
 * function so its checks (lease token, ledger, idempotency) run inside one
 * database transaction.
 *
 * SERVER ONLY — uses the service-role client.
 */

import { getClient } from "./storage";
import type { DocumentRequest } from "./document-input";
import { toStoredInput } from "./document-input";

export type HrisJobStatus = "queued" | "processing" | "ready" | "failed";

export type PendingUpload = { sha256: string; sizeBytes: number; pageCount: number; at?: string };

/** A pb_hris_document_jobs row. The enqueue result omits input, logo and ledger. */
export type DocumentJobRow = {
  id: string;
  queue: string;
  client_id: string;
  idempotency_key: string;
  request_sha256: string;
  tenant_id: string;
  quotation_id: string;
  doc_type: "proposal";
  version: number;
  bucket: "proposal-pdfs";
  object_key: string;
  client_name: string;
  hrm_modules: string[];
  input?: unknown;
  logo_data_url?: string | null;
  requested_by: string | null;
  status: HrisJobStatus;
  attempts: number;
  max_attempts: number;
  adoption_grace_used: boolean;
  run_at: string;
  lease_token: string | null;
  lease_expires_at: string | null;
  locked_by: string | null;
  pending_uploads?: PendingUpload[];
  sha256: string | null;
  size_bytes: number | null;
  page_count: number | null;
  app_version: string | null;
  error_code: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export type WebhookDeliveryStatus = "pending" | "delivering" | "delivered" | "abandoned" | "skipped";

export type WebhookDeliveryRow = {
  id: string;
  event_id: string;
  job_id: string;
  client_id: string;
  queue: string;
  event_type: "document.ready" | "document.failed";
  body: string | null;
  status: WebhookDeliveryStatus;
  attempts: number;
  first_attempt_at: string | null;
  next_attempt_at: string;
  lease_token: string | null;
  lease_expires_at: string | null;
  last_status_code: number | null;
  last_error: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

/** The delivery columns embedded in GET /api/v1/documents/{jobId}. */
export type DeliverySummary = Pick<
  WebhookDeliveryRow,
  "event_id" | "status" | "attempts" | "last_status_code" | "delivered_at"
>;

export type EnqueueOutcome = {
  outcome: "created" | "replayed" | "key_reused";
  job: DocumentJobRow;
};

export type UploadResult = { sha256: string; sizeBytes: number; pageCount: number };

/** The SQL isn't applied (or is out of date). The routes answer 503 not_configured. */
export class SchemaMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaMissingError";
  }
}

type DbError = { code?: string; message: string };

/** PostgREST: PGRST202 unknown function, PGRST205 unknown table; Postgres: 42P01, 42883. */
export function isMissingSchemaError(error: DbError): boolean {
  return ["PGRST202", "PGRST205", "42P01", "42883"].includes(error.code ?? "");
}

function raise(context: string, error: DbError): never {
  if (isMissingSchemaError(error)) throw new SchemaMissingError(`${context}: ${error.message}`);
  throw new Error(`${context}: ${error.message}`);
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getClient().rpc(name, args);
  if (error) raise(name, error);
  return data as T;
}

const JOBS = "pb_hris_document_jobs";

/** Columns safe to read outside the worker: no logo, no stored input. */
const JOB_PUBLIC_COLUMNS =
  "id, queue, client_id, idempotency_key, request_sha256, tenant_id, quotation_id, doc_type, version, " +
  "bucket, object_key, client_name, hrm_modules, requested_by, status, attempts, max_attempts, " +
  "adoption_grace_used, run_at, lease_token, lease_expires_at, locked_by, sha256, size_bytes, page_count, " +
  "app_version, error_code, last_error, created_at, updated_at, started_at, completed_at";

export async function enqueueDocumentJob(args: {
  queue: string;
  clientId: string;
  idempotencyKey: string;
  fingerprint: string;
  request: DocumentRequest;
}): Promise<EnqueueOutcome> {
  const { request } = args;
  return rpc<EnqueueOutcome>("pb_hris_enqueue_document", {
    p_queue: args.queue,
    p_client_id: args.clientId,
    p_idempotency_key: args.idempotencyKey,
    p_request_sha256: args.fingerprint,
    p_tenant_id: request.tenantId,
    p_quotation_id: request.quotationId,
    p_doc_type: request.docType,
    p_client_name: request.clientName,
    p_hrm_modules: request.hrmModules,
    p_input: toStoredInput(request.details),
    p_logo_data_url: request.logoDataUrl ?? null,
    p_requested_by: request.requestedBy ?? null,
  });
}

export async function findJobByKey(clientId: string, idempotencyKey: string): Promise<DocumentJobRow | null> {
  const { data, error } = await getClient()
    .from(JOBS)
    .select(JOB_PUBLIC_COLUMNS)
    .eq("client_id", clientId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (error) raise("findJobByKey", error);
  return (data as unknown as DocumentJobRow | null) ?? null;
}

/** Scoped to the calling client: another client's job reads as not found. */
export async function getDocumentJobForClient(
  jobId: string,
  clientId: string,
): Promise<{ job: DocumentJobRow; delivery: DeliverySummary | null } | null> {
  const { data, error } = await getClient()
    .from(JOBS)
    .select(
      `${JOB_PUBLIC_COLUMNS}, pb_hris_webhook_deliveries(event_id, status, attempts, last_status_code, delivered_at)`,
    )
    .eq("id", jobId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) raise("getDocumentJobForClient", error);
  if (!data) return null;

  const row = data as unknown as DocumentJobRow & { pb_hris_webhook_deliveries?: DeliverySummary[] };
  const { pb_hris_webhook_deliveries: deliveries, ...job } = row;
  return { job, delivery: deliveries?.[0] ?? null };
}

/** The full row, ledger included (worker only). */
export async function getDocumentJob(jobId: string): Promise<DocumentJobRow | null> {
  const { data, error } = await getClient().from(JOBS).select("*").eq("id", jobId).maybeSingle();
  if (error) raise("getDocumentJob", error);
  return (data as DocumentJobRow | null) ?? null;
}

export function claimDocumentJobs(queue: string, worker: string, limit: number, leaseSeconds: number) {
  return rpc<DocumentJobRow[]>("pb_hris_claim_document_jobs", {
    p_queue: queue,
    p_worker: worker,
    p_limit: limit,
    p_lease_seconds: leaseSeconds,
  });
}

export function heartbeatDocumentJob(jobId: string, leaseToken: string, leaseSeconds: number) {
  return rpc<boolean>("pb_hris_heartbeat_document_job", {
    p_job_id: jobId,
    p_lease_token: leaseToken,
    p_lease_seconds: leaseSeconds,
  });
}

export function noteDocumentUpload(jobId: string, leaseToken: string, result: UploadResult) {
  return rpc<boolean>("pb_hris_note_document_upload", {
    p_job_id: jobId,
    p_lease_token: leaseToken,
    p_sha256: result.sha256,
    p_size_bytes: result.sizeBytes,
    p_page_count: result.pageCount,
  });
}

export function completeDocumentJob(jobId: string, leaseToken: string, result: UploadResult, appVersion: string) {
  return rpc<boolean>("pb_hris_complete_document_job", {
    p_job_id: jobId,
    p_lease_token: leaseToken,
    p_sha256: result.sha256,
    p_size_bytes: result.sizeBytes,
    p_page_count: result.pageCount,
    p_app_version: appVersion,
  });
}

export function failDocumentJob(args: {
  jobId: string;
  leaseToken: string;
  code: string;
  message: string;
  retryable: boolean;
  retryDelaySeconds: number;
}) {
  return rpc<"requeued" | "failed" | "lease_lost">("pb_hris_fail_document_job", {
    p_job_id: args.jobId,
    p_lease_token: args.leaseToken,
    p_error_code: args.code,
    p_error_message: args.message,
    p_retryable: args.retryable,
    p_retry_delay_seconds: args.retryDelaySeconds,
  });
}

export function releaseDocumentJobs(queue: string, worker: string) {
  return rpc<number>("pb_hris_release_document_jobs", { p_queue: queue, p_worker: worker });
}

export function expireForeignLeases(queue: string, worker: string) {
  return rpc<number>("pb_hris_expire_foreign_leases", { p_queue: queue, p_worker: worker });
}

export type QueueStats = {
  queued: number;
  processing: number;
  expiredLeases: number;
  oldestQueuedSeconds: number | null;
  failedLast24h: number;
  readyLast24h: number;
  webhooksPending: number;
  webhooksHeld: number;
  webhooksAbandoned: number;
  oldestPendingWebhookSeconds: number | null;
};

export function documentQueueStats(queue: string, webhookClients: string[]) {
  return rpc<QueueStats>("pb_hris_document_queue_stats", {
    p_queue: queue,
    p_webhook_clients: webhookClients,
  });
}

export function claimWebhookDeliveries(queue: string, clients: string[], limit: number, leaseSeconds: number) {
  return rpc<WebhookDeliveryRow[]>("pb_hris_claim_webhook_deliveries", {
    p_queue: queue,
    p_clients: clients,
    p_limit: limit,
    p_lease_seconds: leaseSeconds,
  });
}

/** Fixes the body on the first attempt and returns it; null means the lease was lost. */
export function setWebhookBody(deliveryId: string, leaseToken: string, body: string) {
  return rpc<string | null>("pb_hris_set_webhook_body", {
    p_delivery_id: deliveryId,
    p_lease_token: leaseToken,
    p_body: body,
  });
}

export function finishWebhookDelivery(args: {
  deliveryId: string;
  leaseToken: string;
  outcome: "delivered" | "retry" | "abandon" | "skip";
  statusCode: number | null;
  error: string | null;
  retryDelaySeconds: number;
}) {
  return rpc<boolean>("pb_hris_finish_webhook_delivery", {
    p_delivery_id: args.deliveryId,
    p_lease_token: args.leaseToken,
    p_outcome: args.outcome,
    p_status_code: args.statusCode,
    p_error: args.error,
    p_retry_delay_seconds: args.retryDelaySeconds,
  });
}
