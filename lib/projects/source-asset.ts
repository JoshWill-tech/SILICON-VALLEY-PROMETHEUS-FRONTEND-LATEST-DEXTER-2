import 'server-only'

import type {SupabaseClient} from '@supabase/supabase-js'

export type SavedProjectSource = {
  id: string
  storage_path: string | null
  storage_bucket: string | null
  mime_type: string | null
  duration_ms: number | null
  width: number | null
  height: number | null
  transcript_segments?: unknown
}

function readSource(value: unknown): SavedProjectSource | null {
  if (value === null) return null
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved source metadata.')
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || !row.id) throw new Error('Invalid saved source identity.')
  const text = (field: string) => typeof row[field] === 'string' ? row[field] as string : null
  const number = (field: string) => typeof row[field] === 'number' && Number.isFinite(row[field]) ? row[field] as number : null
  return {
    id: row.id, storage_path: text('storage_path'), storage_bucket: text('storage_bucket'), mime_type: text('mime_type'),
    duration_ms: number('duration_ms'), width: number('width'), height: number('height'), transcript_segments: row.transcript_segments,
  }
}

/**
 * Resolve the same owned, registered source for editor recovery and rendering.
 * A present project pointer wins. Without one, prefer the current revision and
 * then legacy assets without revisions; never revive a superseded revision.
 * This reads metadata only and does not repair pointers or prove R2 readability.
 */
export async function resolveSavedProjectSource(
  supabase: SupabaseClient,
  {projectId, userId, sourceAssetId}: {projectId: string; userId: string; sourceAssetId?: string | null},
): Promise<SavedProjectSource | null> {
  const ownedAssets = (columns = '*') => supabase.from('source_assets').select(columns)
    .eq('project_id', projectId).eq('user_id', userId)

  if (sourceAssetId) {
    const {data, error} = await ownedAssets().eq('id', sourceAssetId).maybeSingle()
    if (error) throw error
    return readSource(data)
  }

  const current = await ownedAssets('*, source_revisions!inner(state)')
    .eq('source_revisions.state', 'current')
    .order('created_at', {ascending: false}).limit(1).maybeSingle()
  if (current.error) throw current.error
  if (current.data) return readSource(current.data)

  const legacy = await ownedAssets('*, source_revisions(state)')
    .is('source_revisions', null)
    .order('created_at', {ascending: false}).limit(1).maybeSingle()
  if (legacy.error) throw legacy.error
  return readSource(legacy.data)
}
