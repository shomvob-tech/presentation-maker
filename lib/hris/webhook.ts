/**
 * Diagram step 6: tell HRIS a document is ready (or failed), signed, retried
 * until it answers 2xx.
 *
 * SERVER ONLY.
 *
 * Deliveries come from the pb_hris_webhook_deliveries outbox, written in the
 * same transaction as the job's final state, so an event can never be lost
 * between "job done" and "send". Each delivery goes to its own client's URL
 * (from HRIS_CLIENTS_B64 only — never from a request or the DB), with:
 *   - a stable webhook-id and identical body bytes on every attempt (HRIS
 *     dedupes on the id),
 *   - a fresh webhook-timestamp and signature per attempt,
 *   - no redirects followed.
 * At least once, unordered across jobs.
 */

import { getHrisClient, loadHrisClients, sendableWebhookClientIds, type HrisWebhookTarget } from "./clients";
import { webhookMaxAgeHours, webhookRetryScheduleOverride } from "./config";
import { toJobResource } from "./job-resource";
import {
  claimWebhookDeliveries,
  finishWebhookDelivery,
  getDocumentJob,
  setWebhookBody,
  type WebhookDeliveryRow,
} from "./jobs";
import { signWebhook } from "./webhook-signature";
import { errMsg, sleepOrWake, workerLog, type WorkerState } from "./worker-state";

/** After attempt n: 30 s, 2 m, 10 m, 30 m, 1 h, 2 h, 4 h, 8 h, 12 h, then 24 h forever. */
const RETRY_SCHEDULE_SECONDS = [30, 120, 600, 1800, 3600, 7200, 14400, 28800, 43200, 86400];
const MAX_DELAY_SECONDS = 86400;
const CLAIM_LIMIT = 4;
const LEASE_SECONDS = 60;
const SEND_TIMEOUT_MS = 10_000;
const HOLD_LOG_EVERY_MS = 10 * 60 * 1000;

/**
 * Seconds until the next attempt (±20 % jitter, capped at 24 h), or null to
 * give up — which only happens when a max age is configured and passed.
 * The max age counts from the first real attempt, so time spent held never
 * counts.
 */
export function nextWebhookDelaySeconds(
  attempt: number,
  firstAttemptAt: Date,
  now: Date,
  maxAgeHours: number,
  random: () => number = Math.random,
  schedule: readonly number[] = RETRY_SCHEDULE_SECONDS,
): number | null {
  const base = schedule[Math.min(Math.max(attempt, 1) - 1, schedule.length - 1)];
  const jittered = Math.min(MAX_DELAY_SECONDS, Math.max(1, Math.round(base * (0.8 + random() * 0.4))));

  if (maxAgeHours > 0) {
    const horizon = firstAttemptAt.getTime() + maxAgeHours * 3600 * 1000;
    if (now.getTime() + jittered * 1000 > horizon) return null;
  }
  return jittered;
}

type DeliveryOutcome = { outcome: "delivered" | "retry" | "abandon"; statusCode: number | null; error: string | null };

/** One POST. 2xx delivers; 410 abandons only for a stopOn410 client; anything else retries. */
export async function deliverOne(
  target: Extract<HrisWebhookTarget, { kind: "url" }>,
  delivery: WebhookDeliveryRow,
  body: string,
): Promise<DeliveryOutcome> {
  const timestamp = Math.floor(Date.now() / 1000);
  try {
    const response = await fetch(target.url, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ShomvobProposalBuilder-Webhook/1",
        "webhook-id": delivery.event_id,
        "webhook-timestamp": String(timestamp),
        "webhook-signature": signWebhook(target.secrets, delivery.event_id, timestamp, body),
        "PB-Event-Type": delivery.event_type,
        "PB-Delivery-Attempt": String(delivery.attempts),
      },
      body,
    });
    const text = (await response.text().catch(() => "")).slice(0, 1024);

    if (response.status >= 200 && response.status < 300) {
      return { outcome: "delivered", statusCode: response.status, error: null };
    }
    if (response.status === 410 && target.stopOn410) {
      return { outcome: "abandon", statusCode: 410, error: text || "410 Gone" };
    }
    return { outcome: "retry", statusCode: response.status, error: text || `HTTP ${response.status}` };
  } catch (error) {
    return { outcome: "retry", statusCode: null, error: errMsg(error).slice(0, 1024) };
  }
}

/** The exact bytes sent on every attempt: { type, timestamp, data: job resource }. */
async function buildBody(delivery: WebhookDeliveryRow): Promise<string> {
  const job = await getDocumentJob(delivery.job_id);
  if (!job) throw new Error(`job ${delivery.job_id} not found for ${delivery.event_id}`);
  return JSON.stringify({
    type: delivery.event_type,
    timestamp: new Date(delivery.created_at).toISOString(),
    data: toJobResource(job),
  });
}

async function processDelivery(s: WorkerState, delivery: WebhookDeliveryRow): Promise<void> {
  const lease = delivery.lease_token!;
  const finish = (outcome: "delivered" | "retry" | "abandon" | "skip", statusCode: number | null, error: string | null, delay = 0) =>
    finishWebhookDelivery({
      deliveryId: delivery.id,
      leaseToken: lease,
      outcome,
      statusCode,
      error,
      retryDelaySeconds: delay,
    });

  const client = getHrisClient(delivery.client_id);
  if (!client || client.webhook.kind === "hold") {
    // Only claimed if sendable; the registry changed under us. Try again later.
    await finish("retry", null, "client not sendable", 300);
    return;
  }
  if (client.webhook.kind === "none") {
    await finish("skip", null, null);
    workerLog("webhook.skipped", { eventId: delivery.event_id, clientId: delivery.client_id });
    return;
  }

  const body = delivery.body ?? (await setWebhookBody(delivery.id, lease, await buildBody(delivery)));
  if (body === null) return; // lease lost

  const startedAt = Date.now();
  const result = await deliverOne(client.webhook, delivery, body);
  const fields = {
    eventId: delivery.event_id,
    clientId: delivery.client_id,
    attempt: delivery.attempts,
    status: result.statusCode,
    ms: Date.now() - startedAt,
  };

  if (result.outcome === "delivered") {
    await finish("delivered", result.statusCode, null);
    workerLog("webhook.delivered", fields);
    return;
  }
  if (result.outcome === "abandon") {
    await finish("abandon", result.statusCode, result.error);
    workerLog("webhook.abandoned", { ...fields, reason: "410 with stopOn410" }, "warn");
    return;
  }

  const delay = nextWebhookDelaySeconds(
    delivery.attempts,
    new Date(delivery.first_attempt_at ?? Date.now()),
    new Date(),
    webhookMaxAgeHours(),
    Math.random,
    webhookRetryScheduleOverride() ?? RETRY_SCHEDULE_SECONDS,
  );
  if (delay === null) {
    await finish("abandon", result.statusCode, result.error);
    workerLog("webhook.abandoned", { ...fields, reason: "max age" }, "warn");
    return;
  }
  await finish("retry", result.statusCode, result.error, delay);
  workerLog("webhook.retry", { ...fields, delay, error: result.error?.slice(0, 200) }, "warn");
}

let lastHoldLogAt = 0;
let lastConfigLogAt = 0;

export async function webhookLoop(s: WorkerState): Promise<void> {
  let idle = 2_000;
  while (!s.stopping) {
    let worked = false;
    try {
      const loaded = loadHrisClients();
      if (!loaded.ok) {
        if (Date.now() - lastConfigLogAt > HOLD_LOG_EVERY_MS) {
          lastConfigLogAt = Date.now();
          workerLog("webhook.config_invalid", { error: loaded.error }, "warn");
        }
      } else {
        const held = loaded.clients.filter((client) => client.webhook.kind === "hold").map((client) => client.id);
        if (held.length > 0 && Date.now() - lastHoldLogAt > HOLD_LOG_EVERY_MS) {
          lastHoldLogAt = Date.now();
          workerLog("webhook.held", { clients: held });
        }

        const clients = sendableWebhookClientIds();
        const deliveries = clients.length
          ? await claimWebhookDeliveries(s.queue, clients, CLAIM_LIMIT, LEASE_SECONDS)
          : [];
        worked = deliveries.length > 0;
        const results = await Promise.allSettled(deliveries.map((delivery) => processDelivery(s, delivery)));
        for (const result of results) {
          if (result.status === "rejected") workerLog("webhook.error", { error: errMsg(result.reason) }, "error");
        }
      }
      s.lastWebhookTickAt = Date.now();
      idle = worked ? 0 : Math.min(Math.max(idle * 2, 2_000), 10_000);
    } catch (error) {
      s.lastError = errMsg(error);
      idle = Math.min(Math.max(idle * 2, 2_000), 30_000);
      workerLog("webhook.claim_error", { error: errMsg(error) }, "error");
    }
    await sleepOrWake(s, "webhooks", idle);
  }
}
