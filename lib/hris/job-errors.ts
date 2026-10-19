/**
 * Errors a worker attempt can end with. The code is what HRIS sees (see
 * lib/hris/job-resource.ts); "retryable" decides whether the job goes back to
 * the queue with a backoff or fails for good.
 */

import type { HrisJobErrorCode } from "./job-resource";

/** Retrying can't help: the job fails now. */
export class PermanentJobError extends Error {
  constructor(
    readonly code: HrisJobErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PermanentJobError";
  }
}

/** A transient problem: the job is retried after a backoff, up to its attempt limit. */
export class RetryableJobError extends Error {
  constructor(
    readonly code: HrisJobErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RetryableJobError";
  }
}
