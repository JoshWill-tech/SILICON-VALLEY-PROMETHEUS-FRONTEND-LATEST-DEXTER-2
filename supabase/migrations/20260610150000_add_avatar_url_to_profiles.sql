alter table public.profiles
add column if not exists avatar_url text;

drop policy if exists "Users can update own avatar_url" on public.profiles;
create policy "Users can update own avatar_url"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own avatar_url" on public.profiles;
create policy "Users can read own avatar_url"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);
