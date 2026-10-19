-- One-time setup for the HRIS proposal API (app/api/v1/hris/proposals).
-- Run in the Supabase SQL editor. Safe to re-run: every statement is
-- idempotent.

-- ── Table ───────────────────────────────────────────────────────────────
-- One row per generated PDF. Every request for the same company adds a new
-- version; nothing is ever overwritten.
create table if not exists public.pb_hris_documents (
  id            uuid primary key default gen_random_uuid(),
  company_id    text not null,          -- HRIS companies.id
  doc_type      text not null,          -- 'proposal' now; 'device', 'combined' later
  version       int  not null check (version > 0),
  client_name   text not null,
  storage_path  text not null,          -- hris/{company_id}/{doc_type}_v{version}.pdf
  pdf_url       text not null,          -- authenticated Storage URL for storage_path
  input         jsonb not null,         -- exact inputs the PDF was rendered from (logo excluded)
  size_bytes    int,
  page_count    int,
  app_version   text,
  requested_by  text,                   -- optional, whatever HRIS sends (e.g. superadmin email)
  created_at    timestamptz not null default now(),
  unique (company_id, doc_type, version)
);

create index if not exists pb_hris_documents_company_idx
  on public.pb_hris_documents (company_id, doc_type, version desc);

-- The anon key ships in public frontends. RLS on with no policies means
-- anon/authenticated get nothing; the builder uses the service key, which
-- bypasses RLS.
alter table public.pb_hris_documents enable row level security;
revoke all on public.pb_hris_documents from anon, authenticated;
grant select, insert, delete on public.pb_hris_documents to service_role;

-- ── Bucket ──────────────────────────────────────────────────────────────
-- Private: objects are only reachable with a valid key for this project.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proposal-pdfs', 'proposal-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;
