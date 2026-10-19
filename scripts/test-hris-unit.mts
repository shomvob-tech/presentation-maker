/**
 * Unit tests for the async HRIS document API's pure parts. No network, no DB.
 *
 *   npm run test:hris-unit
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { loadHrisClients, resolveHrisClient } from "../lib/hris/clients";
import { parseDocumentRequest } from "../lib/hris/document-input";
import { canonicalJson, readIdempotencyKey, requestFingerprint } from "../lib/hris/idempotency";
import { toJobResource } from "../lib/hris/job-resource";
import type { DocumentJobRow } from "../lib/hris/jobs";
import { validateProblemStatementHtml } from "../lib/hris/problem-statement";
import { parseHrisProposalInput } from "../lib/hris/proposal-input";
import { isObjectNotFound } from "../lib/hris/storage";
import { nextWebhookDelaySeconds } from "../lib/hris/webhook";
import { signWebhook, verifyWebhook } from "../lib/hris/webhook-signature";
import { heartbeatMs, JOB_RETRY_DELAYS_SECONDS } from "../lib/hris/worker-state";
import { toDhakaTimestamp } from "../lib/audit/events";

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
}

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64");
const SECRET = `whsec_${Buffer.alloc(32, 7).toString("base64")}`;
const requestWithKey = (key?: string) =>
  ({ headers: new Headers(key ? { "x-api-key": key } : {}) }) as unknown as NextRequest;

function loadWith(registry: unknown, queue: string) {
  process.env.HRIS_CLIENTS_B64 = b64(registry);
  process.env.HRIS_QUEUE_NAME = queue;
  return loadHrisClients();
}

// ── Idempotency ───────────────────────────────────────────────────────────
await test("canonicalJson / requestFingerprint are stable under key order; values matter", () => {
  assert.equal(canonicalJson({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: null } }), '{"a":{"c":null,"d":[1,{"x":1,"y":2}]},"b":1}');
  assert.equal(requestFingerprint({ a: 1, b: 2 }), requestFingerprint({ b: 2, a: 1 }));
  assert.notEqual(requestFingerprint({ mrcFee: 25000 }), requestFingerprint({ mrcFee: "25000" }));
  assert.match(requestFingerprint({}), /^[0-9a-f]{64}$/);
});

await test("readIdempotencyKey accepts UUIDs and quoted keys; rejects bad ones", () => {
  const key = (value?: string) => readIdempotencyKey(new Headers(value === undefined ? {} : { "Idempotency-Key": value }));
  const uuid = "0f6c9a52-1b2c-4d3e-8f90-123456789abc";
  assert.deepEqual(key(uuid), { ok: true, key: uuid });
  assert.deepEqual(key('"abc"'), { ok: true, key: "abc" });
  for (const [value, code] of [
    [undefined, "idempotency_key_missing"],
    ["", "idempotency_key_missing"],
    ["a".repeat(256), "idempotency_key_invalid"],
    ["has space", "idempotency_key_invalid"],
    ["a/b", "idempotency_key_invalid"],
  ] as const) {
    const result = key(value);
    assert.ok(!result.ok && result.code === code, String(value));
  }
});

// ── Problem-statement allowlist ───────────────────────────────────────────
await test("validateProblemStatementHtml allows formatting only", () => {
  assert.ok(validateProblemStatementHtml("<p>a &lt; b</p><ul><li><p>x</p></li></ul><br/>").ok);
  assert.ok(validateProblemStatementHtml("plain text, no tags").ok);
  for (const bad of [
    "<img src=x onerror=alert(1)>",
    '<p onclick="x">hi</p>',
    "<scr<p>ipt>alert(1)</script>",
    "<!-- comment -->",
    '<a href="https://x">x</a>',
    "<svg></svg>",
    "a > b",
  ]) {
    assert.ok(!validateProblemStatementHtml(bad).ok, bad);
  }
});

// ── Client registry ───────────────────────────────────────────────────────
const KEY_A = "a".repeat(64);
const KEY_A2 = "c".repeat(64);
const KEY_MON = "b".repeat(64);
const goodRegistry = [
  { id: "hris-staging", apiKeySha256: [sha(KEY_A), sha(KEY_A2)], webhook: { url: "https://hr.example.com/hook", secrets: [SECRET] } },
  { id: "pb-monitor", apiKeySha256: [sha(KEY_MON)], webhook: "none", scopes: ["health"] },
  { id: "hris-dev", apiKeySha256: [sha("dev-key")], webhook: "hold" },
];

await test("client registry: valid blob parses", () => {
  const loaded = loadWith(goodRegistry, "staging");
  assert.ok(loaded.ok);
  assert.deepEqual(loaded.clients.map((client) => client.webhook.kind), ["url", "none", "hold"]);
});

await test("client registry: invalid blobs are rejected with a reason", () => {
  const cases: [unknown, string, RegExp][] = [
    [[goodRegistry[0], { ...goodRegistry[2], id: "hris-staging" }], "staging", /duplicate client id/],
    [[goodRegistry[0], { ...goodRegistry[2], apiKeySha256: [sha(KEY_A)] }], "staging", /used twice/],
    [[{ ...goodRegistry[0], webhook: { url: "http://example.com/hook", secrets: [SECRET] } }], "staging", /must be https/],
    [[{ ...goodRegistry[0], webhook: { url: "http://localhost:4000/hook", secrets: [SECRET] } }], "staging", /must be https/],
    [[{ ...goodRegistry[0], webhook: { url: "https://u:p@hr.example.com/hook", secrets: [SECRET] } }], "staging", /credentials/],
    [[{ ...goodRegistry[0], webhook: { url: "https://hr.example.com/hook", secrets: ["nope"] } }], "staging", /whsec_/],
    [[{ ...goodRegistry[0], webhook: { url: "https://hr.example.com/hook", secrets: ["whsec_c2hvcnQ="] } }], "staging", /24 bytes/],
    [[{ ...goodRegistry[0], id: "Bad_Id" }], "staging", /client id/],
    [[{ ...goodRegistry[0], apiKeySha256: ["XYZ"] }], "staging", /64-char hex/],
    [[], "staging", /non-empty/],
  ];
  for (const [registry, queue, message] of cases) {
    const loaded = loadWith(registry, queue);
    assert.ok(!loaded.ok, String(message));
    assert.match(loaded.error, message);
  }
  process.env.HRIS_CLIENTS_B64 = "not base64 json";
  const garbage = loadHrisClients();
  assert.ok(!garbage.ok);
});

await test("client registry: loopback http webhooks only on a local- queue", () => {
  const registry = [{ ...goodRegistry[0], webhook: { url: "http://localhost:4000/hook", secrets: [SECRET] } }];
  assert.ok(loadWith(registry, "local-x").ok);
  assert.ok(!loadWith(registry, "staging").ok);
});

await test("resolveHrisClient honours scope and key rotation", () => {
  loadWith(goodRegistry, "staging");
  assert.equal(resolveHrisClient(requestWithKey(KEY_A), "documents")?.id, "hris-staging");
  assert.equal(resolveHrisClient(requestWithKey(KEY_A2), "documents")?.id, "hris-staging");
  assert.equal(resolveHrisClient(requestWithKey(KEY_MON), "documents"), null);
  assert.equal(resolveHrisClient(requestWithKey(KEY_MON), "health")?.id, "pb-monitor");
  assert.equal(resolveHrisClient(requestWithKey("wrong"), "documents"), null);
  assert.equal(resolveHrisClient(requestWithKey(), "documents"), null);
});

// ── Webhook signing ───────────────────────────────────────────────────────
await test("Standard Webhooks test vector matches exactly", () => {
  const signature = signWebhook(
    ["whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw"],
    "msg_p5jXN8AQM9LWM0D4loKWxJek",
    1614265330,
    '{"test": 2432232314}',
  );
  assert.equal(signature, "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=");
});

await test("verifyWebhook: round trip, tampering, wrong secret, stale, rotation", () => {
  const now = 1_800_000_000;
  const body = '{"type":"document.ready"}';
  const headers = { id: "evt_1", timestamp: String(now), signature: signWebhook([SECRET], "evt_1", now, body) };
  assert.ok(verifyWebhook(body, headers, SECRET, { nowSeconds: now }));
  assert.ok(!verifyWebhook(body + " ", headers, SECRET, { nowSeconds: now }));
  assert.ok(!verifyWebhook(body, headers, `whsec_${Buffer.alloc(32, 9).toString("base64")}`, { nowSeconds: now }));
  assert.ok(!verifyWebhook(body, headers, SECRET, { nowSeconds: now + 301 }));
  assert.ok(!verifyWebhook(body, headers, SECRET, { nowSeconds: now - 301 }));
  assert.ok(!verifyWebhook(body, { ...headers, id: undefined }, SECRET, { nowSeconds: now }));
  assert.ok(!verifyWebhook(body, { ...headers, signature: "v1,c2hvcnQ=" }, SECRET, { nowSeconds: now }));

  const second = `whsec_${Buffer.alloc(32, 3).toString("base64")}`;
  const both = { ...headers, signature: signWebhook([SECRET, second], "evt_1", now, body) };
  assert.equal(both.signature.split(" ").length, 2);
  assert.ok(verifyWebhook(body, both, SECRET, { nowSeconds: now }));
  assert.ok(verifyWebhook(body, both, second, { nowSeconds: now }));
});

await test("nextWebhookDelaySeconds: jitter bounds, 24 h cap, never null without a max age", () => {
  const first = new Date("2026-10-19T00:00:00Z");
  for (let i = 0; i < 50; i++) {
    const delay = nextWebhookDelaySeconds(1, first, first, 0)!;
    assert.ok(delay >= 24 && delay <= 36, String(delay));
  }
  assert.equal(nextWebhookDelaySeconds(100, first, first, 0, () => 0.999), 86400);
  assert.notEqual(nextWebhookDelaySeconds(1000, first, new Date("2030-01-01T00:00:00Z"), 0), null);
  const twoHoursLater = new Date(first.getTime() + 2 * 3600 * 1000);
  assert.equal(nextWebhookDelaySeconds(5, first, twoHoursLater, 1), null);
  assert.notEqual(nextWebhookDelaySeconds(1, first, first, 1), null);
});

// ── Worker maths, storage helpers ─────────────────────────────────────────
await test("worker maths: heartbeat and retry delays", () => {
  assert.equal(heartbeatMs(20), 5_000);
  assert.equal(heartbeatMs(120), 30_000);
  assert.deepEqual([...JOB_RETRY_DELAYS_SECONDS], [30, 120, 600, 1800]);
});

await test("isObjectNotFound recognises every storage 404 shape", () => {
  assert.ok(isObjectNotFound({ status: 404 }));
  assert.ok(isObjectNotFound({ status: 400, statusCode: "404" }));
  assert.ok(isObjectNotFound({ message: "Object not found" }));
  assert.ok(!isObjectNotFound({ status: 500, message: "boom" }));
});

// ── Job resource ──────────────────────────────────────────────────────────
const readyRow: DocumentJobRow = {
  id: "5b0e8a7e-3c55-4c1e-9a0b-8f0f7f4f2d11",
  queue: "staging",
  client_id: "hris-staging",
  idempotency_key: "0f6c9a52-1b2c-4d3e-8f90-123456789abc",
  request_sha256: "a".repeat(64),
  tenant_id: "acme-hr",
  quotation_id: "Q-2026-0042",
  doc_type: "proposal",
  version: 3,
  bucket: "proposal-pdfs",
  object_key: "documents/hris-staging/acme-hr/Q-2026-0042/proposal_v3.pdf",
  client_name: "Acme Ltd",
  hrm_modules: ["core", "payroll"],
  requested_by: null,
  status: "ready",
  attempts: 1,
  max_attempts: 5,
  adoption_grace_used: false,
  run_at: "2026-10-19T08:15:02.113+00:00",
  lease_token: null,
  lease_expires_at: null,
  locked_by: null,
  sha256: "b".repeat(64),
  size_bytes: 412331,
  page_count: 5,
  app_version: "42",
  error_code: null,
  last_error: "internal host db.internal:5432 refused",
  created_at: "2026-10-19T08:15:02.113+00:00",
  updated_at: "2026-10-19T08:15:09.402+00:00",
  started_at: "2026-10-19T08:15:03.000+00:00",
  completed_at: "2026-10-19T08:15:09.402+00:00",
};

await test("toJobResource: ready shape, no URLs, no internal error text", () => {
  const resource = toJobResource(readyRow, {
    delivery: { event_id: "evt_x_ready", status: "delivered", attempts: 1, last_status_code: 204, delivered_at: "2026-10-19T08:15:10+00:00" },
  });
  assert.equal(resource.document?.objectKey, readyRow.object_key);
  assert.equal(resource.error, null);
  assert.equal(resource.notification?.status, "delivered");
  assert.equal(resource.createdAt, "2026-10-19T08:15:02.113Z");
  const strings: string[] = [];
  JSON.stringify(resource, (_key, value) => {
    if (typeof value === "string") strings.push(value);
    return value;
  });
  for (const value of strings) {
    assert.doesNotMatch(value, /^https?:|\/object\/sign\/|token=|db\.internal/, value);
  }
  assert.ok(!("notification" in toJobResource(readyRow)));
});

await test("toJobResource: failed and retrying jobs show a fixed message", () => {
  const failed = toJobResource({ ...readyRow, status: "failed", error_code: "render_timeout", sha256: null });
  assert.deepEqual(failed.error, { code: "render_timeout", message: "Rendering the PDF timed out." });
  assert.equal(failed.document, null);
  const retrying = toJobResource({ ...readyRow, status: "queued", error_code: "storage_upload_failed" });
  assert.equal(retrying.error?.code, "storage_upload_failed");
  const unknown = toJobResource({ ...readyRow, status: "failed", error_code: "weird" });
  assert.equal(unknown.error?.code, "internal_error");
});

// ── Request parsing ───────────────────────────────────────────────────────
const validBody = {
  tenantId: "acme-hr",
  quotationId: "Q-2026-0042",
  clientName: "Acme Ltd",
  employeeCount: 250,
  mrcFee: 25000,
  selectedModules: ["payroll", "core"],
};

await test("parseDocumentRequest: defaults, expansion and Dhaka date", () => {
  const parsed = parseDocumentRequest(validBody);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value.hrmModules, ["core", "payroll"]);
  assert.deepEqual(parsed.value.details.selectedModules, [
    "employee-management",
    "leave",
    "attendance",
    "policy-management",
    "announcements",
    "payroll",
  ]);
  const today = toDhakaTimestamp(new Date()).slice(0, 10);
  assert.equal(parsed.value.details.preparedDate, today);
  assert.equal(parsed.value.details.letterAddresseeName, "Acme Ltd");
  assert.equal(parsed.value.details.validityDays, 30);
  assert.equal(parsed.value.docType, "proposal");
  assert.ok(!("fieldTrackingFee" in parsed.value.details));
  const numeric = parseDocumentRequest({ ...validBody, quotationId: 42, employeeCount: "250" });
  assert.ok(numeric.ok && numeric.value.quotationId === "42" && numeric.value.details.employeeCount === 250);
});

await test("parseDocumentRequest rejects legacy and invalid fields", () => {
  const cases: [Record<string, unknown>, string][] = [
    [{ ...validBody, companyId: "1" }, "companyId"],
    [{ ...validBody, fieldTrackingFee: 10 }, "fieldTrackingFee"],
    [{ ...validBody, docType: "device" }, "docType"],
    [{ ...validBody, tenantId: undefined }, "tenantId"],
    [{ ...validBody, tenantId: "a/b" }, "tenantId"],
    [{ ...validBody, selectedModules: ["payroll"] }, "selectedModules"],
    [{ ...validBody, selectedModules: ["attendance"] }, "selectedModules"],
    [{ ...validBody, problemStatementText: "<img src=x onerror=1>" }, "problemStatementText"],
  ];
  for (const [body, field] of cases) {
    const parsed = parseDocumentRequest(body);
    assert.ok(!parsed.ok, field);
    assert.ok(parsed.errors.some((error) => error.field === field), `${field}: ${JSON.stringify(parsed.errors)}`);
  }
  assert.ok(!parseDocumentRequest([]).ok);
  assert.ok(!parseDocumentRequest(null).ok);
});

// ── Legacy contract stays frozen ──────────────────────────────────────────
await test("legacy parseHrisProposalInput output is unchanged", () => {
  const parsed = parseHrisProposalInput({
    companyId: "123",
    clientName: "Test Company Ltd",
    employeeCount: 250,
    mrcFee: 25000,
    rolloutCharge: 50000,
    preparedDate: "2026-10-19",
    meetingDateReference: "2026-10-18",
    selectedModules: ["attendance", "payroll"],
  });
  assert.ok(parsed.ok);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed.value)), {
    companyId: "123",
    clientName: "Test Company Ltd",
    details: {
      documentTitle: "Workforce Management Ecosystem",
      preparedDate: "2026-10-19",
      recipientTitle: "Managing Director",
      employeeCount: 250,
      mrcFee: 25000,
      rolloutCharge: 50000,
      letterAddresseeName: "Test Company Ltd",
      meetingDateReference: "2026-10-18",
      validityDays: 30,
      selectedModules: ["attendance", "payroll"],
    },
  });
});

// ── Isolation: the public builder never imports the HRIS code ─────────────
await test("public builder files do not import lib/hris", () => {
  const roots = readdirSync("app")
    .filter((name) => /^export-pdf|-builder$|-preview$/.test(name) || name === "components")
    .map((name) => path.join("app", name))
    .concat(
      readdirSync(path.join("app", "api"))
        .filter((name) => name.startsWith("export-pdf"))
        .map((name) => path.join("app", "api", name)),
    );
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && /lib\/hris/.test(readFileSync(full, "utf8"))) offenders.push(full);
    }
  };
  roots.forEach(walk);
  assert.deepEqual(offenders, []);
});

console.log(`HRIS unit tests passed (${passed}).`);
