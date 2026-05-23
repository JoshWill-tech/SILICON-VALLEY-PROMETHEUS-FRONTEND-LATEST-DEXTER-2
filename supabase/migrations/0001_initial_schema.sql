create extension if not exists "pgcrypto";

do $$
begin
  create type public.project_status as enum ('draft', 'rendering', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.render_status as enum ('queued', 'processing', 'success', 'failed');
exception
  when duplicate_object then null;
end $$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_project_owner_id()
returns trigger
language plpgsql
as $$
begin
  select owner_id
  into new.user_id
  from public.workspaces
  where id = new.workspace_id;

  if new.user_id is null then
    raise exception 'workspace % does not exist or has no owner', new.workspace_id;
  end if;

  return new;
end;
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  status public.project_status not null default 'draft',
  raw_video_url text,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_asset_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.renders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status public.render_status not null default 'queued',
  final_video_url text,
  compute_time_seconds integer,
  created_at timestamptz not null default now(),
  constraint renders_compute_time_seconds_check
    check (compute_time_seconds is null or compute_time_seconds >= 0)
);

create index if not exists workspaces_owner_id_idx on public.workspaces(owner_id);
create index if not exists workspaces_created_at_idx on public.workspaces(created_at);
create index if not exists projects_workspace_id_idx on public.projects(workspace_id);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_created_at_idx on public.projects(created_at);
create index if not exists renders_project_id_idx on public.renders(project_id);
create index if not exists renders_status_idx on public.renders(status);
create index if not exists renders_created_at_idx on public.renders(created_at);

drop trigger if exists set_projects_owner_id on public.projects;
create trigger set_projects_owner_id
before insert or update of workspace_id
on public.projects
for each row
execute function public.sync_project_owner_id();

alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;
alter table public.projects enable row level security;
alter table public.projects force row level security;
alter table public.renders enable row level security;
alter table public.renders force row level security;

drop policy if exists workspaces_select_own on public.workspaces;
create policy workspaces_select_own
on public.workspaces
for select
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists workspaces_insert_own on public.workspaces;
create policy workspaces_insert_own
on public.workspaces
for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists workspaces_update_own on public.workspaces;
create policy workspaces_update_own
on public.workspaces
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists workspaces_delete_own on public.workspaces;
create policy workspaces_delete_own
on public.workspaces
for delete
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists projects_select_own_workspace on public.projects;
create policy projects_select_own_workspace
on public.projects
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = projects.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);

drop policy if exists projects_insert_own_workspace on public.projects;
create policy projects_insert_own_workspace
on public.projects
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = projects.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);

drop policy if exists projects_update_own_workspace on public.projects;
create policy projects_update_own_workspace
on public.projects
for update
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = projects.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = projects.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);

drop policy if exists projects_delete_own_workspace on public.projects;
create policy projects_delete_own_workspace
on public.projects
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = projects.workspace_id
      and workspaces.owner_id = (select auth.uid())
  )
);

drop policy if exists renders_select_own_workspace on public.renders;
create policy renders_select_own_workspace
on public.renders
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    join public.workspaces on workspaces.id = projects.workspace_id
    where projects.id = renders.project_id
      and workspaces.owner_id = (select auth.uid())
  )
);

drop policy if exists renders_insert_own_workspace on public.renders;
create policy renders_insert_own_workspace
on public.renders
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    join public.workspaces on workspaces.id = projects.workspace_id
    where projects.id = renders.project_id
      and workspaces.owner_id = (select auth.uid())
  )
);

drop policy if exists renders_update_own_workspace on public.renders;
create policy renders_update_own_workspace
on public.renders
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    join public.workspaces on workspaces.id = projects.workspace_id
    where projects.id = renders.project_id
      and workspaces.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    join public.workspaces on workspaces.id = projects.workspace_id
    where projects.id = renders.project_id
      and workspaces.owner_id = (select auth.uid())
  )
);

drop policy if exists renders_delete_own_workspace on public.renders;
create policy renders_delete_own_workspace
on public.renders
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    join public.workspaces on workspaces.id = projects.workspace_id
    where projects.id = renders.project_id
      and workspaces.owner_id = (select auth.uid())
  )
);
