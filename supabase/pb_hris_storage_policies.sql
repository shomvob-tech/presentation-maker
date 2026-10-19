-- Shared project: run ONLY after HRIS has acknowledged it (plan Q11). Safe to re-run.
-- Whatever permissive storage policies HRIS has, anon/authenticated can never read, list,
-- write or sign objects in 'proposal-pdfs'. service_role bypasses RLS; signed URLs are token-checked.
drop policy if exists pb_hris_proposal_pdfs_client_roles_deny on storage.objects;
create policy pb_hris_proposal_pdfs_client_roles_deny on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id <> 'proposal-pdfs')
  with check (bucket_id <> 'proposal-pdfs');
