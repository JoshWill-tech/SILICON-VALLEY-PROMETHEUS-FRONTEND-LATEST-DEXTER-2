-- Enable Realtime for Durable Jobs
-- This allows the frontend to receive instant updates when a job's progress or status changes.

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'durable_jobs'
  ) then
    alter publication supabase_realtime add table public.durable_jobs;
  end if;
end $$;
