-- Enable Realtime for Durable Jobs
-- This allows the frontend to receive instant updates when a job's progress or status changes.

alter publication supabase_realtime add table public.durable_jobs;
