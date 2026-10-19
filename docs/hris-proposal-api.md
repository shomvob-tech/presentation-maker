# HRIS Proposal API

Generates an HRIS proposal PDF from JSON, stores it in Supabase Storage as the
next version for the company, and returns where it was stored. The PDF is
identical to one made in the public proposal builder.

| | |
|---|---|
| Endpoint | `POST /api/v1/hris/proposals` |
| Deployed base URL | `https://proposal-builder.shomvob.com` |
| Local base URL | `http://localhost:3000` |
| Auth | `x-api-key` header (key shared privately, one per environment) |
| Typical time | 4–8 seconds per request |

## Authentication

Every request needs the header `x-api-key: <key>`. The key is handed over
privately; never commit it or put it in public JavaScript. If HRIS calls from
the browser, serve the key only to signed-in superadmins.

Browser calls are only accepted from these origins:

- `https://hr.shomvob.com`
- `https://staging.hr.shomvob.com`
- `https://dev.hr.shomvob.com`

Any other origin gets `403`. The browser sends an `OPTIONS` preflight before the
`POST` automatically; nothing extra is needed. Server-to-server calls (no
`Origin` header) only need the key.

## Request

Headers: `Content-Type: application/json`, `x-api-key: <key>`.

| Field | Type | Required | Default when omitted |
|---|---|---|---|
| `companyId` | string or number | yes | — HRIS `companies.id`. Letters, digits, `-`, `_`; max 64 |
| `clientName` | string | yes | — |
| `employeeCount` | whole number > 0 | yes | — |
| `mrcFee` | number > 0 (BDT/month) | yes | — |
| `rolloutCharge` | number > 0 (BDT) | | not shown |
| `fieldTrackingFee` | number > 0 (BDT per user) | | not shown |
| `logo` | base64 data URL (png, jpeg, webp, gif, svg), ≤ 1 MB | | no logo |
| `documentTitle` | string | | `Workforce Management Ecosystem` |
| `recipientTitle` | string | | `Managing Director` |
| `letterAddresseeName` | string | | `clientName` |
| `preparedDate` | `YYYY-MM-DD` | | today (Dhaka) |
| `meetingDateReference` | `YYYY-MM-DD` | | today (Dhaka) |
| `validityDays` | whole number > 0 | | `30` |
| `selectedModules` | array of module ids (below) | | `attendance`, `leave`, `payroll`, `roster` |
| `problemStatementHeading` | string | | none |
| `problemStatementText` | HTML string (`<p>`, `<strong>`, lists), ≤ 20,000 chars | | section left out |
| `preparedByName`, `preparedByTitle`, `preparedByPhone`, `preparedByEmail` | string | | "Shomvob Technologies Limited" |
| `requestedBy` | string | | stored for audit only, e.g. superadmin email |

Numbers may be sent as numeric strings (`"250"`). Text fields max 200
characters unless noted. **Unknown fields are rejected** so typos surface as
errors instead of a silently wrong PDF.

Module ids: `employee-management`, `attendance`, `leave`, `payroll`, `roster`,
`device-integration`, `access-configuration`, `ewa`, `expense-management`,
`assets`, `document-management`, `visit-management`, `announcements`,
`employee-tracking`.

### Example

```js
const res = await fetch("https://proposal-builder.shomvob.com/api/v1/hris/proposals", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": HRIS_API_KEY },
  body: JSON.stringify({
    companyId: company.id,
    clientName: company.name,
    employeeCount: 250,
    mrcFee: 25000,
    rolloutCharge: 50000,
    selectedModules: ["attendance", "leave", "payroll", "roster"],
    requestedBy: superadmin.email,
  }),
});
const result = await res.json();
if (!res.ok) throw new Error(`${result.error}: ${result.message}`);
```

## Response

`201 Created`:

```json
{
  "id": "46f868f7-fe16-4f0a-b280-a2be50e58cf1",
  "companyId": "123",
  "docType": "proposal",
  "version": 3,
  "path": "hris/123/proposal_v3.pdf",
  "url": "https://egtfjncokjimylilrxip.supabase.co/storage/v1/object/authenticated/proposal-pdfs/hris/123/proposal_v3.pdf",
  "pageCount": 4,
  "sizeBytes": 338375,
  "createdAt": "2026-10-18T07:22:09.077555+00:00"
}
```

The file is already uploaded when this response arrives.

## Errors

All errors are JSON: `{ "error": "<code>", "message": "...", "fields"?: [...] }`.

| Status | `error` | Meaning |
|---|---|---|
| 400 | `invalid_fields` | `fields` lists each `{ field, message }` problem |
| 400 | `invalid_json` / `invalid_body` | Body isn't a JSON object |
| 401 | `unauthorized` | Missing or wrong `x-api-key` |
| 403 | `origin_not_allowed` | Browser origin not in the allowed list |
| 413 | `body_too_large` | Body over 2 MB |
| 429 | `rate_limited` | Over 60 requests / 10 min from one IP; see `Retry-After` |
| 503 | `busy` | Too many PDFs rendering at once; retry after `Retry-After` seconds |
| 503 | `not_configured` | Server missing its configuration |
| 500 | `render_failed` / `storage_failed` | Generation or upload failed; `message` says why |

## Versioning

Every request for the same `companyId` creates a new version: `proposal_v1.pdf`,
`proposal_v2.pdf`, … Nothing is overwritten or deleted. Simultaneous requests
for one company always get distinct version numbers.

## Fetching the stored PDF

The bucket `proposal-pdfs` is private. The `url` in the response works only
with the project's **service-role key**, which must stay on a server, never in
browser code.

Download (server-side):

```
GET {url}
apikey: <SUPABASE_SERVICE_KEY>
Authorization: Bearer <SUPABASE_SERVICE_KEY>
```

To give a browser a link, create a short-lived signed URL server-side:

```
POST {SUPABASE_URL}/storage/v1/object/sign/proposal-pdfs/{path}
apikey: <SUPABASE_SERVICE_KEY>
Authorization: Bearer <SUPABASE_SERVICE_KEY>
Content-Type: application/json

{ "expiresIn": 600 }
```

The response is `{ "signedURL": "/object/sign/..." }`; the full link is
`{SUPABASE_URL}/storage/v1` + `signedURL`.

With supabase-js:

```js
const { data } = await supabase.storage.from("proposal-pdfs").download(path);
const { data: link } = await supabase.storage
  .from("proposal-pdfs")
  .createSignedUrl(path, 600, { download: "Acme_Proposal_v3.pdf" });
```

Every version is also a row in `public.pb_hris_documents` (`id`, `company_id`,
`doc_type`, `version`, `storage_path`, `pdf_url`, `client_name`, `input`,
`page_count`, `size_bytes`, `requested_by`, `created_at`), readable with the
service-role key. Latest version for a company:

```sql
select * from public.pb_hris_documents
where company_id = '123' and doc_type = 'proposal'
order by version desc limit 1;
```
