-- Migration: Add transcript R2 key to source_assets
-- Description: Supports long-term storage of full transcript JSON in R2.

alter table if exists public.source_assets
add column if not exists transcript_r2_key text,
add column if not exists transcript_synced_at timestamptz;

-- Index for R2 key lookups
create index if not exists source_assets_transcript_r2_key_idx on public.source_assets(transcript_r2_key);
