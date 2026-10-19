/**
 * Integration / end-to-end tests for the async HRIS document API against a
 * running server with the worker on (plan §10.3).
 *
 *   npm run build && npm run start:standalone        (or npm run dev)
 *   npm run hris:mock-webhook -- --port 4000
 *   npm run test:hris-documents -- [baseUrl] [--only T-INT-1,T-INT-2] [--mock http://localhost:4000]
 *
 * Needs, in .env.local: the local client setup from
 * `npm run hris:clients -- --local-env` (HRIS_TEST_API_KEY*, a local- queue),
 * SUPABASE_URL + SUPABASE_SERVICE_KEY (to check stored files), HRIS_API_KEY
 * (legacy regression). SUPABASE_ANON_KEY enables the anon-access checks.
 *
 * Scenarios that need a server restart with a fault injected (T-CR-*, T-SD-1,
 * T-WH-1..5) are run by hand — see docs/hris-operations.md.
 *
 * Test data uses quotation ids it-<timestamp>-<n> and tenants it-tenant-a/b;
 * it is removed at cleanup (plan R8), not by this script (the app's DB role
 * cannot delete).
 */

import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { deflateSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { expandHrmModules, HRM_MODULE_IDS, type HrmModuleId } from "../lib/hris/hrm-modules";
import { hasProblemStatementContent, MODULE_SECTION_START_PAGE, moduleSectionPageCount } from "../lib/module-page-layout";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to the environment
}

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const baseUrl = (args.find((arg) => /^https?:/.test(arg) && args[args.indexOf(arg) - 1] !== "--mock") ?? "http://localhost:3000").replace(/\/+$/, "");
const mockUrl = (option("--mock") ?? "http://localhost:4000").replace(/\/+$/, "");
const only = option("--only")?.split(",").map((id) => id.trim());

const KEY_A = process.env.HRIS_TEST_API_KEY ?? "";
const KEY_B = process.env.HRIS_TEST_API_KEY_B ?? "";
const KEY_HOLD = process.env.HRIS_TEST_API_KEY_HOLD ?? "";
const KEY_NONE = process.env.HRIS_TEST_API_KEY_NONE ?? "";
if (!KEY_A || !KEY_B || !KEY_HOLD || !KEY_NONE) {
  console.error("Missing HRIS_TEST_API_KEY* — run `npm run hris:clients -- --local-env` and add its output to .env.local.");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const RUN = `it-${Date.now()}`;
let seq = 0;
const quotation = () => `${RUN}-${++seq}`;
const newKey = () => crypto.randomUUID();

type Resource = {
  jobId: string;
  status: string;
  version: number;
  quotationId: string;
  tenantId: string;
  modules: string[];
  document: { bucket: string; objectKey: string; sha256: string; sizeBytes: number; pageCount: number } | null;
  error: { code: string } | null;
  notification?: { status: string; attempts: number } | null;
};

function body(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: "it-tenant-a",
    quotationId: quotation(),
    clientName: "Integration Test Ltd",
    employeeCount: 120,
    mrcFee: 18000,
    selectedModules: ["core"],
    requestedBy: "test-hris-documents",
    ...overrides,
  };
}

async function post(payload: unknown, key: string | null, apiKey = KEY_A, extraHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", "x-api-key": apiKey, ...extraHeaders };
  if (key !== null) headers["Idempotency-Key"] = key;
  const response = await fetch(`${baseUrl}/api/v1/documents`, {
    method: "POST",
    headers,
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, headers: response.headers, json };
}

async function get(jobId: string, apiKey: string | null = KEY_A) {
  const response = await fetch(`${baseUrl}/api/v1/documents/${jobId}`, {
    headers: apiKey ? { "x-api-key": apiKey } : {},
  });
  return { status: response.status, headers: response.headers, json: await response.json().catch(() => null) };
}

async function waitFor(jobId: string, done: (r: Resource) => boolean, apiKey = KEY_A, timeoutMs = 120_000): Promise<Resource> {
  const deadline = Date.now() + timeoutMs;
  let last: Resource | null = null;
  while (Date.now() < deadline) {
    const { status, json } = await get(jobId, apiKey);
    assert.equal(status, 200, `GET ${jobId} -> ${status} ${JSON.stringify(json)}`);
    last = json as Resource;
    if (done(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }
  throw new Error(`timed out waiting on ${jobId}; last: ${JSON.stringify(last)}`);
}
const terminal = (r: Resource) => r.status === "ready" || r.status === "failed";

function expectedPages(modules: HrmModuleId[], problemStatement?: string) {
  return MODULE_SECTION_START_PAGE + moduleSectionPageCount(expandHrmModules(modules), hasProblemStatementContent(problemStatement));
}

async function downloadAndCheck(resource: Resource) {
  assert.ok(resource.document, "ready job has a document");
  const { data, error } = await supabase.storage.from("proposal-pdfs").download(resource.document.objectKey);
  assert.ok(!error, error?.message);
  const bytes = Buffer.from(await data.arrayBuffer());
  assert.equal(bytes.length, resource.document.sizeBytes, "size matches");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), resource.document.sha256, "sha256 matches");
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  const pdfPages = (bytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  assert.equal(pdfPages, resource.document.pageCount, "PDF page count matches the resource");
  return bytes;
}

async function mockEvents(): Promise<{ eventId: string; type: string; jobId: string; verified: boolean; answered: number; body: string }[]> {
  const response = await fetch(`${mockUrl}/events`);
  return response.json();
}

/** A valid PNG of incompressible noise, to test the 1 MB logo limit. */
function noisePng(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "ascii");
    data.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // RGB
  // Random bytes don't compress, so the PNG ends up about as big as the pixels.
  const raw = randomBytes((width * 3 + 1) * height);
  for (let row = 0; row < height; row++) raw[row * (width * 3 + 1)] = 0; // filter type: none
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const results: { id: string; ok: boolean; note?: string }[] = [];
async function scenario(id: string, name: string, fn: () => Promise<string | void>) {
  if (only && !only.includes(id)) return;
  const startedAt = Date.now();
  try {
    const note = await fn();
    results.push({ id, ok: true, note: note ?? undefined });
    console.log(`  ok    ${id} ${name} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)${note ? ` — ${note}` : ""}`);
  } catch (error) {
    results.push({ id, ok: false, note: error instanceof Error ? error.message : String(error) });
    console.log(`  FAIL  ${id} ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`HRIS document API integration tests against ${baseUrl} (run ${RUN})`);

let happyJob: Resource | null = null;

await scenario("T-INT-1", "happy path: 202, ready, stored bytes match, signed webhook", async () => {
  const payload = body({ selectedModules: ["core", "payroll"] });
  const created = await post(payload, newKey());
  assert.equal(created.status, 202, JSON.stringify(created.json));
  assert.equal(created.headers.get("location"), `/api/v1/documents/${created.json.jobId}`);
  assert.equal(created.json.status, "queued");
  assert.equal(created.json.document, null);
  assert.ok(created.headers.get("pb-request-id"));

  const ready = await waitFor(created.json.jobId, terminal);
  assert.equal(ready.status, "ready", JSON.stringify(ready.error));
  assert.equal(ready.document!.pageCount, expectedPages(["core", "payroll"]));
  assert.match(ready.document!.objectKey, new RegExp(`^documents/local-test/it-tenant-a/${payload.quotationId}/proposal_v1\\.pdf$`));
  await downloadAndCheck(ready);
  happyJob = ready;

  // The mock receives one verified document.ready whose data equals the GET body.
  const deadline = Date.now() + 30_000;
  let event;
  while (Date.now() < deadline && !event) {
    event = (await mockEvents()).find((e) => e.jobId === ready.jobId && e.type === "document.ready" && e.verified);
    if (!event) await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  assert.ok(event, "webhook received and verified by the mock (is it running on --mock?)");
  const { notification: _notification, ...withoutNotification } = (await get(ready.jobId)).json;
  void _notification;
  assert.deepEqual(JSON.parse(event.body).data, withoutNotification);
  const after = await waitFor(ready.jobId, (r) => r.notification?.status === "delivered");
  return `v${after.version}, ${after.document!.pageCount} pages, ${after.document!.sizeBytes} bytes, webhook delivered`;
});

await scenario("T-INT-2", "duplicate key, same body (keys reordered) replays", async () => {
  const payload = body();
  const key = newKey();
  const first = await post(payload, key);
  const reordered = Object.fromEntries(Object.entries(payload).reverse());
  const second = await post(reordered, key);
  assert.equal(first.status, 202);
  assert.equal(second.status, 202);
  assert.equal(second.json.jobId, first.json.jobId);
  assert.equal(second.json.version, first.json.version);
  assert.equal(second.headers.get("idempotent-replayed"), "true");
  assert.equal(first.headers.get("idempotent-replayed"), null);
  const { count } = await supabase.from("pb_hris_document_jobs").select("id", { count: "exact", head: true }).eq("idempotency_key", key);
  assert.equal(count, 1);
});

await scenario("T-INT-3", "same key, different body -> 422 with the original jobId", async () => {
  const payload = body();
  const key = newKey();
  const first = await post(payload, key);
  const second = await post({ ...payload, mrcFee: 99999 }, key);
  assert.equal(second.status, 422);
  assert.equal(second.json.error, "idempotency_key_reused");
  assert.equal(second.json.jobId, first.json.jobId);
});

await scenario("T-INT-4", "validation, auth, content-type and size errors", async () => {
  const cases: [string, Promise<{ status: number; json: { error?: string } }>, number, string][] = [
    ["missing key", post(body(), null), 400, "idempotency_key_missing"],
    ["invalid key", post(body(), "has space"), 400, "idempotency_key_invalid"],
    ["builder module id", post(body({ selectedModules: ["attendance"] }), newKey()), 400, "invalid_fields"],
    ["no core", post(body({ selectedModules: ["payroll"] }), newKey()), 400, "invalid_fields"],
    ["duplicate module", post(body({ selectedModules: ["core", "core"] }), newKey()), 400, "invalid_fields"],
    ["missing tenantId", post(body({ tenantId: undefined }), newKey()), 400, "invalid_fields"],
    ["companyId", post(body({ companyId: "1" }), newKey()), 400, "invalid_fields"],
    ["fieldTrackingFee", post(body({ fieldTrackingFee: 5 }), newKey()), 400, "invalid_fields"],
    ["<img onerror>", post(body({ problemStatementText: "<img src=x onerror=alert(1)>" }), newKey()), 400, "invalid_fields"],
    ["text/plain", post(body(), newKey(), KEY_A, { "Content-Type": "text/plain" }), 415, "unsupported_media_type"],
    ["> 2 MB", post(JSON.stringify(body({ requestedBy: "x".repeat(2_100_000) })), newKey()), 413, "body_too_large"],
    ["bad API key", post(body(), newKey(), "wrong-key"), 401, "unauthorized"],
  ];
  for (const [label, request, status, code] of cases) {
    const { status: got, json } = await request;
    assert.equal(got, status, `${label}: ${JSON.stringify(json)}`);
    assert.equal(json?.error, code, label);
  }
  return `${cases.length} cases`;
});

await scenario("T-INT-5", "10 parallel POSTs with one key -> one job, nine replays", async () => {
  const payload = body();
  const key = newKey();
  const responses = await Promise.all(Array.from({ length: 10 }, () => post(payload, key)));
  assert.ok(responses.every((r) => r.status === 202), JSON.stringify(responses.map((r) => r.status)));
  assert.equal(new Set(responses.map((r) => r.json.jobId)).size, 1);
  assert.equal(responses.filter((r) => r.headers.get("idempotent-replayed") === "true").length, 9);
});

await scenario("T-INT-6", "10 parallel new keys, one quotation -> contiguous versions", async () => {
  const quotationId = quotation();
  const responses = await Promise.all(Array.from({ length: 10 }, () => post(body({ quotationId }), newKey())));
  assert.ok(responses.every((r) => r.status === 202));
  const versions = responses.map((r) => r.json.version as number).sort((a, b) => a - b);
  assert.deepEqual(versions, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const done = await Promise.all(responses.map((r) => waitFor(r.json.jobId, terminal, KEY_A, 240_000)));
  assert.ok(done.every((r) => r.status === "ready"), JSON.stringify(done.map((r) => r.error)));
  assert.equal(new Set(done.map((r) => r.document!.objectKey)).size, 10);
  return "v1..v10, all ready";
});

await scenario("T-INT-7", "a rejected key is not consumed", async () => {
  const key = newKey();
  const bad = await post(body({ selectedModules: ["payroll"] }), key);
  assert.equal(bad.status, 400);
  const good = await post(body(), key);
  assert.equal(good.status, 202);
  assert.equal(good.headers.get("idempotent-replayed"), null);
});

await scenario("T-INT-8", "page count formula: core, core+2 with problem statement, all seven", async () => {
  const problem = "<p>Attendance is tracked on paper across <strong>three</strong> sites.</p>";
  const variants: [HrmModuleId[], string | undefined][] = [
    [["core"], undefined],
    [["core", "payroll", "expense_management"], problem],
    [[...HRM_MODULE_IDS], undefined],
  ];
  const notes: string[] = [];
  for (const [modules, problemStatementText] of variants) {
    const created = await post(body({ selectedModules: modules, problemStatementText }), newKey());
    assert.equal(created.status, 202, JSON.stringify(created.json));
    const ready = await waitFor(created.json.jobId, terminal);
    assert.equal(ready.status, "ready", JSON.stringify(ready.error));
    assert.equal(ready.document!.pageCount, expectedPages(modules, problemStatementText));
    notes.push(`${modules.length} module(s)${problemStatementText ? "+PS" : ""}=${ready.document!.pageCount}p`);
  }
  return notes.join(", ");
});

await scenario("T-INT-9", "GET errors: unknown, malformed, no key, another client's job", async () => {
  assert.equal((await get(crypto.randomUUID())).status, 404);
  assert.equal((await get("not-a-uuid")).status, 400);
  assert.equal((await get(crypto.randomUUID(), null)).status, 401);
  const mine = await post(body(), newKey());
  const other = await get(mine.json.jobId, KEY_B);
  assert.equal(other.status, 404);
  const queued = await get(mine.json.jobId);
  if (queued.json.status === "queued" || queued.json.status === "processing") {
    assert.equal(queued.headers.get("retry-after"), "10");
  }
});

await scenario("T-INT-11", "~1 MB logo renders and is cleared from the row afterwards", async () => {
  const png = noisePng(560, 580);
  const logo = `data:image/png;base64,${png.toString("base64")}`;
  assert.ok(logo.length > 1_000_000 && logo.length <= 1_400_000, String(logo.length));
  const created = await post(body({ logo }), newKey());
  assert.equal(created.status, 202, JSON.stringify(created.json));
  const ready = await waitFor(created.json.jobId, terminal);
  assert.equal(ready.status, "ready", JSON.stringify(ready.error));
  const { data } = await supabase.from("pb_hris_document_jobs").select("logo_data_url").eq("id", ready.jobId).single();
  assert.equal(data?.logo_data_url, null);
  return `${(logo.length / 1e6).toFixed(2)}M chars`;
});

await scenario("T-INT-12", "namespace isolation: tenants and clients version separately", async () => {
  const quotationId = quotation();
  const a = await post(body({ quotationId, tenantId: "it-tenant-a" }), newKey());
  const b = await post(body({ quotationId, tenantId: "it-tenant-b" }), newKey());
  const c = await post(body({ quotationId, tenantId: "it-tenant-a" }), newKey(), KEY_B);
  for (const r of [a, b, c]) assert.equal(r.status, 202);
  assert.deepEqual([a.json.version, b.json.version, c.json.version], [1, 1, 1]);
  const keys = await Promise.all([
    waitFor(a.json.jobId, terminal),
    waitFor(b.json.jobId, terminal),
    waitFor(c.json.jobId, terminal, KEY_B),
  ]);
  assert.equal(new Set(keys.map((r) => r.document?.objectKey)).size, 3);
  const { data } = await supabase.from("pb_hris_documents_latest").select("client_id, tenant_id").eq("quotation_id", quotationId);
  assert.equal(data?.length, 3);
});

await scenario("T-CR-5", "a foreign object at the job's key fails it and is never overwritten", async () => {
  const quotationId = quotation();
  const key = `documents/local-test/it-tenant-a/${quotationId}/proposal_v1.pdf`;
  const stray = Buffer.from("%PDF-1.4\n% stray object placed by the test\n%%EOF\n");
  const placed = await supabase.storage.from("proposal-pdfs").upload(key, stray, { contentType: "application/pdf", upsert: false });
  assert.ok(!placed.error, placed.error?.message);

  const created = await post(body({ quotationId }), newKey());
  assert.equal(created.status, 202);
  const failed = await waitFor(created.json.jobId, terminal);
  assert.equal(failed.status, "failed");
  assert.equal(failed.error?.code, "object_key_conflict");

  const { data } = await supabase.storage.from("proposal-pdfs").download(key);
  assert.deepEqual(Buffer.from(await data!.arrayBuffer()), stray, "stray object untouched");

  const deadline = Date.now() + 30_000;
  let event;
  while (Date.now() < deadline && !event) {
    event = (await mockEvents()).find((e) => e.jobId === failed.jobId && e.type === "document.failed" && e.verified);
    if (!event) await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  assert.ok(event, "document.failed webhook received and verified");
});

await scenario("T-WH-6", "a 'hold' client's delivery waits unclaimed", async () => {
  const created = await post(body(), newKey(), KEY_HOLD);
  const ready = await waitFor(created.json.jobId, terminal, KEY_HOLD);
  assert.equal(ready.status, "ready");
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  const after = (await get(ready.jobId, KEY_HOLD)).json as Resource;
  assert.equal(after.notification?.status, "pending");
  assert.equal(after.notification?.attempts, 0);
});

await scenario("T-WH-7", "a 'none' client's delivery is skipped", async () => {
  const created = await post(body(), newKey(), KEY_NONE);
  await waitFor(created.json.jobId, terminal, KEY_NONE);
  const skipped = await waitFor(created.json.jobId, (r) => r.notification?.status === "skipped", KEY_NONE, 30_000);
  assert.equal(skipped.status, "ready");
});

await scenario("T-SEC-1", "anon key cannot call the RPC or read the tables/views", async () => {
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) return "skipped: SUPABASE_ANON_KEY not set";
  const anon = createClient(process.env.SUPABASE_URL!, anonKey, { auth: { persistSession: false } });
  const rpc = await anon.rpc("pb_hris_enqueue_document", {});
  assert.ok(rpc.error, "anon RPC must fail");
  for (const table of ["pb_hris_document_jobs", "pb_hris_webhook_deliveries", "pb_hris_document_versions", "pb_hris_documents_latest"]) {
    const { error } = await anon.from(table).select("*").limit(1);
    assert.ok(error, `anon select on ${table} must fail`);
  }
  if (happyJob?.document) {
    const download = await anon.storage.from("proposal-pdfs").download(happyJob.document.objectKey);
    assert.ok(download.error, "anon download must fail");
  }
});

await scenario("T-REG-1", "legacy synchronous route still works and is marked deprecated", async () => {
  const apiKey = process.env.HRIS_API_KEY;
  if (!apiKey) return "skipped: HRIS_API_KEY not set";
  const response = await fetch(`${baseUrl}/api/v1/hris/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ companyId: `${RUN}-legacy`, clientName: "Legacy Ltd", employeeCount: 10, mrcFee: 1000 }),
  });
  const json = await response.json();
  assert.equal(response.status, 201, JSON.stringify(json));
  assert.equal(response.headers.get("deprecation"), "true");
  assert.match(response.headers.get("link") ?? "", /successor-version/);
  assert.ok(response.headers.get("sunset"));
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed.`);
process.exit(failed.length ? 1 : 0);
