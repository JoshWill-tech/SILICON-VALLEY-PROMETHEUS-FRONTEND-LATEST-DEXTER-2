-- Migration to restore missing columns to projects table and ensure consistency with application logic.

alter table if exists public.projects
  add column if not exists preview_kind text,
  add column if not exists source_profile jsonb not null default '{}'::jsonb,
  add column if not exists editor_state jsonb not null default '{}'::jsonb,
  add column if not exists animation_plan jsonb not null default '{}'::jsonb,
  add column if not exists thumbnail_url text;

-- Ensure name/title consistency
-- The database uses 'name', but application logic often uses 'title'.
-- We'll keep 'name' in DB as per latest migration but ensure mapping is robust.
