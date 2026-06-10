alter table public.projects
add column if not exists description text,
add column if not exists thumbnail_url text,
add column if not exists status text default 'draft',
add column if not exists progress integer default 0,
add column if not exists duration integer,
add column if not exists width integer,
add column if not exists height integer,
add column if not exists fps integer;

alter table public.projects
drop constraint if exists projects_status_check;

alter table public.projects
add constraint projects_status_check
check (status in ('draft', 'rendering', 'completed', 'failed', 'processing', 'ready', 'exported'));

alter table public.projects
drop constraint if exists projects_progress_check;

alter table public.projects
add constraint projects_progress_check
check (progress >= 0 and progress <= 100);

alter table public.projects enable row level security;

drop policy if exists "Users can CRUD own projects" on public.projects;
create policy "Users can CRUD own projects"
  on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
