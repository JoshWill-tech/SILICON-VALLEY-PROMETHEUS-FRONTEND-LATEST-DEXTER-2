import { createClient } from '@/lib/supabase/server'
import { ExportService } from '@/lib/exports/service'
import type { ProjectExport } from '@/lib/types'

export interface MediaMetadata {
  id: string
  title: string
  url: string
  thumbnail?: string
  durationMs?: number
  createdAt: string
  projectId: string
}

export const MediaRegistry = {
  async getRecentEdits(userId: string, limit = 10): Promise<MediaMetadata[]> {
    const supabase = await createClient()

    // Fetch completed exports for the user
    const { data, error } = await supabase
      .from('project_exports')
      .select('*, projects(title)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[MediaRegistry] Error fetching recent edits:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.projects?.title || 'Untitled Edit',
      url: row.storage_path, // Note: In a real app, this might need a presigned URL
      durationMs: row.duration_ms,
      createdAt: row.created_at,
      projectId: row.project_id
    }))
  }
}
