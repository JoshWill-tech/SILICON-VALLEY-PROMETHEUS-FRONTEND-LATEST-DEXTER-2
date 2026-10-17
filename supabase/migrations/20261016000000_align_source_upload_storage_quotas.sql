-- Keep atomic upload reservation/commit enforcement aligned with
-- lib/storage-limits.ts. The frontend free allowance increased to 4 GiB,
-- but the control-plane function still enforced its former 500 MiB limit.
-- Existing paid allowances, ownership checks, and grants are preserved.
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

  return case coalesce(v_tier, 'free')
    when 'creator' then 536870912000::bigint
    when 'studio' then 2199023255552::bigint
    when 'cinema' then 5497558138880::bigint
    else 4294967296::bigint
  end;
end;
$$;
