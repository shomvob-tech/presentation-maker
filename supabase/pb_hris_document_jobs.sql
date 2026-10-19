-- Async HRIS document pipeline (diagram steps 3-6). Run in the Supabase SQL editor (role postgres)
-- BEFORE deploying code that uses it. Safe to re-run. HRIS reads the VIEWS
-- (pb_hris_document_views.sql), not these tables.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proposal-pdfs', 'proposal-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

-- One row per accepted POST /api/v1/documents (the jobId). Owns the idempotency
-- key, the version and the object key from the moment it is enqueued.
create table if not exists public.pb_hris_document_jobs (
  id                  uuid primary key default gen_random_uuid(),                     -- jobId
  queue               text not null check (queue ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),     -- which PB worker pool
  client_id           text not null check (client_id ~ '^[a-z0-9][a-z0-9-]{1,31}$'),  -- HRIS environment (API key)
  idempotency_key     text not null check (idempotency_key ~ '^[A-Za-z0-9_.:-]{1,255}$'),
  request_sha256      text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),        -- raw-body fingerprint
  tenant_id           text not null check (tenant_id ~ '^[A-Za-z0-9_-]{1,64}$'),      -- step-5 owner
  quotation_id        text not null check (quotation_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  doc_type            text not null default 'proposal' check (doc_type in ('proposal')),
  version             int  not null check (version > 0),
  bucket              text not null default 'proposal-pdfs' check (bucket = 'proposal-pdfs'),
  object_key          text not null,
  client_name         text not null,
  hrm_modules         text[] not null,
  input               jsonb not null,      -- { schema: 1, details: ProposalDetails (defaults resolved) }
  logo_data_url       text,                -- transient render input; nulled at ready AND failed
  requested_by        text,
  status              text not null default 'queued'
                        check (status in ('queued','processing','ready','failed')),
  attempts            int  not null default 0 check (attempts >= 0),
  max_attempts        int  not null default 5 check (max_attempts between 1 and 21),
  adoption_grace_used boolean not null default false,
  run_at              timestamptz not null default now(),
  lease_token         uuid,
  lease_expires_at    timestamptz,
  locked_by           text,
  pending_uploads     jsonb not null default '[]'::jsonb check (jsonb_typeof(pending_uploads) = 'array'),
  sha256              text check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes          int  check (size_bytes > 0),
  page_count          int  check (page_count > 0),
  app_version         text,
  error_code          text,
  last_error          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  started_at          timestamptz,
  completed_at        timestamptz,
  constraint pb_hris_document_jobs_client_key_uq unique (client_id, idempotency_key),          -- step 3
  constraint pb_hris_document_jobs_version_uq    unique (client_id, tenant_id, quotation_id, doc_type, version),
  constraint pb_hris_document_jobs_object_uq     unique (bucket, object_key),
  constraint pb_hris_document_jobs_object_key_ck
    check (object_key = 'documents/' || client_id || '/' || tenant_id || '/' || quotation_id || '/'
                        || doc_type || '_v' || version::text || '.pdf'),
  constraint pb_hris_document_jobs_lease_ck
    check ((status = 'processing') = (lease_token is not null and lease_expires_at is not null)),
  constraint pb_hris_document_jobs_ready_ck
    check (status <> 'ready' or (sha256 is not null and size_bytes is not null
                                 and page_count is not null and completed_at is not null))
);

create index if not exists pb_hris_document_jobs_queued_idx
  on public.pb_hris_document_jobs (queue, run_at, created_at) where status = 'queued';
create index if not exists pb_hris_document_jobs_lease_idx
  on public.pb_hris_document_jobs (queue, lease_expires_at) where status = 'processing';
create index if not exists pb_hris_document_jobs_ready_idx
  on public.pb_hris_document_jobs (client_id, tenant_id, quotation_id, doc_type, version desc) where status = 'ready';

-- Step-6 outbox: one row per terminal event, written in the same transaction
-- as the job's final state.
create table if not exists public.pb_hris_webhook_deliveries (
  id               uuid primary key default gen_random_uuid(),
  event_id         text not null unique,                    -- webhook-id
  job_id           uuid not null references public.pb_hris_document_jobs (id),
  client_id        text not null,
  queue            text not null,
  event_type       text not null check (event_type in ('document.ready','document.failed')),
  body             text,                                    -- exact bytes; fixed on the first attempt
  status           text not null default 'pending'
                     check (status in ('pending','delivering','delivered','abandoned','skipped')),
  attempts         int  not null default 0,
  first_attempt_at timestamptz,                             -- horizon (if any) counts from here
  next_attempt_at  timestamptz not null default now(),
  lease_token      uuid,
  lease_expires_at timestamptz,
  last_status_code int,
  last_error       text,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint pb_hris_webhook_deliveries_job_event_uq unique (job_id, event_type),
  constraint pb_hris_webhook_deliveries_lease_ck
    check ((status = 'delivering') = (lease_token is not null and lease_expires_at is not null))
);
create index if not exists pb_hris_webhook_deliveries_due_idx
  on public.pb_hris_webhook_deliveries (queue, client_id, next_attempt_at) where status = 'pending';
create index if not exists pb_hris_webhook_deliveries_lease_idx
  on public.pb_hris_webhook_deliveries (queue, lease_expires_at) where status = 'delivering';

alter table public.pb_hris_document_jobs      enable row level security;
alter table public.pb_hris_webhook_deliveries enable row level security;
revoke all on public.pb_hris_document_jobs, public.pb_hris_webhook_deliveries from public, anon, authenticated;
-- Supabase default privileges give service_role ALL; the app never deletes. Ops deletes run as postgres.
revoke delete, truncate, references, trigger
  on public.pb_hris_document_jobs, public.pb_hris_webhook_deliveries from service_role;
grant select, insert, update on public.pb_hris_document_jobs, public.pb_hris_webhook_deliveries to service_role;
