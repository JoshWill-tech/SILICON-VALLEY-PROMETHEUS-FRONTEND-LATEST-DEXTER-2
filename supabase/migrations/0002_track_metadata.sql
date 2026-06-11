create table if not exists public.track_metadata (
  id uuid primary key default gen_random_uuid(),
  track_id text not null unique,
  artist text,
  title text,
  album text,
  year int,
  isrc text,
  confidence float,
  enriched_at timestamptz,
  created_at timestamptz default now()
);

alter table public.track_metadata enable row level security;

drop policy if exists "Public read track metadata" on public.track_metadata;
create policy "Public read track metadata"
  on public.track_metadata
  for select
  using (true);
