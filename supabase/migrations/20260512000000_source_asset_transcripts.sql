-- Migration: Add transcript fields to source_assets
-- Description: Supports early transcription pipeline with AssemblyAI.

alter table public.source_assets 
add column if not exists transcript_status text default 'idle',
add column if not exists transcript_job_id text,
add column if not exists transcript_provider text default 'none',
add column if not exists transcript_text text,
add column if not exists transcript_error text,
add column if not exists transcript_started_at timestamptz,
add column if not exists transcript_completed_at timestamptz;

-- Add check constraint for status
alter table public.source_assets
add constraint source_assets_transcript_status_check 
check (transcript_status in ('idle', 'queued', 'transcribing', 'completed', 'failed', 'skipped'));

-- Index for polling/tracking
create index if not exists source_assets_transcript_status_idx on public.source_assets(transcript_status);
create index if not exists source_assets_transcript_job_id_idx on public.source_assets(transcript_job_id);
