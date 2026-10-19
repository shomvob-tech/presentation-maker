/**
 * Environment for the async HRIS pipeline. No heavy imports: the route
 * handlers, the worker and the scripts all read it.
 *
 * Test hooks (fault injection, short timeouts, fast webhook retries) are
 * honoured only when HRIS_TEST_HOOKS=true AND the queue is a local one
 * (`local-*`). Jenkins never sets either, so they can't fire on staging. They
 * deliberately don't depend on NODE_ENV, so they also work against the
 * standalone production build used by the integration tests.
 */

const QUEUE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export type HrisTestFault =
  | "exit_before_upload"
  | "exit_after_upload"
  | "fail_complete_once"
  | "render_throw"
  | "slow_render"
  | "hang_render";

const TEST_FAULTS = new Set<HrisTestFault>([
  "exit_before_upload",
  "exit_after_upload",
  "fail_complete_once",
  "render_throw",
  "slow_render",
  "hang_render",
]);

/** HRIS_QUEUE_NAME, or null when unset/invalid (the v1 routes then answer 503). */
export function hrisQueueName(): string | null {
  const queue = process.env.HRIS_QUEUE_NAME?.trim();
  return queue && QUEUE_PATTERN.test(queue) ? queue : null;
}

export function isLocalQueue(): boolean {
  return hrisQueueName()?.startsWith("local-") ?? false;
}

export function testHooksEnabled(): boolean {
  return process.env.HRIS_TEST_HOOKS === "true" && isLocalQueue();
}

export function testFault(): HrisTestFault | null {
  if (!testHooksEnabled()) return null;
  const fault = process.env.HRIS_WORKER_TEST_FAULT?.trim() as HrisTestFault | undefined;
  return fault && TEST_FAULTS.has(fault) ? fault : null;
}

export function workerEnabled(): boolean {
  return process.env.HRIS_WORKER_ENABLED === "true";
}

function positiveInt(raw: string | undefined): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Requested concurrency; the worker clamps it to the renderer's slot count. */
export function workerConcurrency(): number {
  return positiveInt(process.env.HRIS_WORKER_CONCURRENCY) ?? 2;
}

export function workerLeaseSeconds(): number {
  return Math.max(20, positiveInt(process.env.HRIS_WORKER_LEASE_SECONDS) ?? 120);
}

/** Test-hook override for the 150 s render timeout. */
export function renderTimeoutOverrideMs(): number | null {
  return testHooksEnabled() ? positiveInt(process.env.HRIS_WORKER_RENDER_TIMEOUT_MS) : null;
}

/** 0 (the default) means webhooks are never abandoned: retried until 2xx. */
export function webhookMaxAgeHours(): number {
  const n = Number(process.env.HRIS_WEBHOOK_MAX_AGE_HOURS);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Test-hook override for the webhook retry schedule, e.g. "2,2,2". */
export function webhookRetryScheduleOverride(): number[] | null {
  if (!testHooksEnabled()) return null;
  const raw = process.env.HRIS_WEBHOOK_RETRY_SCHEDULE_SECONDS?.trim();
  if (!raw) return null;
  const delays = raw.split(",").map((part) => Number(part.trim()));
  return delays.length > 0 && delays.every((n) => Number.isFinite(n) && n > 0) ? delays : null;
}

export function appVersion(): string {
  return (
    process.env.APP_VERSION?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    "local"
  );
}
