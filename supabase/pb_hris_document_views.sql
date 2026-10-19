-- The stable read interface for diagram step 8: HRIS reads these views, never the tables.
-- Contract with HRIS (v1). Columns are only ADDED at the end; renames/removals ship as *_v2 alongside.
-- Only status='ready' rows. Requires Postgres 15+ (security_invoker). Safe to re-run.
create or replace view public.pb_hris_document_versions with (security_invoker = true) as
select j.id           as job_id,
       j.client_id, j.tenant_id, j.quotation_id, j.doc_type, j.version,
       j.hrm_modules  as modules,
       j.bucket, j.object_key, j.sha256, j.size_bytes, j.page_count,
       j.client_name, j.requested_by, j.idempotency_key,
       j.created_at   as requested_at,
       j.completed_at as ready_at
  from public.pb_hris_document_jobs j
 where j.status = 'ready';

create or replace view public.pb_hris_documents_latest with (security_invoker = true) as
select distinct on (v.client_id, v.tenant_id, v.quotation_id, v.doc_type) v.*
  from public.pb_hris_document_versions v
 order by v.client_id, v.tenant_id, v.quotation_id, v.doc_type, v.version desc;

revoke all on public.pb_hris_document_versions, public.pb_hris_documents_latest from public, anon, authenticated;
grant select on public.pb_hris_document_versions, public.pb_hris_documents_latest to service_role;
comment on view public.pb_hris_document_versions is
  'Ready HRIS documents. Read-only contract: filter by client_id + tenant_id + quotation_id; sign 300 s URLs from (bucket, object_key).';
comment on view public.pb_hris_documents_latest is
  'Latest ready version per (client_id, tenant_id, quotation_id, doc_type). Same contract as pb_hris_document_versions.';
notify pgrst, 'reload schema';
