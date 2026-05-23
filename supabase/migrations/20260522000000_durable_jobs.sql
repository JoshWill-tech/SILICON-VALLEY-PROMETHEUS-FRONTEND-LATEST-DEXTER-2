-- Durable Job System for Prometheus
-- This file defines the queue for background tasks like rendering and AI analysis.

-- Enums for Job Types
do $$ begin
    create type public.job_type as enum (
        'render', 
        'scene_detection', 
        'export', 
        'video_analysis', 
        'audio_processing', 
        'ai_enhancement'
    );
exception
    when duplicate_object then null;
end $$;

-- Enums for Job Status
do $$ begin
    create type public.job_status as enum (
        'pending', 
        'processing', 
        'completed', 
        'failed'
    );
exception
    when duplicate_object then null;
end $$;

-- Durable Jobs Table
create table if not exists public.durable_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    project_id uuid references public.projects(id) on delete cascade not null,
    type public.job_type not null,
    status public.job_status not null default 'pending',
    progress integer not null default 0 check (progress >= 0 and progress <= 100),
    result_metadata jsonb not null default '{}'::jsonb,
    error_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.durable_jobs enable row level security;

-- RLS Policies
create policy "Users can view their own jobs" 
on public.durable_jobs for select 
using (auth.uid() = user_id);

create policy "Users can create their own jobs" 
on public.durable_jobs for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own jobs" 
on public.durable_jobs for update 
using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger set_durable_jobs_updated_at
before update on public.durable_jobs
for each row execute function public.handle_updated_at();
