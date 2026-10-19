-- Removes the table from the never-deployed quotationId branch (6abdfc6). Run as postgres, with
-- developer approval, AFTER its objects are gone:
--   npm run hris:cleanup-objects -- --prefix quotations/            (dry run)
--   npm run hris:cleanup-objects -- --prefix quotations/ --apply
-- Inspect first:
--   select count(*), min(created_at), max(created_at) from public.pb_hris_quotation_documents;
drop table if exists public.pb_hris_quotation_documents;
notify pgrst, 'reload schema';
