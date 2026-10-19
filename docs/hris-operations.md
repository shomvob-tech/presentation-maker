# HRIS document pipeline — operations runbook

For the async HRIS documents API (`docs/hris-documents-api-v3.md`). The plan
behind it is `notes-plans/hris-document-pipeline-plan.md`.

## Components

| Piece | Where |
|---|---|
| Routes | `app/api/v1/documents`, `app/api/v1/documents/[jobId]`, `app/api/v1/health` → `lib/hris/api.ts` |
| Worker + webhook sender | `lib/hris/worker.ts`, `lib/hris/webhook.ts`, started by `instrumentation.ts` when `HRIS_WORKER_ENABLED=true` |
| Tables | `pb_hris_document_jobs`, `pb_hris_webhook_deliveries` (RLS on, no app deletes) |
| HRIS read views | `pb_hris_document_versions`, `pb_hris_documents_latest` |
| Files | bucket `proposal-pdfs`, prefix `documents/` |

## SQL migrations

Applied by hand in the Supabase SQL editor (role `postgres`), **before** the
deploy that needs them. Every file is additive and safe to re-run.

| # | File | Notes |
|---|---|---|
| 1 | `supabase/pb_hris_document_jobs.sql` | tables, indexes, grants, bucket |
| 2 | `supabase/pb_hris_document_functions.sql` | re-run whenever a function changes |
| 3 | `supabase/pb_hris_document_views.sql` | the HRIS contract |
| 4 | `supabase/pb_hris_storage_policies.sql` | **only after HRIS acknowledges** (shared project) |
| 5 | `supabase/checks/pb_hris_privileges.sql` | read-only; every value as commented |

Code deployed before the SQL answers `503 not_configured`; the worker logs and
backs off.

### Applied

| Date | Project | Files | Commit |
|---|---|---|---|
| 2026-10-19 | dev (shared HRIS) | 1, 2, 3, 5 + SQL smoke test (enqueue/replay/key_reused, namespace isolation, lease reclaim, ledger-checked complete, delivery row, view) | 317f6f0 |
| — | dev | 4 (storage deny policy) | pending HRIS acknowledgement |

## Client registry (`HRIS_CLIENTS_B64`)

One entry per HRIS environment (+ `pb-smoke`, `pb-monitor` for our own checks).

1. Generate per client: `npm run hris:clients -- --new-key` (give the key to
   HRIS privately; the registry keeps only the hash) and, for webhook clients,
   `npm run hris:clients -- --new-secret` (goes in the registry **and** to HRIS).
2. Write `clients.local.json` (gitignored):
   ```json
   [
     { "id": "hris-staging", "apiKeys": ["<key>"], "webhook": "hold" },
     { "id": "hris-dev",     "apiKeys": ["<key>"], "webhook": "hold" },
     { "id": "pb-smoke",     "apiKeys": ["<key>"], "webhook": "none" },
     { "id": "pb-monitor",   "apiKeys": ["<key>"], "webhook": "none", "scopes": ["health"] }
   ]
   ```
   When HRIS supplies a receiver URL, replace `"hold"` with
   `{ "url": "https://…", "secrets": ["whsec_…"] }`.
3. `npm run hris:clients -- --encode clients.local.json --queue staging` →
   validates and prints `HRIS_CLIENTS_B64=…`.
4. A Jenkins admin stores it as the `STG_PM_HRIS_CLIENTS_B64` secret-text
   credential, then re-runs the job (env is read only at container start).
5. Check what is deployed without revealing secrets:
   `npm run hris:clients -- --decode <base64>`.

Key rotation: put two `apiKeys` on the client, redeploy, HRIS switches, remove
the old one. Secret rotation: two `secrets`, redeploy (PB sends both
signatures), HRIS switches, remove the old one.

## Deploy (staging)

Jenkins deploys when `staging` is pushed. Before the first deploy of this
feature: run the SQL (above) and create `STG_PM_HRIS_CLIENTS_B64` —
`withCredentials` fails on a missing credential.

The container runs with `HRIS_QUEUE_NAME=staging`, `--init` (reaps orphaned
Chromium) and `docker stop -t 30`.

After deploy:
- `GET /api/v1/health` with the `pb-monitor` key → `worker.running: true`,
  `queue: "staging"`, `clientsConfigOk: true`.
- Smoke test with the `pb-smoke` key (quotation ids `smoke-*`; needs
  `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` locally to check the stored file):
  ```bash
  HRIS_TEST_API_KEY=<pb-smoke key> npm run test:hris-documents -- https://proposal-builder.shomvob.com --client-id pb-smoke --quotation-prefix smoke --no-webhook --only T-INT-1,T-INT-2,T-INT-3,T-INT-4,T-INT-8,T-INT-9
  ```
  Then play HRIS for step 8:
  `npm run test:hris-signed-url -- pb-smoke it-tenant-a <quotationId from T-INT-1>`.

## Monitoring

- External uptime check on `GET /api/v1/health?strict=1` (pb-monitor key).
  `503` means one of: worker stalled > 60 s, client registry invalid, a job
  queued > 10 min, an expired lease, a render > 180 s, a webhook pending > 1 h.
- `npm run hris:reconcile -- --queue staging [--verify-sha]` — read-only
  consistency report; non-zero exit on any finding.
- Logs: one JSON line per event, `[hris-worker] {...}` and `[hris-api] {...}`.
  Legacy-route traffic shows as `[hris-legacy] call`.

## Rollback

- **Worker only:** Jenkins "Build with Parameters" → `HRIS_WORKER_ENABLED=false`.
  POSTs still return 202; jobs wait in the database until it is back on.
- **Code:** redeploy the previous `staging` commit. The SQL is additive, so no
  database rollback is needed.

## Webhook operations

```sql
-- Re-arm abandoned deliveries (they are only abandoned with a max age, stopOn410, or by hand):
update pb_hris_webhook_deliveries set status = 'pending', next_attempt_at = now() where status = 'abandoned';

-- Before switching a client from "hold" to a URL, drop its test deliveries:
update pb_hris_webhook_deliveries set status = 'abandoned'
 where client_id = 'hris-dev' and status = 'pending'
   and job_id in (select id from pb_hris_document_jobs where quotation_id like 'it-%' or quotation_id like 'smoke-%');
```

## Cleanup (run as `postgres` / with the service key, with approval)

- Objects: `npm run hris:cleanup-objects -- --prefix <prefix>/` (dry run),
  then `--apply`. It never deletes an object a job points at.
- Retired tables: `supabase/cleanup/drop_pb_hris_quotation_documents.sql`
  (never-deployed quotationId branch; objects under `quotations/`),
  `supabase/cleanup/drop_pb_hris_documents.sql` (legacy route, after cutover;
  objects under `hris/`).
- Test jobs: delete `it-*` / `smoke-*` / `local-*` rows as `postgres`
  (deliveries first), then their objects.

## Local testing

1. `npm run hris:clients -- --local-env --queue local-<you> >> .env.local`
   (fresh test keys + secret; `local-test`, `local-test-b`, `local-hold`,
   `local-none` clients; worker on, 20 s lease, test hooks on).
2. `npm run build`, then `npm run start:standalone` and
   `npm run hris:mock-webhook -- --port 4000`.
3. `npm run test:hris-unit`, `npm run test:hrm-modules`,
   `npm run test:hris-documents`, and
   `npm run test:hris-signed-url -- local-test it-tenant-a <quotationId>`.

### Fault drills (restart the server with the setting in `.env.local`)

Test hooks work only with `HRIS_TEST_HOOKS=true` and a `local-*` queue.

| Drill | Setting | Expect |
|---|---|---|
| Crash after upload | `HRIS_WORKER_TEST_FAULT=exit_after_upload`, POST, server exits; remove, restart | `job.adopted` → ready, no second render |
| Crash before upload | `…=exit_before_upload` | next attempt renders again; one object |
| Hung render | `…=hang_render`, `HRIS_WORKER_RENDER_TIMEOUT_MS=15000` | `render.timeout` after ~15 s, job requeued, slot freed |
| Poison | `…=render_throw` | 5 attempts, then `failed` + one `document.failed` |
| Complete fails once | `…=fail_complete_once` | ready via in-process retry |
| Webhook outage | stop the mock, `HRIS_WEBHOOK_RETRY_SCHEDULE_SECONDS=2,2,2` | delivery stays pending with growing attempts; start the mock → delivered once |

Last run 2026-10-19 (Windows, standalone build, dev DB): crash after upload,
hung render and webhook outage all behaved as expected. Graceful shutdown
(SIGTERM) and the container launch are verified on staging (no Docker locally).
