-- Add provider-specific identifiers to user_connections
ALTER TABLE public.user_connections ADD COLUMN IF NOT EXISTS provider_user_id text;
ALTER TABLE public.user_connections ADD COLUMN IF NOT EXISTS provider_username text;
