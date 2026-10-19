/**
 * Runs once when the Next server starts. Starts the HRIS document worker
 * (lib/hris/worker.ts) in this process when HRIS_WORKER_ENABLED=true.
 *
 * Next calls register() after the server is listening and before requests
 * are handled, so it must return quickly: the worker's loops run in the
 * background and never block startup, and a failure here is logged rather
 * than thrown (throwing would abort the server).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.HRIS_WORKER_ENABLED !== "true") return; // default OFF
    try {
      const { startHrisWorker } = await import("./lib/hris/worker");
      startHrisWorker();
    } catch (error) {
      console.error("[hris-worker] failed to start:", error);
    }
  }
}
