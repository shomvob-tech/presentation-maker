/**
 * State shared by the worker's two loops (jobs, webhooks): idle sleeps that a
 * new job can cut short, counters for /api/v1/health, and the log format.
 */

/** Heartbeat every lease/4, at most every 30 s. */
export function heartbeatMs(leaseSeconds: number): number {
  return Math.min(30_000, leaseSeconds * 250);
}

/** Backoff after job attempts 1-4 (max_attempts is 5). */
export const JOB_RETRY_DELAYS_SECONDS = [30, 120, 600, 1800] as const;

export type InFlightJob = {
  jobId: string;
  abort: AbortController;
  renderStartedAt: number | null;
};

export type LoopName = "jobs" | "webhooks";

export type WorkerState = {
  id: string;
  queue: string;
  concurrency: number;
  stopping: boolean;
  /** Keyed by lease token, so a reclaimed job's new attempt never collides. */
  inFlight: Map<string, InFlightJob>;
  lastJobTickAt: number | null;
  lastWebhookTickAt: number | null;
  loopRestarts: Record<LoopName, number>;
  lastError: string | null;
  wakers: Record<LoopName, (() => void) | null>;
  pendingWake: Record<LoopName, boolean>;
};

export function createWorkerState(id: string, queue: string, concurrency: number): WorkerState {
  return {
    id,
    queue,
    concurrency,
    stopping: false,
    inFlight: new Map(),
    lastJobTickAt: null,
    lastWebhookTickAt: null,
    loopRestarts: { jobs: 0, webhooks: 0 },
    lastError: null,
    wakers: { jobs: null, webhooks: null },
    pendingWake: { jobs: false, webhooks: false },
  };
}

/** Sleeps `ms`, or less if `wake(name)` is called (including just before). */
export function sleepOrWake(s: WorkerState, name: LoopName, ms: number): Promise<void> {
  if (s.pendingWake[name] || s.stopping) {
    s.pendingWake[name] = false;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      s.wakers[name] = null;
      resolve();
    }
    s.wakers[name] = done;
  });
}

export function wake(s: WorkerState, name: LoopName): void {
  const waker = s.wakers[name];
  if (waker) waker();
  else s.pendingWake[name] = true;
}

export function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** One JSON line per event. Never pass logos, keys, secrets or request bodies. */
export function workerLog(event: string, fields: Record<string, unknown> = {}, level: "log" | "warn" | "error" = "log") {
  console[level](`[hris-worker] ${JSON.stringify({ event, ...fields })}`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
