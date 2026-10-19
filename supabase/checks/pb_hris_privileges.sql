-- Read-only. Run after every migration; each column should show the value in its comment.
select has_table_privilege('anon','public.pb_hris_document_jobs','select')               as anon_jobs,       -- false
       has_table_privilege('anon','public.pb_hris_webhook_deliveries','select')         as anon_deliv,      -- false
       has_table_privilege('authenticated','public.pb_hris_document_versions','select') as auth_view,       -- false
       has_table_privilege('anon','public.pb_hris_documents_latest','select')           as anon_latest,     -- false
       has_table_privilege('service_role','public.pb_hris_document_versions','select')  as svc_view,        -- true
       has_table_privilege('service_role','public.pb_hris_document_jobs','delete')      as svc_delete,      -- false
       has_table_privilege('service_role','storage.objects','select')                   as svc_storage_sel; -- true (needed by grace check)
select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon_exec,                             -- all false
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec                                 -- all false
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname like 'pb\_hris\_%';
select relname, relrowsecurity from pg_class where relname like 'pb\_hris\_%' and relkind = 'r';             -- all true
select policyname, permissive, roles, cmd, qual from pg_policies where schemaname = 'storage';               -- review; deny policy present, RESTRICTIVE
show server_version;                                                                                          -- >= 15
