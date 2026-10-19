/**
 * The running worker, as seen from route handlers.
 *
 * The worker starts from instrumentation.ts, which Next bundles as its own
 * layer, so module-level state isn't shared with the route bundles — the
 * handle lives on `globalThis` instead. This file has no heavy imports, so the
 * routes can wake the worker without pulling Playwright into their trace.
 */

export type HrisWorkerStatus = {
  enabled: boolean;
  running: boolean;
  id: string;
  queue: string;
  lastJobTickAt: string | null;
  lastWebhookTickAt: string | null;
  loopRestarts: { jobs: number; webhooks: number };
  inFlight: { jobId: string; renderAgeSeconds: number }[];
  concurrency: number;
  lastError: string | null;
};

export type HrisWorkerHandle = {
  id: string;
  queue: string;
  wakeJobs(): void;
  wakeWebhooks(): void;
  status(): HrisWorkerStatus;
};

const KEY = Symbol.for("pb.hris.worker");
const store = globalThis as unknown as Record<symbol, HrisWorkerHandle | undefined>;

export function getHrisWorkerHandle(): HrisWorkerHandle | null {
  return store[KEY] ?? null;
}

/** False if a worker is already registered in this process. */
export function setHrisWorkerHandle(handle: HrisWorkerHandle): boolean {
  if (store[KEY]) return false;
  store[KEY] = handle;
  return true;
}

/** Called after a job is created; a no-op when the worker is disabled. */
export function wakeHrisWorker(): void {
  getHrisWorkerHandle()?.wakeJobs();
}
