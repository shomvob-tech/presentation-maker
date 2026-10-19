/**
 * Read-only consistency report for the async HRIS pipeline (plan §10.5).
 * Exits non-zero if it finds anything.
 *
 *   npm run hris:reconcile [-- --verify-sha] [--queue staging]
 *
 * Reports: documents/ objects with no job; ready jobs whose object is missing
 * or differs in size (or sha256 with --verify-sha); failed jobs that have an
 * object at their key; processing jobs whose lease expired > 10 min ago;
 * queued jobs older than 30 min; pending deliveries older than 1 h; abandoned
 * deliveries; leftover quotations/ objects from the never-deployed 6abdfc6.
 */

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to the environment
}

const args = process.argv.slice(2);
const verifySha = args.includes("--verify-sha");
const queueIndex = args.indexOf("--queue");
const queue = queueIndex >= 0 ? args[queueIndex + 1] : undefined;

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bucket = supabase.storage.from("proposal-pdfs");

type StoredObject = { name: string; size: number | null };

/** Every object under a prefix (Storage lists one folder level per call). */
async function listAll(prefix: string): Promise<StoredObject[]> {
  const found: StoredObject[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await bucket.list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list ${prefix}: ${error.message}`);
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) found.push(...(await listAll(path)));
      else found.push({ name: path, size: (entry.metadata as { size?: number } | null)?.size ?? null });
    }
    if (data.length < pageSize) break;
  }
  return found;
}

type Job = {
  id: string;
  queue: string;
  status: string;
  object_key: string;
  sha256: string | null;
  size_bytes: number | null;
  lease_expires_at: string | null;
  created_at: string;
};

async function allJobs(): Promise<Job[]> {
  const jobs: Job[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from("pb_hris_document_jobs")
      .select("id, queue, status, object_key, sha256, size_bytes, lease_expires_at, created_at")
      .range(from, from + 999);
    if (queue) query = query.eq("queue", queue);
    const { data, error } = await query;
    if (error) throw new Error(`jobs: ${error.message}`);
    jobs.push(...(data as Job[]));
    if (data.length < 1000) break;
  }
  return jobs;
}

const findings: string[] = [];
const now = Date.now();
const jobs = await allJobs();
const objects = new Map((await listAll("documents")).map((object) => [object.name, object]));
const jobKeys = new Set(jobs.map((job) => job.object_key));

for (const name of objects.keys()) {
  if (!jobKeys.has(name) && !queue) findings.push(`orphan object: ${name}`);
}

for (const job of jobs) {
  const object = objects.get(job.object_key);
  if (job.status === "ready") {
    if (!object) findings.push(`ready job ${job.id}: object missing (${job.object_key})`);
    else if (object.size !== null && object.size !== job.size_bytes) {
      findings.push(`ready job ${job.id}: size ${object.size} != ${job.size_bytes}`);
    } else if (verifySha) {
      const { data, error } = await bucket.download(job.object_key);
      if (error) findings.push(`ready job ${job.id}: download failed: ${error.message}`);
      else {
        const sha = createHash("sha256").update(Buffer.from(await data.arrayBuffer())).digest("hex");
        if (sha !== job.sha256) findings.push(`ready job ${job.id}: sha256 mismatch`);
      }
    }
  }
  if (job.status === "failed" && object) findings.push(`failed job ${job.id} has an object at ${job.object_key}`);
  if (job.status === "processing" && job.lease_expires_at && now - Date.parse(job.lease_expires_at) > 10 * 60_000) {
    findings.push(`processing job ${job.id}: lease expired ${Math.round((now - Date.parse(job.lease_expires_at)) / 60_000)} min ago`);
  }
  if (job.status === "queued" && now - Date.parse(job.created_at) > 30 * 60_000) {
    findings.push(`queued job ${job.id}: waiting ${Math.round((now - Date.parse(job.created_at)) / 60_000)} min`);
  }
}

let deliveries = supabase
  .from("pb_hris_webhook_deliveries")
  .select("event_id, status, created_at, client_id")
  .in("status", ["pending", "delivering", "abandoned"]);
if (queue) deliveries = deliveries.eq("queue", queue);
const { data: openDeliveries, error: deliveryError } = await deliveries;
if (deliveryError) throw new Error(`deliveries: ${deliveryError.message}`);
for (const delivery of openDeliveries ?? []) {
  if (delivery.status === "abandoned") findings.push(`abandoned delivery ${delivery.event_id} (${delivery.client_id})`);
  else if (now - Date.parse(delivery.created_at) > 3600_000) {
    findings.push(`delivery ${delivery.event_id} (${delivery.client_id}) pending for ${Math.round((now - Date.parse(delivery.created_at)) / 60_000)} min`);
  }
}

const leftovers = await listAll("quotations");
if (leftovers.length) findings.push(`${leftovers.length} leftover object(s) under quotations/ (6abdfc6 test data)`);

console.log(`Checked ${jobs.length} job(s), ${objects.size} documents/ object(s)${queue ? ` in queue ${queue}` : ""}.`);
if (findings.length === 0) {
  console.log("No findings.");
} else {
  for (const finding of findings) console.log(`  - ${finding}`);
  process.exit(1);
}
