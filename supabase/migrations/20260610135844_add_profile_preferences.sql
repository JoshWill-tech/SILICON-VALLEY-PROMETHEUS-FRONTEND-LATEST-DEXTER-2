create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  name text,
  display_name text,
  bio text,
  pronouns text,
  location text,
  avatar_url text,
  theme_preference text not null default 'obsidian',
  font_preference text not null default 'inter',
  notification_preferences jsonb not null default '{"email":{"marketing":false,"security":true,"updates":true},"push":{"browser":false},"inApp":{"realtime":true}}'::jsonb,
  storage_quota_bytes bigint,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists name text,
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists pronouns text,
  add column if not exists location text,
  add column if not exists avatar_url text,
  add column if not exists theme_preference text not null default 'obsidian',
  add column if not exists font_preference text not null default 'inter',
  add column if not exists notification_preferences jsonb not null default '{"email":{"marketing":false,"security":true,"updates":true},"push":{"browser":false},"inApp":{"realtime":true}}'::jsonb,
  add column if not exists storage_quota_bytes bigint,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_deleted_at_idx on public.profiles(deleted_at);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
on public.profiles
for delete
to authenticated
using (id = (select auth.uid()));

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();
