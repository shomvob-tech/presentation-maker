/**
 * Diagram steps 4-5 (and the sender for step 6): the queue worker.
 *
 * SERVER ONLY — started once per server process by instrumentation.ts when
 * HRIS_WORKER_ENABLED=true. Not imported by any route: routes reach it
 * through lib/hris/worker-handle.ts.
 *
 * Jobs live in Postgres, not memory, so a crash or redeploy loses nothing:
 *   - claim:     FOR UPDATE SKIP LOCKED, only this worker's queue, only as many
 *                jobs as there are free render slots (a big batch waits in the
 *                table, not in this process).
 *   - lease:     120 s, renewed every 30 s. A dead worker's jobs are reclaimed
 *                when the lease runs out; a worker that loses its lease stops.
 *   - render:    cancellable, 150 s budget from slot acquisition, enforced by
 *                closing Chromium.
 *   - ledger:    the PDF's sha256 is noted before upload; complete accepts only
 *                a noted hash, so a crash between upload and complete is
 *                adopted by the next attempt instead of re-rendered.
 *   - retries:   5 attempts, 30 s / 2 m / 10 m / 30 m apart; then failed, with a
 *                document.failed webhook.
 */

import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import { hasProblemStatementContent, MODULE_SECTION_START_PAGE, moduleSectionPageCount } from "@/lib/module-page-layout";
import {
  internalBaseUrl,
  MAX_CONCURRENT_RENDERS,
  RenderAbortedError,
  RenderQueueFullError,
  RenderTimeoutError,
  renderProposalPdf,
} from "@/lib/render-proposal-pdf";
import {
  appVersion,
  hrisQueueName,
  renderTimeoutOverrideMs,
  testFault,
  testHooksEnabled,
  workerConcurrency,
  workerLeaseSeconds,
} from "./config";
import { parseStoredInput } from "./document-input";
import { PermanentJobError, RetryableJobError } from "./job-errors";
import type { HrisJobErrorCode } from "./job-resource";
import { findOwnObject, sha256Hex, uploadJobPdf } from "./job-storage";
import {
  claimDocumentJobs,
  completeDocumentJob,
  expireForeignLeases,
  failDocumentJob,
  heartbeatDocumentJob,
  noteDocumentUpload,
  releaseDocumentJobs,
  type DocumentJobRow,
  type UploadResult,
} from "./jobs";
import { isUploadConflict } from "./storage";
import { webhookLoop } from "./webhook";
import { getHrisWorkerHandle, setHrisWorkerHandle, type HrisWorkerStatus } from "./worker-handle";
import {
  createWorkerState,
  errMsg,
  heartbeatMs,
  JOB_RETRY_DELAYS_SECONDS,
  sleep,
  sleepOrWake,
  wake,
  workerLog,
  type LoopName,
  type WorkerState,
} from "./worker-state";

const CONCURRENCY = Math.min(Math.max(workerConcurrency(), 1), MAX_CONCURRENT_RENDERS);
const LEASE_SECONDS = workerLeaseSeconds();
const HEARTBEAT_MS = heartbeatMs(LEASE_SECONDS);
/** Heartbeat errors for this long count as a lost lease. */
const HEARTBEAT_LOSS_MS = LEASE_SECONDS * 500;
const RENDER_TIMEOUT_MS = renderTimeoutOverrideMs() ?? 150_000;
/** In-process retries when the complete call itself throws (network). */
const COMPLETE_RETRY_MS = [500, 2000, 5000];
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const SLOW_RENDER_TEST_MS = 40_000;

/** Linux: only what Chromium needs, so no secret reaches it. Elsewhere local Edge/Chrome needs the full env. */
function scrubbedChromiumEnv(): Record<string, string> | undefined {
  if (process.platform !== "linux") return undefined;
  const keep = [
    "PATH",
    "HOME",
    "TMPDIR",
    "LANG",
    "LC_ALL",
    "FONTCONFIG_PATH",
    "FONTCONFIG_FILE",
    "XDG_CONFIG_HOME",
    "XDG_CACHE_HOME",
  ];
  const env: Record<string, string> = {};
  for (const name of keep) {
    const value = process.env[name];
    if (value !== undefined) env[name] = value;
  }
  return env;
}

function classifyJobError(error: unknown): { code: HrisJobErrorCode; message: string; retryable: boolean } {
  if (error instanceof PermanentJobError) return { code: error.code, message: error.message, retryable: false };
  if (error instanceof RetryableJobError) return { code: error.code, message: error.message, retryable: true };
  if (error instanceof RenderTimeoutError) return { code: "render_timeout", message: error.message, retryable: true };
  if (error instanceof RenderQueueFullError) return { code: "render_failed", message: error.message, retryable: true };
  const message = errMsg(error);
  // Playwright/Chromium errors carry their class name or a Chromium protocol message.
  if (/playwright|chromium|browser|page\.|target closed|net::/i.test(message)) {
    return { code: "render_failed", message, retryable: true };
  }
  return { code: "internal_error", message, retryable: true };
}

let failCompleteOnceUsed = false;

/** True if the job is now ready; false if the lease was lost (the next attempt adopts). */
async function completeWithRetry(job: DocumentJobRow, lease: string, result: UploadResult): Promise<boolean> {
  for (let attempt = 0; ; attempt++) {
    try {
      if (testFault() === "fail_complete_once" && !failCompleteOnceUsed) {
        failCompleteOnceUsed = true;
        throw new Error("test fault: fail_complete_once");
      }
      const ok = await completeDocumentJob(job.id, lease, result, appVersion());
      if (!ok) workerLog("lease.lost", { jobId: job.id, at: "complete" }, "warn");
      return ok;
    } catch (error) {
      if (attempt >= COMPLETE_RETRY_MS.length) throw error;
      workerLog("complete.retry", { jobId: job.id, error: errMsg(error) }, "warn");
      await sleep(COMPLETE_RETRY_MS[attempt]);
    }
  }
}

function jobFields(job: DocumentJobRow) {
  return {
    jobId: job.id,
    clientId: job.client_id,
    tenantId: job.tenant_id,
    quotationId: job.quotation_id,
    version: job.version,
    attempt: job.attempts,
  };
}

/** One attempt at one job. Never throws. */
async function runJob(s: WorkerState, job: DocumentJobRow): Promise<void> {
  const lease = job.lease_token!;
  const abort = new AbortController(); // "lease_lost" | "shutdown"
  s.inFlight.set(lease, { jobId: job.id, abort, renderStartedAt: null });

  let lastHeartbeatOk = Date.now();
  const heartbeat = setInterval(() => {
    heartbeatDocumentJob(job.id, lease, LEASE_SECONDS)
      .then((ok) => {
        if (ok) lastHeartbeatOk = Date.now();
        else {
          workerLog("lease.lost", { jobId: job.id, at: "heartbeat" }, "warn");
          abort.abort("lease_lost");
        }
      })
      .catch((error) => {
        workerLog("heartbeat.error", { jobId: job.id, error: errMsg(error) }, "warn");
        if (Date.now() - lastHeartbeatOk > HEARTBEAT_LOSS_MS) abort.abort("lease_lost");
      });
  }, HEARTBEAT_MS);

  try {
    // A. Adopt an object an earlier attempt stored but never completed.
    if ((job.pending_uploads ?? []).length > 0) {
      const own = await findOwnObject(job);
      if (own) {
        workerLog("job.adopted", jobFields(job));
        if (await completeWithRetry(job, lease, own)) workerLog("job.completed", jobFields(job));
        return;
      }
    }

    // B. Render. The input was fixed at enqueue, so the output is the same on every attempt.
    const details = parseStoredInput(job.input);
    if (!details) throw new PermanentJobError("invalid_job_input", "The stored input has an unknown shape.");
    if (testFault() === "render_throw") throw new Error("test fault: render_throw");

    const expectedPageCount =
      MODULE_SECTION_START_PAGE +
      moduleSectionPageCount(details.selectedModules ?? [], hasProblemStatementContent(details.problemStatementText));
    const startedAt = Date.now();
    const { pdf, pageCount } = await renderProposalPdf({
      clientName: job.client_name,
      logoDataUrl: job.logo_data_url ?? undefined,
      details,
      expectedPageCount,
      signal: abort.signal,
      timeoutMs: RENDER_TIMEOUT_MS,
      launchEnv: scrubbedChromiumEnv(),
      onSlotAcquired: () => {
        const entry = s.inFlight.get(lease);
        if (entry) entry.renderStartedAt = Date.now();
      },
      testHang: testFault() === "hang_render",
      testDelayMs: testFault() === "slow_render" ? SLOW_RENDER_TEST_MS : undefined,
    });
    if (abort.signal.aborted) return;
    workerLog("job.rendered", { ...jobFields(job), ms: Date.now() - startedAt, pages: pageCount });

    if (pageCount === 0 || pageCount < expectedPageCount) {
      throw new RetryableJobError("render_incomplete", `${pageCount} < ${expectedPageCount} pages`);
    }
    if (pageCount > expectedPageCount) workerLog("render.extra_pages", { ...jobFields(job), pageCount, expectedPageCount }, "warn");
    if (pdf.byteLength > MAX_PDF_BYTES) throw new PermanentJobError("pdf_too_large", `${pdf.byteLength} bytes`);

    const result: UploadResult = { sha256: sha256Hex(pdf), sizeBytes: pdf.byteLength, pageCount };

    // C. Write-ahead note (lease-checked). Without it, never upload.
    if (!(await noteDocumentUpload(job.id, lease, result))) {
      workerLog("lease.lost", { jobId: job.id, at: "note" }, "warn");
      return;
    }
    if (testFault() === "exit_before_upload") process.exit(137);

    // D. Write-once upload. A conflict is fine only if the object is ours.
    const upload = await uploadJobPdf(job, pdf, result.sha256);
    let stored = result;
    if (upload.error) {
      if (!isUploadConflict(upload.error as { message: string; status?: number; statusCode?: string })) {
        throw new RetryableJobError("storage_upload_failed", upload.error.message);
      }
      const own = await findOwnObject(job);
      if (!own) throw new RetryableJobError("storage_upload_failed", "Upload conflicted but no object is readable.");
      stored = own;
    }
    workerLog("job.uploaded", { ...jobFields(job), bytes: stored.sizeBytes });
    if (testFault() === "exit_after_upload") process.exit(137);

    // E. Complete, writing the webhook delivery in the same transaction.
    if (await completeWithRetry(job, lease, stored)) workerLog("job.completed", jobFields(job));
  } catch (error) {
    // Shutdown or a lost lease: never fail or delay the job; another attempt
    // (here after restart, or on whoever holds the lease) carries on.
    if (s.stopping || abort.signal.reason === "lease_lost" || error instanceof RenderAbortedError) return;

    const c = classifyJobError(error);
    if (c.code === "render_timeout") workerLog("render.timeout", jobFields(job), "warn");
    try {
      const outcome = await failDocumentJob({
        jobId: job.id,
        leaseToken: lease,
        code: c.code,
        message: c.message,
        retryable: c.retryable,
        retryDelaySeconds: JOB_RETRY_DELAYS_SECONDS[Math.min(Math.max(job.attempts, 1) - 1, 3)],
      });
      const event = outcome === "failed" ? "job.failed" : outcome === "requeued" ? "job.retry" : "lease.lost";
      workerLog(event, { ...jobFields(job), code: c.code, error: c.message.slice(0, 300) }, outcome === "requeued" ? "warn" : "error");
    } catch (failError) {
      // DB down: the lease expires and the job is reclaimed.
      workerLog("fail.error", { jobId: job.id, error: errMsg(failError) }, "error");
    }
  } finally {
    clearInterval(heartbeat);
    s.inFlight.delete(lease);
    wake(s, "jobs");
    wake(s, "webhooks");
  }
}

async function jobLoop(s: WorkerState): Promise<void> {
  let idle = 1_000;
  while (!s.stopping) {
    try {
      const free = s.concurrency - s.inFlight.size;
      const jobs = free > 0 ? await claimDocumentJobs(s.queue, s.id, free, LEASE_SECONDS) : [];
      for (const job of jobs) {
        workerLog("claim.ok", jobFields(job));
        void runJob(s, job);
      }
      idle = jobs.length ? 250 : Math.min(idle * 2, 10_000);
      s.lastJobTickAt = Date.now();
    } catch (error) {
      s.lastError = errMsg(error);
      idle = Math.min(Math.max(idle * 2, 2_000), 30_000);
      workerLog("claim.error", { error: errMsg(error) }, "error");
    }
    await sleepOrWake(s, "jobs", idle);
  }
}

/** Restarts a crashed loop after 5 s, counting restarts for /health. */
async function supervise(s: WorkerState, name: LoopName, loop: (s: WorkerState) => Promise<void>): Promise<void> {
  while (!s.stopping) {
    try {
      await loop(s);
    } catch (error) {
      s.loopRestarts[name]++;
      s.lastError = errMsg(error);
      workerLog("loop.crashed", { name, error: errMsg(error) }, "error");
      await sleep(5_000);
    }
  }
}

/** Polls the server itself until it answers, like the Dockerfile HEALTHCHECK. Never gives up. */
async function waitForServer(s: WorkerState): Promise<void> {
  const url = internalBaseUrl().toString();
  const startedAt = Date.now();
  let lastLog = startedAt;
  while (!s.stopping) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (response.status < 500) return;
    } catch {
      // not up yet
    }
    if (Date.now() - lastLog > 30_000) {
      lastLog = Date.now();
      workerLog("worker.waiting_for_server", { url, seconds: Math.round((Date.now() - startedAt) / 1000) }, "warn");
    }
    await sleep(1_000);
  }
}

function installShutdown(s: WorkerState): void {
  const onSignal = (signal: string) => {
    if (s.stopping) return;
    s.stopping = true;
    workerLog("worker.stopping", { signal, inFlight: s.inFlight.size });
    wake(s, "jobs");
    wake(s, "webhooks");
    for (const entry of s.inFlight.values()) entry.abort.abort("shutdown");
    // Best effort: Next exits right after its own cleanup, so this may not land.
    // If it doesn't, the next container expires the leases at boot.
    void releaseDocumentJobs(s.queue, s.id)
      .then((n) => workerLog("worker.released", { jobs: n }))
      .catch(() => undefined);
  };
  process.once("SIGTERM", () => onSignal("SIGTERM"));
  process.once("SIGINT", () => onSignal("SIGINT"));
}

function statusOf(s: WorkerState): HrisWorkerStatus {
  const iso = (at: number | null) => (at ? new Date(at).toISOString() : null);
  return {
    enabled: true,
    running: !s.stopping,
    id: s.id,
    queue: s.queue,
    lastJobTickAt: iso(s.lastJobTickAt),
    lastWebhookTickAt: iso(s.lastWebhookTickAt),
    loopRestarts: { ...s.loopRestarts },
    inFlight: [...s.inFlight.values()].map((entry) => ({
      jobId: entry.jobId,
      renderAgeSeconds: entry.renderStartedAt ? Math.round((Date.now() - entry.renderStartedAt) / 1000) : 0,
    })),
    concurrency: s.concurrency,
    lastError: s.lastError,
  };
}

/** Starts the worker once per process. Returns immediately; the loops run in the background. */
export function startHrisWorker(): void {
  if (getHrisWorkerHandle()) return;

  const queue = hrisQueueName();
  if (!queue) {
    workerLog("worker.not_started", { reason: "HRIS_QUEUE_NAME is not set or invalid; jobs stay queued" }, "error");
    return;
  }

  const id = `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
  const s = createWorkerState(id, queue, CONCURRENCY);
  const registered = setHrisWorkerHandle({
    id,
    queue,
    wakeJobs: () => wake(s, "jobs"),
    wakeWebhooks: () => wake(s, "webhooks"),
    status: () => statusOf(s),
  });
  if (!registered) return;

  installShutdown(s);
  if (testHooksEnabled()) {
    workerLog("worker.test_hooks_enabled", { fault: testFault(), renderTimeoutMs: RENDER_TIMEOUT_MS }, "warn");
  }

  void (async () => {
    await waitForServer(s);
    if (s.stopping) return;
    try {
      const expired = await expireForeignLeases(queue, id);
      workerLog("worker.leases_expired", { n: expired });
    } catch (error) {
      // The claim reaper still recovers them once their leases run out.
      workerLog("worker.expire_error", { error: errMsg(error) }, "warn");
    }
    workerLog("worker.started", { id, queue, concurrency: CONCURRENCY, leaseSeconds: LEASE_SECONDS });
    void supervise(s, "jobs", jobLoop);
    void supervise(s, "webhooks", webhookLoop);
  })();
}
