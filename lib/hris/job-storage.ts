/**
 * The worker's side of diagram step 5: write-once upload of a job's PDF, and
 * adopting a PDF that an earlier attempt stored but never marked complete.
 *
 * SERVER ONLY — service-role storage access.
 *
 * Every upload is noted in the job's ledger (`pending_uploads`) under a valid
 * lease BEFORE it happens, so any object found at a job's key either matches
 * a ledger entry (ours — adopt it) or doesn't (someone else's — never
 * overwrite it).
 */

import { createHash } from "node:crypto";
import { PermanentJobError, RetryableJobError } from "./job-errors";
import { getDocumentJob, type DocumentJobRow, type UploadResult } from "./jobs";
import { getClient, HRIS_BUCKET, isObjectNotFound } from "./storage";

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** `upsert: false`: an object already at the key is a conflict, never an overwrite. */
export function uploadJobPdf(job: DocumentJobRow, pdf: Buffer, sha256: string) {
  return getClient().storage.from(HRIS_BUCKET).upload(job.object_key, pdf, {
    contentType: "application/pdf",
    upsert: false,
    cacheControl: "300",
    // For diagnosis only; correctness relies on the ledger.
    metadata: { jobId: job.id, sha256 },
  });
}

/**
 * The stored result if the object at the job's key is one this job uploaded,
 * null if there is no object. Throws `object_key_conflict` (permanent) for a
 * foreign object, and a retryable error if storage can't be read.
 */
export async function findOwnObject(job: DocumentJobRow): Promise<UploadResult | null> {
  // Re-read the ledger: an earlier lease may have noted an upload after this
  // attempt's claim snapshot was taken.
  const fresh = await getDocumentJob(job.id);
  const ledger = fresh?.pending_uploads ?? job.pending_uploads ?? [];

  const { data, error } = await getClient().storage.from(HRIS_BUCKET).download(job.object_key);
  if (error) {
    if (isObjectNotFound(error as { message?: string; status?: number; statusCode?: string })) return null;
    throw new RetryableJobError("storage_upload_failed", `Could not read ${job.object_key}: ${error.message}`);
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  const sha256 = sha256Hex(bytes);
  const entry = ledger.find((noted) => noted.sha256 === sha256 && noted.sizeBytes === bytes.length);
  if (!entry) {
    throw new PermanentJobError(
      "object_key_conflict",
      `${job.object_key} holds ${bytes.length} bytes (sha256 ${sha256}) that this job never noted.`,
    );
  }
  return { sha256: entry.sha256, sizeBytes: entry.sizeBytes, pageCount: entry.pageCount };
}
