-- Functions for the async HRIS document pipeline. Run after pb_hris_document_jobs.sql, and again
-- whenever a function changes. Safe to re-run.
--
-- Rules for changing a function:
-- - If an argument list changes, put `drop function if exists public.<name>(<old arg types>);`
--   above the new definition.
-- - Keep every change compatible with the deployed code, or ship it under a new name.

-- Shared: one delivery row per (job, event), copying client/queue from the job.
create or replace function public.pb_hris_add_delivery(p_job_id uuid, p_event_type text)
returns void language sql volatile security invoker set search_path = public, pg_temp as $$
  insert into public.pb_hris_webhook_deliveries (event_id, job_id, client_id, queue, event_type)
  select 'evt_' || j.id::text || case when p_event_type = 'document.ready' then '_ready' else '_failed' end,
         j.id, j.client_id, j.queue, p_event_type
    from public.pb_hris_document_jobs j where j.id = p_job_id
  on conflict (job_id, event_type) do nothing;
$$;

-- Step 3: idempotency + version/key allocation in ONE transaction.
-- Returns { outcome: 'created' | 'replayed' | 'key_reused', job: <row minus logo/input/ledger> }.
create or replace function public.pb_hris_enqueue_document(
  p_queue text, p_client_id text, p_idempotency_key text, p_request_sha256 text,
  p_tenant_id text, p_quotation_id text, p_doc_type text, p_client_name text,
  p_hrm_modules text[], p_input jsonb, p_logo_data_url text, p_requested_by text)
returns jsonb language plpgsql volatile security invoker set search_path = public, pg_temp as $$
declare
  v_job     public.pb_hris_document_jobs;
  v_version int;
begin
  select * into v_job from public.pb_hris_document_jobs j
   where j.client_id = p_client_id and j.idempotency_key = p_idempotency_key;
  if not found then
    perform pg_advisory_xact_lock(hashtextextended(
      'pb_hris_doc:' || p_client_id || ':' || p_tenant_id || ':' || p_quotation_id || ':' || p_doc_type, 0));
    select coalesce(max(j.version), 0) + 1 into v_version
      from public.pb_hris_document_jobs j
     where j.client_id = p_client_id and j.tenant_id = p_tenant_id
       and j.quotation_id = p_quotation_id and j.doc_type = p_doc_type;
    insert into public.pb_hris_document_jobs
      (queue, client_id, idempotency_key, request_sha256, tenant_id, quotation_id, doc_type, version,
       object_key, client_name, hrm_modules, input, logo_data_url, requested_by)
    values
      (p_queue, p_client_id, p_idempotency_key, p_request_sha256, p_tenant_id, p_quotation_id, p_doc_type, v_version,
       format('documents/%s/%s/%s/%s_v%s.pdf', p_client_id, p_tenant_id, p_quotation_id, p_doc_type, v_version),
       p_client_name, p_hrm_modules, p_input, p_logo_data_url, p_requested_by)
    on conflict (client_id, idempotency_key) do nothing
    returning * into v_job;
    if found then
      return jsonb_build_object('outcome', 'created',
        'job', to_jsonb(v_job) - 'logo_data_url' - 'input' - 'pending_uploads');
    end if;
    -- Same key committed concurrently (possibly for another quotation): read the winner.
    select * into v_job from public.pb_hris_document_jobs j
     where j.client_id = p_client_id and j.idempotency_key = p_idempotency_key;
  end if;
  return jsonb_build_object('outcome',
    case when v_job.request_sha256 = p_request_sha256 then 'replayed' else 'key_reused' end,
    'job', to_jsonb(v_job) - 'logo_data_url' - 'input' - 'pending_uploads');
end $$;

-- Step 4: (a) adoption grace, (b) reap exhausted leases, (c) claim with SKIP LOCKED + lease. Per queue.
create or replace function public.pb_hris_claim_document_jobs(
  p_queue text, p_worker text, p_limit int, p_lease_seconds int)
returns setof public.pb_hris_document_jobs
language plpgsql volatile security invoker set search_path = public, pg_temp as $$
begin
  -- (a) Final attempt died after a ledgered upload: give it one adoption attempt.
  update public.pb_hris_document_jobs j
     set status = 'queued', run_at = now(), max_attempts = j.attempts + 1, adoption_grace_used = true,
         lease_token = null, lease_expires_at = null, locked_by = null, updated_at = now()
   where j.queue = p_queue and j.status = 'processing' and j.lease_expires_at < now()
     and j.attempts >= j.max_attempts and not j.adoption_grace_used
     and jsonb_array_length(j.pending_uploads) > 0
     and exists (select 1 from storage.objects o where o.bucket_id = j.bucket and o.name = j.object_key);

  -- (b) Final attempt died with nothing to adopt: fail it and queue its webhook.
  with dead as (
    update public.pb_hris_document_jobs j
       set status = 'failed', error_code = 'attempts_exhausted',
           last_error = coalesce(j.last_error, 'The worker stopped during the final attempt (crash or redeploy).'),
           logo_data_url = null, completed_at = now(), updated_at = now(),
           lease_token = null, lease_expires_at = null, locked_by = null
     where j.queue = p_queue and j.status = 'processing' and j.lease_expires_at < now()
       and j.attempts >= j.max_attempts
    returning j.id, j.client_id, j.queue
  )
  insert into public.pb_hris_webhook_deliveries (event_id, job_id, client_id, queue, event_type)
  select 'evt_' || dead.id::text || '_failed', dead.id, dead.client_id, dead.queue, 'document.failed' from dead
  on conflict (job_id, event_type) do nothing;

  -- (c) Claim due jobs and expired leases.
  return query
  with candidates as (
    select j.id from public.pb_hris_document_jobs j
     where j.queue = p_queue
       and ((j.status = 'queued' and j.run_at <= now())
         or (j.status = 'processing' and j.lease_expires_at < now()))
       and j.attempts < j.max_attempts
     order by j.run_at, j.created_at
     limit greatest(p_limit, 0)
     for update skip locked
  ), claimed as (
    update public.pb_hris_document_jobs j
       set status = 'processing', attempts = j.attempts + 1, lease_token = gen_random_uuid(),
           lease_expires_at = now() + make_interval(secs => p_lease_seconds),
           locked_by = p_worker, started_at = coalesce(j.started_at, now()), updated_at = now()
      from candidates where j.id = candidates.id
    returning j.*
  )
  select * from claimed;
end $$;

create or replace function public.pb_hris_heartbeat_document_job(p_job_id uuid, p_lease_token uuid, p_lease_seconds int)
returns boolean language plpgsql volatile security invoker set search_path = public, pg_temp as $$
begin
  update public.pb_hris_document_jobs j
     set lease_expires_at = now() + make_interval(secs => p_lease_seconds), updated_at = now()
   where j.id = p_job_id and j.lease_token = p_lease_token and j.status = 'processing';
  return found;
end $$;

-- Step 5 write-ahead ledger (lease-checked, so a stale attempt never uploads).
create or replace function public.pb_hris_note_document_upload(
  p_job_id uuid, p_lease_token uuid, p_sha256 text, p_size_bytes int, p_page_count int)
returns boolean language plpgsql volatile security invoker set search_path = public, pg_temp as $$
begin
  if p_sha256 !~ '^[0-9a-f]{64}$' or p_size_bytes <= 0 or p_page_count <= 0 then
    raise exception 'invalid upload note';
  end if;
  update public.pb_hris_document_jobs j
     set pending_uploads = case
           when j.pending_uploads @> jsonb_build_array(jsonb_build_object('sha256', p_sha256)) then j.pending_uploads
           else j.pending_uploads || jsonb_build_array(jsonb_build_object(
                  'sha256', p_sha256, 'sizeBytes', p_size_bytes, 'pageCount', p_page_count, 'at', now()))
         end,
         updated_at = now()
   where j.id = p_job_id and j.lease_token = p_lease_token and j.status = 'processing';
  return found;
end $$;

-- Steps 5 + 6: ready + delivery row in ONE transaction. Only a ledger hash is accepted.
create or replace function public.pb_hris_complete_document_job(
  p_job_id uuid, p_lease_token uuid, p_sha256 text, p_size_bytes int, p_page_count int, p_app_version text)
returns boolean language plpgsql volatile security invoker set search_path = public, pg_temp as $$
begin
  update public.pb_hris_document_jobs j
     set status = 'ready', sha256 = p_sha256, size_bytes = p_size_bytes, page_count = p_page_count,
         app_version = p_app_version, error_code = null, last_error = null,
         completed_at = now(), updated_at = now(), logo_data_url = null,
         lease_token = null, lease_expires_at = null, locked_by = null
   where j.id = p_job_id and j.lease_token = p_lease_token and j.status = 'processing'
     and j.pending_uploads @> jsonb_build_array(jsonb_build_object(
           'sha256', p_sha256, 'sizeBytes', p_size_bytes, 'pageCount', p_page_count));
  if not found then return false; end if;
  perform public.pb_hris_add_delivery(p_job_id, 'document.ready');
  return true;
end $$;

-- Returns 'requeued' | 'failed' | 'lease_lost'.
create or replace function public.pb_hris_fail_document_job(
  p_job_id uuid, p_lease_token uuid, p_error_code text, p_error_message text,
  p_retryable boolean, p_retry_delay_seconds int)
returns text language plpgsql volatile security invoker set search_path = public, pg_temp as $$
declare v_job public.pb_hris_document_jobs;
begin
  select * into v_job from public.pb_hris_document_jobs j
   where j.id = p_job_id and j.lease_token = p_lease_token and j.status = 'processing'
   for update;
  if not found then return 'lease_lost'; end if;

  if p_retryable and v_job.attempts < v_job.max_attempts then
    update public.pb_hris_document_jobs j
       set status = 'queued', run_at = now() + make_interval(secs => greatest(p_retry_delay_seconds, 0)),
           error_code = p_error_code, last_error = left(p_error_message, 2000), updated_at = now(),
           lease_token = null, lease_expires_at = null, locked_by = null
     where j.id = p_job_id;
    return 'requeued';
  end if;

  -- Final attempt, but a ledgered object is already stored: one adoption attempt instead of failing.
  if p_error_code <> 'object_key_conflict' and not v_job.adoption_grace_used
     and jsonb_array_length(v_job.pending_uploads) > 0
     and exists (select 1 from storage.objects o where o.bucket_id = v_job.bucket and o.name = v_job.object_key) then
    update public.pb_hris_document_jobs j
       set status = 'queued', run_at = now() + interval '30 seconds',
           max_attempts = greatest(j.max_attempts, j.attempts + 1), adoption_grace_used = true,
           error_code = p_error_code, last_error = left(p_error_message, 2000), updated_at = now(),
           lease_token = null, lease_expires_at = null, locked_by = null
     where j.id = p_job_id;
    return 'requeued';
  end if;

  update public.pb_hris_document_jobs j
     set status = 'failed', error_code = p_error_code, last_error = left(p_error_message, 2000),
         logo_data_url = null, completed_at = now(), updated_at = now(),
         lease_token = null, lease_expires_at = null, locked_by = null
   where j.id = p_job_id;
  perform public.pb_hris_add_delivery(p_job_id, 'document.failed');
  return 'failed';
end $$;

-- SIGTERM (best effort): give this worker's jobs back now and refund the attempt.
create or replace function public.pb_hris_release_document_jobs(p_queue text, p_worker text)
returns int language plpgsql volatile security invoker set search_path = public, pg_temp as $$
declare n int;
begin
  update public.pb_hris_document_jobs j
     set status = 'queued', run_at = now(), attempts = greatest(j.attempts - 1, 0), updated_at = now(),
         lease_token = null, lease_expires_at = null, locked_by = null
   where j.queue = p_queue and j.status = 'processing' and j.locked_by = p_worker;
  get diagnostics n = row_count;
  return n;
end $$;

-- Boot: one worker per queue, so every other holder in this queue is dead. Expire their leases
-- WITHOUT refund (a crash-looping poison job must still run out of attempts).
create or replace function public.pb_hris_expire_foreign_leases(p_queue text, p_worker text)
returns int language plpgsql volatile security invoker set search_path = public, pg_temp as $$
declare n int; m int;
begin
  update public.pb_hris_document_jobs j
     set lease_expires_at = now() - interval '1 second', updated_at = now()
   where j.queue = p_queue and j.status = 'processing' and j.locked_by is distinct from p_worker;
  get diagnostics n = row_count;
  update public.pb_hris_webhook_deliveries d
     set lease_expires_at = now() - interval '1 second', updated_at = now()
   where d.queue = p_queue and d.status = 'delivering';
  get diagnostics m = row_count;
  return n + m;
end $$;

-- Step 6 sender: claim only this queue and only clients that are sendable (url or none).
create or replace function public.pb_hris_claim_webhook_deliveries(
  p_queue text, p_clients text[], p_limit int, p_lease_seconds int)
returns setof public.pb_hris_webhook_deliveries
language sql volatile security invoker set search_path = public, pg_temp as $$
  with candidates as (
    select d.id from public.pb_hris_webhook_deliveries d
     where d.queue = p_queue and d.client_id = any(p_clients)
       and ((d.status = 'pending' and d.next_attempt_at <= now())
         or (d.status = 'delivering' and d.lease_expires_at < now()))
     order by d.next_attempt_at
     limit greatest(p_limit, 0)
     for update skip locked
  )
  update public.pb_hris_webhook_deliveries d
     set status = 'delivering', attempts = d.attempts + 1,
         first_attempt_at = coalesce(d.first_attempt_at, now()), lease_token = gen_random_uuid(),
         lease_expires_at = now() + make_interval(secs => p_lease_seconds), updated_at = now()
    from candidates where d.id = candidates.id
  returning d.*;
$$;

create or replace function public.pb_hris_set_webhook_body(p_delivery_id uuid, p_lease_token uuid, p_body text)
returns text language plpgsql volatile security invoker set search_path = public, pg_temp as $$
declare v_body text;
begin
  update public.pb_hris_webhook_deliveries d
     set body = coalesce(d.body, p_body), updated_at = now()
   where d.id = p_delivery_id and d.lease_token = p_lease_token and d.status = 'delivering'
  returning d.body into v_body;
  return v_body;   -- null = lease lost
end $$;

create or replace function public.pb_hris_finish_webhook_delivery(
  p_delivery_id uuid, p_lease_token uuid, p_outcome text, p_status_code int, p_error text, p_retry_delay_seconds int)
returns boolean language plpgsql volatile security invoker set search_path = public, pg_temp as $$
begin
  if p_outcome not in ('delivered','retry','abandon','skip') then raise exception 'bad outcome %', p_outcome; end if;
  update public.pb_hris_webhook_deliveries d
     set status = case p_outcome when 'delivered' then 'delivered' when 'abandon' then 'abandoned'
                                 when 'skip' then 'skipped' else 'pending' end,
         next_attempt_at = case when p_outcome = 'retry'
                                then now() + make_interval(secs => greatest(p_retry_delay_seconds, 1))
                                else d.next_attempt_at end,
         delivered_at = case when p_outcome = 'delivered' then now() else null end,
         last_status_code = p_status_code, last_error = left(p_error, 1000), updated_at = now(),
         lease_token = null, lease_expires_at = null
   where d.id = p_delivery_id and d.lease_token = p_lease_token and d.status = 'delivering';
  return found;
end $$;

create or replace function public.pb_hris_document_queue_stats(p_queue text, p_webhook_clients text[])
returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'queued',        (select count(*) from pb_hris_document_jobs where queue = p_queue and status = 'queued'),
    'processing',    (select count(*) from pb_hris_document_jobs where queue = p_queue and status = 'processing'),
    'expiredLeases', (select count(*) from pb_hris_document_jobs where queue = p_queue and status = 'processing' and lease_expires_at < now()),
    'oldestQueuedSeconds', (select extract(epoch from now() - min(created_at))::int from pb_hris_document_jobs where queue = p_queue and status = 'queued'),
    'failedLast24h', (select count(*) from pb_hris_document_jobs where queue = p_queue and status = 'failed' and completed_at > now() - interval '24 hours'),
    'readyLast24h',  (select count(*) from pb_hris_document_jobs where queue = p_queue and status = 'ready'  and completed_at > now() - interval '24 hours'),
    'webhooksPending',   (select count(*) from pb_hris_webhook_deliveries where queue = p_queue and status in ('pending','delivering') and client_id = any(p_webhook_clients)),
    'webhooksHeld',      (select count(*) from pb_hris_webhook_deliveries where queue = p_queue and status = 'pending' and not (client_id = any(p_webhook_clients))),
    'webhooksAbandoned', (select count(*) from pb_hris_webhook_deliveries where queue = p_queue and status = 'abandoned'),
    'oldestPendingWebhookSeconds', (select extract(epoch from now() - min(created_at))::int from pb_hris_webhook_deliveries
                                     where queue = p_queue and status in ('pending','delivering') and client_id = any(p_webhook_clients)));
$$;

-- Postgres grants EXECUTE to PUBLIC and Supabase grants anon/authenticated on new functions.
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'pb\_hris\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

notify pgrst, 'reload schema';
