'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'

export type ProjectV2 = {
  id: string
  name?: string | null
  title?: string | null
  status?: string | null
  thumbnail_url?: string | null
  raw_video_url?: string | null
  source_asset_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: unknown
}

export function getProjectDisplayTitle(project: Pick<ProjectV2, 'name' | 'title'> | null | undefined) {
  return project?.title?.trim() || project?.name?.trim() || 'Untitled'
}

export function useProjectV2(projectId: string | null | undefined) {
  const [project, setProject] = React.useState<ProjectV2 | null>(null)
  const [loading, setLoading] = React.useState(Boolean(projectId))
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let disposed = false

    async function fetchProject() {
      if (!projectId) {
        setProject(null)
        setLoading(false)
        setError('Project id is required.')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: queryError } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle()

        if (disposed) return

        if (queryError) {
          setError(queryError.message)
          setProject(null)
          return
        }

        setProject((data ?? null) as ProjectV2 | null)
      } catch (caught) {
        if (!disposed) setError(caught instanceof Error ? caught.message : 'Unable to load project.')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void fetchProject()

    return () => {
      disposed = true
    }
  }, [projectId])

  return {
    project,
    loading,
    error,
    displayTitle: getProjectDisplayTitle(project),
    notFound: !loading && !error && !project,
  }
}
