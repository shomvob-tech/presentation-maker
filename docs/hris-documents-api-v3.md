# HRIS Documents API — v3

Proposal Builder (PB) turns an HRIS quotation into a proposal PDF. HRIS sends
the data; PB answers at once with a job id, builds the PDF in the background,
stores it in the shared Supabase project, and tells HRIS when it is ready.
HRIS then opens the PDF itself, with a short-lived link it signs on its own.

This replaces the synchronous `POST /api/v1/hris/proposals` (v1) — see
[Deprecation](#12-deprecation-and-compatibility). The v2 draft was never
published.

## 1. What changed from v1

| | v1 (sync) | v3 (this API) |
|---|---|---|
| Endpoint | `POST /api/v1/hris/proposals` | `POST /v1/documents` (+ `GET /v1/documents/{jobId}`) |
| Reply | `201` after rendering (4–8 s) | `202 { jobId }` immediately; `document.ready` webhook later |
| Identity | `companyId` | `tenantId` + `quotationId` |
| Retries | none | `Idempotency-Key` header: a retry never creates a second PDF |
| Modules | builder ids (`attendance`, …) | HRM ids (`core`, `payroll`, …), `core` required |
| PDF access | URL in the reply | no URL anywhere: HRIS signs a 5-minute link from `objectKey` |
| `fieldTrackingFee` | accepted | removed (employee tracking is priced inside `mrcFee`) |

## 2. The flow, and who builds what

| # | Step | Owner | What happens |
|---|---|---|---|
| 1 | HR clicks Generate | **HRIS** | One DB transaction: a `document_request` row (`id` UUID, `status='pending'`, `payload_json`, `tenant_id`, `quotation_id`) and an outbox row. |
| 2 | HRIS sends the data | HRIS → PB | The outbox sender POSTs `payload_json` with `Idempotency-Key = document_request.id`. Retries on network errors / 429 / 5xx. |
| 3 | "Got it" | **PB** | `202` with the job (`jobId`, `version`). The same key always gets the same job back. HRIS stores `jobId`, sets `accepted`, deletes the outbox row (keeps `payload_json`). |
| 4 | PDF is built | **PB** | A worker renders it, 2 at a time; retries up to 5 times. |
| 5 | PDF is stored | **PB** | Write-once file at `proposal-pdfs/documents/{clientId}/{tenantId}/{quotationId}/proposal_v{n}.pdf`; the DB keeps owner, size, sha256 and status. |
| 6 | HRIS is told | PB → HRIS | Signed `document.ready` (or `document.failed`) webhook, retried until HRIS answers 2xx. HRIS verifies it and marks the request ready. |
| 7 | Safety net | **HRIS** | A cron asks `GET /v1/documents/{jobId}` for requests still `accepted` after 5 minutes. |
| 8 | Someone opens the PDF | **HRIS** | Permission check → read the view → sign a 300-second URL from `objectKey` → redirect. PB is not involved. |

## 3. Environments

- **Base URL (staging):** `https://proposal-builder.shomvob.com/api` — always build
  `${PB_BASE}/v1/documents` and `${PB_BASE}/v1/documents/${jobId}`.
- **Your client id:** given at handoff (e.g. `hris-staging`). Each HRIS
  environment is a separate client with its own API key, webhook URL and secret.
- **Authentication:** `x-api-key: <key>` on every request. Server-to-server
  only: never call this API from a browser or put the key in frontend code.
- Keys and secrets are handed over privately, never in this document.

## 4. Steps 1–2: request + outbox (HRIS)

Suggested tables:

```sql
create table document_request (
  id            uuid primary key,          -- also the Idempotency-Key
  tenant_id     text not null,
  quotation_id  text not null,
  payload_json  text not null,             -- exact bytes POSTed; keep until terminal
  status        text not null default 'pending',  -- pending | accepted | ready | failed
  job_id        uuid,
  version       int,
  object_key    text,
  sha256        text,
  error_code    text,
  created_at    timestamptz not null default now()
);
create table outbox (
  document_request_id uuid primary key references document_request(id),
  attempts            int not null default 0,
  next_attempt_at     timestamptz not null default now()
);
-- On Generate: insert both rows in ONE transaction.
```

Sender (runs every few seconds over due outbox rows):

```ts
const res = await fetch(`${PB_BASE}/v1/documents`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-api-key": KEY, "idempotency-key": row.document_request_id },
  body: row.payload_json,                       // the same bytes every time
  signal: AbortSignal.timeout(15_000),
});
const body = await res.json().catch(() => ({}));
if (res.status === 202) {
  // save body.jobId, body.version; status 'accepted' (or body.status if already terminal); delete the outbox row
} else if (res.status === 422 && body.error === "idempotency_key_reused") {
  // a bug on our side of the key: save body.jobId, keep 'accepted', alert
} else if (res.status === 429 || res.status >= 500 || (res.status === 401 && firstTriedWithin24h)) {
  // next_attempt_at = now + (Retry-After ?? backoff 10s → 30s → 1m → 5m → 15m → hourly); alert on 401
} else {
  // permanent (400/403/413/415): mark the request failed with body.error, delete the outbox row, alert
}
```

## 5. `POST /v1/documents`

Headers: `Content-Type: application/json`, `x-api-key`, `Idempotency-Key`
(`[A-Za-z0-9_.:-]{1,255}`; a UUID is ideal).

| Field | Type | Req. | Rule / default |
|---|---|---|---|
| `docType` | `"proposal"` | | default `"proposal"` |
| `tenantId` | string | **yes** | `[A-Za-z0-9_-]{1,64}`. The HRIS organisation that owns the quotation. If HRIS has no tenants, send one constant (e.g. `"shomvob"`). |
| `quotationId` | string or number | **yes** | `[A-Za-z0-9_-]{1,64}`. Versions are counted per (client, tenant, quotation). |
| `clientName` | string ≤ 200 | **yes** | |
| `employeeCount` | whole number > 0 | **yes** | |
| `mrcFee` | number > 0 | **yes** | Monthly total for all selected modules (BDT). |
| `selectedModules` | array of HRM ids | **yes** | See [Module ids](#6-module-ids). |
| `rolloutCharge` | number > 0 | | row hidden when omitted |
| `logo` | `data:image/(png\|jpeg\|webp\|gif\|svg+xml);base64,…` | | ≤ 1,400,000 characters (~1 MB) |
| `documentTitle` | string ≤ 200 | | `Workforce Management Ecosystem` |
| `recipientTitle` | string ≤ 200 | | `Managing Director` |
| `letterAddresseeName` | string ≤ 200 | | `clientName` |
| `preparedDate`, `meetingDateReference` | `YYYY-MM-DD` | | today in Dhaka, fixed when accepted |
| `validityDays` | whole number > 0 | | `30` |
| `problemStatementHeading` | string ≤ 200 | | |
| `problemStatementText` | HTML ≤ 20,000 | | Only `p br strong b em i u s ul ol li blockquote`, no attributes; escape `<` `>` in text as `&lt;` `&gt;`. Anything else → 400. |
| `preparedByName/Title/Phone/Email` | string ≤ 200 | | omitted → "Shomvob Technologies Limited" |
| `requestedBy` | string ≤ 200 | | stored for audit |

Numbers may be JSON numbers or numeric strings. **Unknown fields are
rejected** (`companyId`, `fieldTrackingFee`, typos) so mistakes surface as a
400 instead of a wrong PDF.

```json
{ "tenantId": "acme-hr", "quotationId": "Q-2026-0042", "clientName": "Acme Ltd",
  "employeeCount": 250, "mrcFee": 25000,
  "selectedModules": ["core", "payroll", "expense_management"],
  "requestedBy": "hr.admin@acme.example" }
```

**202 Accepted** — the [job resource](#7-the-job-resource-and-its-lifecycle),
plus `Location: /api/v1/documents/{jobId}` and, on a replay,
`Idempotent-Replayed: true`.

**Idempotency:**

| Situation | Result |
|---|---|
| New key | 202, new job, `version` = previous + 1 for that quotation |
| Same key, same body | 202 with the same `jobId`/`version` and current status; nothing created |
| Same key, different body | `422 idempotency_key_reused` + the original `jobId` |
| Concurrent duplicates | exactly one job |
| Rejected before acceptance (400/401/403/413/415/429/503) | key not used up — resend, even with a fixed body |
| Job ended `failed` | key stays bound to it; a new attempt needs a new request + key (→ new version) |

## 6. Module ids

Send HRM ids in `selectedModules`: `core` is required, no duplicates, any
order (always rendered in package order). EWA is never shown.

| HRM id | Renders as |
|---|---|
| `core` | Employee Management, Leave, Attendance, Policy Management, Announcements |
| `payroll` | Payroll |
| `expense_management` | Expense Management |
| `asset_management` | Assets |
| `document_management` | Document Management |
| `visit_management` | Visit Management |
| `employee_tracking` | Employee Tracking |

Reimbursement Management (part of `core`) will be added as a sixth core card
once its copy is approved; until then `core` renders the five cards above.

| Selection | Cards | PDF pages |
|---|---|---|
| core | 5 | 4 |
| core + 1 | 6 | 4 |
| core + 2–3 | 7–8 | 4, or 5 with a problem statement |
| core + 4–6 | 9–11 | 5 |

## 7. The job resource and its lifecycle

Same shape in the 202, the GET 200 and the webhook `data`:

```json
{ "jobId": "5b0e8a7e-3c55-4c1e-9a0b-8f0f7f4f2d11", "idempotencyKey": "0f6c9a52-…",
  "status": "ready", "tenantId": "acme-hr", "quotationId": "Q-2026-0042",
  "docType": "proposal", "version": 3, "modules": ["core","payroll","expense_management"],
  "attempts": 1,
  "document": { "bucket": "proposal-pdfs",
                "objectKey": "documents/hris-staging/acme-hr/Q-2026-0042/proposal_v3.pdf",
                "sha256": "<64 hex>", "sizeBytes": 412331, "pageCount": 5 },
  "error": null,
  "createdAt": "2026-10-19T08:15:02.113Z", "updatedAt": "2026-10-19T08:15:09.402Z",
  "completedAt": "2026-10-19T08:15:09.402Z" }
```

- `status`: `queued` → `processing` → `ready` | `failed`. A transient error
  sends a job back to `queued` (retried after 30 s, 2 m, 10 m, 30 m; 5 attempts).
- `document` is set only when `ready`. `error` (`{ code, message }`) shows the
  last attempt's error while retrying, and the final one when `failed`. Codes:
  `render_failed`, `render_timeout`, `render_incomplete`, `pdf_too_large`,
  `storage_upload_failed`, `object_key_conflict`, `invalid_job_input`,
  `attempts_exhausted`, `internal_error`.
- **Version gaps:** a version that ends `failed` is never reused, so `v2` may
  be followed by `v4`. Order by `version`.

## 8. `GET /v1/documents/{jobId}` and the step-7 cron

`200` with the job resource plus `notification` (`{ eventId, status, attempts,
lastStatusCode, deliveredAt }` — the webhook's state); `Retry-After: 10` while
queued or processing. Another client's job, or an unknown one, is `404`.

Cron recipe — every 2 minutes, for requests `accepted` more than 5 minutes ago:
1. `GET ${PB_BASE}/v1/documents/${jobId}`.
2. Apply the same state rules as the webhook (§9).
3. On `404`, re-POST the stored `payload_json` with the same Idempotency-Key.

## 9. Webhooks (Standard Webhooks, HMAC-SHA256)

`POST` to your registered URL:

```
Content-Type: application/json
webhook-id: evt_<jobId>_ready | evt_<jobId>_failed      (stable across retries; dedupe on it)
webhook-timestamp: <unix seconds, fresh per attempt>
webhook-signature: v1,<base64>[ v1,<base64>]             (two during secret rotation)
PB-Event-Type: document.ready | document.failed
PB-Delivery-Attempt: <n>
```

Body (identical bytes on every attempt):
`{ "type": "document.ready", "timestamp": "…", "data": { …job resource… } }`.

Signature: `base64(HMAC_SHA256(base64decode(secret minus "whsec_"), "{webhook-id}.{webhook-timestamp}.{rawBody}"))`.
Any [Standard Webhooks](https://www.standardwebhooks.com) library verifies it,
or this (Node, no dependency):

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyProposalBuilderWebhook(rawBody: string,
  h: { id?: string; timestamp?: string; signature?: string }, secret: string, toleranceSec = 300): boolean {
  if (!h.id || !h.timestamp || !h.signature) return false;
  const t = Number(h.timestamp);
  if (!Number.isInteger(t) || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${h.id}.${h.timestamp}.${rawBody}`).digest();
  return h.signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
```

PHP: `hash_equals(base64_encode(hash_hmac('sha256', "$id.$ts.$rawBody", base64_decode(substr($secret, 6)), true)), $sig)` plus the same timestamp check.

Test vector: secret `whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw`, id
`msg_p5jXN8AQM9LWM0D4loKWxJek`, timestamp `1614265330`, body
`{"test": 2432232314}` → `v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=`.

Receiver rules:
1. Verify the **raw** body. Bad signature or stale timestamp → `401` (PB keeps
   retrying, so fixing a secret recovers on its own).
2. In one transaction: `insert into pb_webhook_inbox(message_id) values ($webhookId) on conflict do nothing`; if it already existed → `204`.
3. Find `document_request` by `id = data.idempotencyKey`. Not found, or a
   different `jobId` than stored → log and `204` (never 4xx, or it is retried
   forever).
4. Apply:

| `data.status` | request before | after |
|---|---|---|
| `ready` | pending / accepted / failed | `ready`; store `objectKey`, `sha256`, `version` |
| `failed` | pending / accepted | `failed`; store `error.code` |
| anything | `ready` | unchanged |

5. Answer `204` within 10 s. Unknown event types → `204`.

Delivery is **at least once** and unordered across jobs; it is retried until
2xx (30 s, 2 m, 10 m, 30 m, 1 h, 2 h, 4 h, 8 h, 12 h, then every 24 h). Don't
answer `410` unless agreed. Secret rotation: PB sends two signatures while both
secrets are configured; switch, then the old one is removed.

## 10. Step 8: opening the PDF

Server-side only, with the shared project's service-role client:

```ts
// 1. Your own permission check for this user, tenant and quotation.
// 2. Resolve the latest ready version through the view (never the tables):
const { data: doc } = await admin
  .from("pb_hris_documents_latest")             // or pb_hris_document_versions + .eq("version", n)
  .select("job_id, version, bucket, object_key, sha256")
  .eq("client_id", PB_CLIENT_ID)                // e.g. "hris-staging"
  .eq("tenant_id", tenantId).eq("quotation_id", quotationId).eq("doc_type", "proposal")
  .maybeSingle();
if (!doc) return res.sendStatus(404);
const keyPattern = new RegExp(`^documents/${PB_CLIENT_ID}/${tenantId}/${quotationId}/proposal_v\\d+\\.pdf$`);
if (doc.bucket !== "proposal-pdfs" || !keyPattern.test(doc.object_key)) throw new Error("unexpected object key");
// 3. Sign for 5 minutes and redirect:
const { data: signed, error } = await admin.storage.from("proposal-pdfs")
  .createSignedUrl(doc.object_key, 300, { download: `proposal-${quotationId}-v${doc.version}.pdf` });
if (error) throw error;
res.set("Cache-Control", "no-store");
return res.redirect(302, signed.signedUrl);
```

REST equivalents: `GET {SUPABASE_URL}/rest/v1/pb_hris_documents_latest?client_id=eq.…&tenant_id=eq.…&quotation_id=eq.…&doc_type=eq.proposal`,
and `POST {SUPABASE_URL}/storage/v1/object/sign/proposal-pdfs/{object_key}` with
`{"expiresIn":300}` (prefix the returned `signedURL` with `{SUPABASE_URL}/storage/v1`).

- Never store, log or email the signed URL — make a new one on every open.
- Optional: compare `sha256` when downloading server-side.
- View columns (only ever added to): `job_id, client_id, tenant_id,
  quotation_id, doc_type, version, modules, bucket, object_key, sha256,
  size_bytes, page_count, client_name, requested_by, idempotency_key,
  requested_at, ready_at`. Only `ready` rows; a ready row never changes; its
  object is never moved, overwritten or deleted.

## 11. Errors and limits

Envelope: `{ "error": code, "message": string, "fields"?: [{ field, message }], "jobId"?: uuid }`.
Every response carries `PB-Request-Id` (quote it when reporting a problem).

| HTTP | `error` | When | Outbox / cron action |
|---|---|---|---|
| 400 | `invalid_json`, `invalid_body` | not JSON / unreadable | permanent / retry |
| 400 | `invalid_fields` | validation; see `fields` | permanent |
| 400 | `idempotency_key_missing`, `idempotency_key_invalid` | header absent or bad | permanent (bug) |
| 400 | `invalid_job_id` | GET id not a UUID | permanent |
| 401 | `unauthorized` | key missing or wrong | retry + alert for 24 h, then permanent |
| 403 | `origin_not_allowed` | browser origin not allowed | permanent |
| 404 | `not_found` | unknown job, or another client's | cron: re-POST with the same key |
| 413 | `body_too_large` | body > 2,000,000 characters | permanent |
| 415 | `unsupported_media_type` | not `application/json` | permanent |
| 422 | `idempotency_key_reused` | same key, different body | keep `accepted`, store `jobId`, alert |
| 429 | `rate_limited` | over the limit | retry after `Retry-After` |
| 500 | `internal_error` | unexpected | retry with backoff |
| 502/504 | (proxy) | during a deploy | retry with backoff |
| 503 | `not_configured` | server not set up | retry + alert |
| 503 | `storage_unavailable` | database unavailable | retry after `Retry-After` |

Limits per client per 10 minutes: 600 POSTs, 3,000 GETs.

## 12. Deprecation and compatibility

- `POST /api/v1/hris/proposals` (v1) still works, with `Deprecation: true`,
  a `Sunset` date and `Link: </api/v1/documents>; rel="successor-version"`.
  Once it sees no traffic for 7 days it answers `410`, then it is removed.
- Within `/v1`, changes are additive only: new response fields and new event
  types may appear — ignore what you don't know. Breaking changes would ship as
  `/v2/documents` alongside.

## 13. HRIS test checklist

- [ ] Replay: resend the same request with the same key → same `jobId`.
- [ ] Different body, same key → `422` with the original `jobId`.
- [ ] Webhook outage: take the receiver down for a while → deliveries resume, once each.
- [ ] Bad signature (wrong secret) → your receiver answers `401`; fix → delivered.
- [ ] Cron recovery: ignore a webhook → the cron finds the job `ready` via GET.
- [ ] Step 8: the 5-minute link opens the PDF and stops working after expiry.
- [ ] A lookup with the wrong `tenant_id` returns nothing.

## 14. Known exception

Step 5 says the database keeps only the document's details. The client logo
sent in the request is kept in the job row as a render input until the job
finishes (ready or failed), then cleared. The generated PDF itself lives only
in file storage.
