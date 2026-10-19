-- Removes the legacy synchronous route's table (keyed by company_id). Run as postgres only at
-- cleanup (plan R8): after the legacy route has answered 410 for a release and its objects are gone:
--   npm run hris:cleanup-objects -- --prefix hris/            (dry run)
--   npm run hris:cleanup-objects -- --prefix hris/ --apply
-- Inspect first:
--   select count(*), min(created_at), max(created_at) from public.pb_hris_documents;
drop table if exists public.pb_hris_documents;
notify pgrst, 'reload schema';
