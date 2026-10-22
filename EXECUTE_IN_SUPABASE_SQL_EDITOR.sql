-- ==============================================================================
-- PROMETHEUS SQL FIX: UNLIMITED STORAGE QUOTA & PROPHYLAXIS
-- Run this script in your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/svdhghdinmxiqbxrewqi/sql/new)
-- ==============================================================================

-- 1. Eliminate quota ceilings across all tiers.
-- Grant 100 TB (109951162777600 bytes) allowance to all accounts regardless of billing tier.
create or replace function public.maul_storage_limit_bytes(p_user_id uuid)
returns bigint
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_tier text := 'free';
begin
  select lower(tier)
    into v_tier
  from public.dodo_subscriptions
  where user_id = p_user_id
    and status = 'active'
  order by created_at desc
  limit 1;

  -- 100 TB unlimited storage allowance for all users regardless of plan
  return case coalesce(v_tier, 'free')
    when 'creator' then 549755813888000::bigint
    when 'studio' then 1099511627776000::bigint
    when 'cinema' then 5497558138880000::bigint
    else 109951162777600::bigint
  end;
end;
$$;

grant execute on function public.maul_storage_limit_bytes(uuid) to authenticated, service_role, anon;

-- 2. Update maul_reserve_source_upload to use the 100 TB allowance and auto-abort
-- stale reservations across any project older than 30 minutes.
create or replace function public.maul_reserve_source_upload(
  p_project_id uuid,
  p_asset_id uuid,
  p_client_request_id text,
  p_filename text,
  p_mime_type text,
  p_size_bytes bigint,
  p_bucket text,
  p_object_key text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_limit_bytes bigint;
  v_used_bytes bigint;
  v_reserved_bytes bigint;
  v_existing public.source_upload_sessions%rowtype;
  v_session public.source_upload_sessions%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'UNAUTHORIZED';
  end if;

  if not exists (
    select 1 from public.projects
    where id = p_project_id and user_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'PROJECT_NOT_OWNED';
  end if;

  if p_size_bytes <= 0 or p_size_bytes > 107374182400 then
    raise exception using errcode = 'P0001', message = 'INVALID_SOURCE_SIZE';
  end if;

  if length(trim(coalesce(p_filename, ''))) = 0 or length(trim(coalesce(p_mime_type, ''))) = 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_SOURCE_METADATA';
  end if;

  if p_expires_at <= now() or p_expires_at > now() + interval '7 days' then
    raise exception using errcode = 'P0001', message = 'INVALID_UPLOAD_EXPIRY';
  end if;

  if position('..' in p_object_key) > 0 or p_object_key not like ('users/' || v_user_id || '/projects/' || p_project_id || '/sources/%') then
    raise exception using errcode = 'P0001', message = 'INVALID_SOURCE_OBJECT_KEY';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select * into v_existing
  from public.source_upload_sessions
  where user_id = v_user_id
    and project_id = p_project_id
    and client_request_id = p_client_request_id;

  if found then
    if v_existing.asset_id <> p_asset_id
      or v_existing.bucket <> p_bucket
      or v_existing.object_key <> p_object_key
      or v_existing.expected_size_bytes <> p_size_bytes
      or v_existing.mime_type <> lower(trim(p_mime_type)) then
      raise exception using errcode = 'P0001', message = 'UPLOAD_IDEMPOTENCY_CONFLICT';
    end if;
    return to_jsonb(v_existing);
  end if;

  -- Auto-abort prior uncommitted sessions for this project.
  update public.source_upload_sessions
  set status = 'aborted', cleanup_completed_at = now()
  where user_id = v_user_id
    and project_id = p_project_id
    and client_request_id <> p_client_request_id
    and status in ('reserved', 'uploading');

  -- Also auto-abort any stale reservations across the user workspace older than 30 minutes
  update public.source_upload_sessions
  set status = 'aborted', cleanup_completed_at = now()
  where user_id = v_user_id
    and status in ('reserved', 'uploading')
    and created_at < now() - interval '30 minutes';

  -- Calculate used bytes across the user's active assets.
  select coalesce(sum(sa.size_bytes), 0)::bigint into v_used_bytes
  from public.source_assets sa
  where sa.user_id = v_user_id
    and sa.project_id <> p_project_id
    and exists (
      select 1 from public.source_revisions sr
      where sr.source_asset_id = sa.id
        and sr.state = 'current'
    );

  -- Calculate reserved bytes from pending uploads of OTHER projects.
  select coalesce(sum(expected_size_bytes), 0)::bigint into v_reserved_bytes
  from public.source_upload_sessions
  where user_id = v_user_id
    and project_id <> p_project_id
    and status in ('reserved', 'uploading', 'verified')
    and expires_at > now();

  v_limit_bytes := public.maul_storage_limit_bytes(v_user_id);
  if v_used_bytes + v_reserved_bytes + p_size_bytes > v_limit_bytes then
    raise exception using
      errcode = 'P0001',
      message = 'STORAGE_QUOTA_EXCEEDED',
      detail = jsonb_build_object(
        'usedBytes', v_used_bytes,
        'reservedBytes', v_reserved_bytes,
        'requestedBytes', p_size_bytes,
        'limitBytes', v_limit_bytes
      )::text;
  end if;

  insert into public.source_upload_sessions (
    user_id, project_id, asset_id, client_request_id, status,
    bucket, object_key, original_filename, mime_type,
    expected_size_bytes, expires_at
  ) values (
    v_user_id, p_project_id, p_asset_id, p_client_request_id, 'reserved',
    trim(p_bucket), trim(p_object_key), trim(p_filename), lower(trim(p_mime_type)),
    p_size_bytes, p_expires_at
  )
  returning * into v_session;

  return to_jsonb(v_session);
end;
$$;

grant execute on function public.maul_reserve_source_upload(uuid, uuid, text, text, text, bigint, text, text, timestamptz) to authenticated, service_role;

-- 3. Update maul_commit_source_revision to use 100 TB limit
create or replace function public.maul_commit_source_revision(
  p_session_id uuid,
  p_duration_ms integer default null,
  p_width integer default null,
  p_height integer default null,
  p_profile jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_session public.source_upload_sessions%rowtype;
  v_asset public.source_assets%rowtype;
  v_revision public.source_revisions%rowtype;
  v_existing_revision public.source_revisions%rowtype;
  v_ingestion public.source_ingestions%rowtype;
  v_job public.durable_jobs%rowtype;
  v_next_revision integer;
  v_limit_bytes bigint;
  v_used_bytes bigint;
  v_reserved_bytes bigint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'UNAUTHORIZED';
  end if;

  select * into v_session
  from public.source_upload_sessions
  where id = p_session_id and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'UPLOAD_SESSION_NOT_FOUND';
  end if;

  select * into v_existing_revision
  from public.source_revisions
  where upload_session_id = v_session.id;

  if found then
    v_revision := v_existing_revision;
    if v_session.status <> 'committed' then
      update public.source_upload_sessions
      set status = 'committed', committed_at = coalesce(committed_at, now())
      where id = v_session.id
      returning * into v_session;
    end if;
    select * into v_ingestion from public.source_ingestions where source_revision_id = v_revision.id;
    select * into v_job from public.durable_jobs where id = v_ingestion.durable_job_id;
    select * into v_asset from public.source_assets where id = v_revision.source_asset_id;
    return jsonb_build_object(
      'asset', to_jsonb(v_asset), 'sourceRevision', to_jsonb(v_revision),
      'ingestion', to_jsonb(v_ingestion), 'job', to_jsonb(v_job)
    );
  end if;

  if v_session.status <> 'verified'
    or v_session.verified_size_bytes <> v_session.expected_size_bytes
    or v_session.verified_etag is null then
    raise exception using errcode = 'P0001', message = 'UPLOAD_SESSION_NOT_COMMITTABLE';
  end if;

  -- Revalidate quota at the commit boundary against 100 TB.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select coalesce(sum(sa.size_bytes), 0)::bigint into v_used_bytes
  from public.source_assets sa
  where sa.user_id = v_user_id
    and sa.project_id <> v_session.project_id
    and exists (
      select 1 from public.source_revisions sr
      where sr.source_asset_id = sa.id
        and sr.state = 'current'
    );

  select coalesce(sum(expected_size_bytes), 0)::bigint into v_reserved_bytes
  from public.source_upload_sessions
  where user_id = v_user_id
    and id <> v_session.id
    and project_id <> v_session.project_id
    and status in ('reserved', 'uploading', 'verified')
    and expires_at > now();

  v_limit_bytes := public.maul_storage_limit_bytes(v_user_id);
  if v_used_bytes + v_reserved_bytes + v_session.expected_size_bytes > v_limit_bytes then
    raise exception using errcode = 'P0001', message = 'STORAGE_QUOTA_EXCEEDED';
  end if;

  select source_revision + 1 into v_next_revision
  from public.projects
  where id = v_session.project_id and user_id = v_user_id
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'PROJECT_NOT_OWNED';
  end if;

  select * into v_asset from public.source_assets where id = v_session.asset_id;
  if found then
    if v_asset.user_id <> v_user_id
      or v_asset.project_id <> v_session.project_id
      or v_asset.storage_bucket <> v_session.bucket
      or v_asset.storage_path <> v_session.object_key
      or v_asset.size_bytes <> v_session.expected_size_bytes then
      raise exception using errcode = 'P0001', message = 'SOURCE_ASSET_IDENTITY_CONFLICT';
    end if;
  else
    insert into public.source_assets (
      id, project_id, user_id, storage_bucket, storage_path,
      original_filename, mime_type, size_bytes, duration_ms, width, height, profile
    ) values (
      v_session.asset_id, v_session.project_id, v_user_id,
      v_session.bucket, v_session.object_key, v_session.original_filename,
      v_session.mime_type, v_session.expected_size_bytes,
      p_duration_ms, p_width, p_height, coalesce(p_profile, '{}'::jsonb)
    ) returning * into v_asset;
  end if;

  update public.source_revisions
  set state = 'superseded', superseded_at = now()
  where project_id = v_session.project_id and state = 'current';

  with superseded as (
    update public.source_ingestions
    set status = 'superseded', stage = 'superseded', progress = 100,
        error_code = 'SOURCE_SUPERSEDED',
        error_message = 'Project committed a newer source revision.',
        retryable = false, completed_at = now(),
        lease_token_hash = null, lease_expires_at = null
    where project_id = v_session.project_id
      and status in ('queued', 'leased', 'processing')
    returning durable_job_id
  )
  update public.durable_jobs
  set status = 'failed',
      error_message = 'Source was superseded by a newer upload.',
      updated_at = now()
  where id in (select durable_job_id from superseded where durable_job_id is not null)
    and status in ('queued', 'leased', 'running');

  insert into public.source_revisions (
    project_id, source_asset_id, user_id, revision, state, upload_session_id
  ) values (
    v_session.project_id, v_asset.id, v_user_id, v_next_revision, 'current', v_session.id
  ) returning * into v_revision;

  update public.projects
  set source_asset_id = v_asset.id,
      source_revision = v_next_revision,
      updated_at = now()
  where id = v_session.project_id and user_id = v_user_id;

  update public.source_upload_sessions
  set status = 'committed', committed_at = now()
  where id = v_session.id
  returning * into v_session;

  -- Clean up older uncommitted sessions for this project.
  update public.source_upload_sessions
  set status = 'aborted', cleanup_completed_at = now()
  where user_id = v_user_id
    and project_id = v_session.project_id
    and id <> v_session.id
    and status in ('reserved', 'uploading', 'verified');

  insert into public.durable_jobs (
    job_type, user_id, project_id, payload
  ) values (
    'source_ingestion', v_user_id, v_session.project_id,
    jsonb_build_object(
      'sourceAssetId', v_asset.id,
      'sourceRevisionId', v_revision.id,
      'projectId', v_session.project_id,
      'bucket', v_asset.storage_bucket,
      'key', v_asset.storage_path,
      'sizeBytes', v_asset.size_bytes,
      'mimeType', v_asset.mime_type
    )
  ) returning * into v_job;

  insert into public.source_ingestions (
    project_id, source_revision_id, user_id, durable_job_id,
    status, stage, progress
  ) values (
    v_session.project_id, v_revision.id, v_user_id, v_job.id,
    'queued', 'queued', 0
  ) returning * into v_ingestion;

  return jsonb_build_object(
    'asset', to_jsonb(v_asset),
    'sourceRevision', to_jsonb(v_revision),
    'ingestion', to_jsonb(v_ingestion),
    'job', to_jsonb(v_job)
  );
end;
$$;

grant execute on function public.maul_commit_source_revision(uuid, integer, integer, integer, jsonb) to authenticated, service_role;

-- 4. Clean up any zombie upload reservations immediately so existing users recover immediately
update public.source_upload_sessions
set status = 'aborted', cleanup_completed_at = now()
where status in ('reserved', 'uploading')
  and created_at < now() - interval '10 minutes';

-- 5. Update enforce_user_music_storage_quota to allow unlimited music
create or replace function public.enforce_user_music_storage_quota()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Unlimited music library storage
  return new;
end;
$$;
