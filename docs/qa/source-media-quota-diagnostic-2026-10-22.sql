-- Read-only diagnosis. No media, reservations, subscriptions, or schema change.
-- Run in Project Prometheus's SQL editor with database read permissions.

-- 1. Inspect the functions actually deployed, including overloads.
select
  p.oid::regprocedure::text as deployed_signature,
  pg_catalog.pg_get_functiondef(p.oid) as deployed_definition
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'maul_storage_limit_bytes',
    'maul_reserve_source_upload',
    'maul_commit_source_revision',
    'maul_abort_source_upload'
  )
order by p.proname, p.oid;

-- 2. Set these three values to the affected account, project, and file size.
-- The default user is the local configuration's development account.
-- NULL project/file values still produce an account-wide summary; projected
-- replacement checks stay NULL until BOTH affected-project and size are set.
with input as (
  select
    'e261b522-9d57-4bfe-90c8-38b3720cec36'::uuid as user_id,
    null::uuid as project_id,
    null::bigint as requested_bytes
), assets as (
  select a.id, a.project_id, a.size_bytes,
    exists (
      select 1 from public.source_revisions r
      where r.source_asset_id = a.id and r.state = 'current'
    ) as has_current_revision
  from public.source_assets a
  join input i on a.user_id = i.user_id
), sessions as (
  select s.id, s.project_id, s.status, s.expected_size_bytes, s.expires_at
  from public.source_upload_sessions s
  join input i on s.user_id = i.user_id
  where s.status in ('reserved', 'uploading', 'verified')
), totals as (
  select
    i.*,
    public.maul_storage_limit_bytes(i.user_id) as database_limit_bytes,
    (select coalesce(sum(a.size_bytes), 0) from assets a) as all_asset_bytes,
    (select coalesce(sum(a.size_bytes), 0) from assets a
      where a.has_current_revision) as current_revision_bytes,
    (select coalesce(sum(a.size_bytes), 0) from assets a
      where a.project_id <> i.project_id) as precheck_other_project_asset_bytes,
    (select coalesce(sum(a.size_bytes), 0) from assets a
      where a.project_id <> i.project_id
        and a.has_current_revision) as current_other_project_asset_bytes,
    (select coalesce(sum(s.expected_size_bytes), 0) from sessions s
      where s.expires_at > now()) as unexpired_reserved_bytes,
    (select coalesce(sum(s.expected_size_bytes), 0) from sessions s
      where s.expires_at > now()
        and s.project_id <> i.project_id) as other_project_unexpired_reserved_bytes,
    (select coalesce(sum(s.expected_size_bytes), 0) from sessions s
      where s.expires_at <= now()) as expired_uncommitted_bytes
  from input i
)
select
  t.*,
  4294967296::bigint as intended_free_allowance_bytes,
  case when t.project_id is not null and t.requested_bytes is not null
    then t.all_asset_bytes + t.unexpired_reserved_bytes + t.requested_bytes
      > t.database_limit_bytes
    end as original_reservation_would_reject,
  case when t.project_id is not null and t.requested_bytes is not null
    then t.current_other_project_asset_bytes
      + t.other_project_unexpired_reserved_bytes + t.requested_bytes
      > t.database_limit_bytes
    end as corrected_reservation_would_reject,
  (select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) from sessions s)
    as pending_database_reservations,
  (select coalesce(jsonb_agg(row_to_json(a)), '[]'::jsonb) from assets a)
    as assets_with_revision_accounting
from totals t;
