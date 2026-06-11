-- STATUS: PENDING — DO NOT PUSH
-- Remove circular reference from projects to source_assets
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS fk_projects_source_asset;
ALTER TABLE public.projects DROP COLUMN IF EXISTS source_asset_id;

-- Documentation: 
-- Projects are now linked to source_assets via the project_id column in the source_assets table.
-- This follows a standard one-to-many relationship pattern.
