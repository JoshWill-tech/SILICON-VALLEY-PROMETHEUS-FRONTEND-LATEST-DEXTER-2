'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ProjectV2 } from './use-project-v2'

export function useProjectsList(limit = 20) {
  const [projects, setProjects] = React.useState<ProjectV2[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let disposed = false

    async function fetchProjects() {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: queryError } = await supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(limit)

        if (disposed) return

        if (queryError) {
          setError(queryError.message)
          setProjects([])
          return
        }

        setProjects((data ?? []) as ProjectV2[])
      } catch (caught) {
        if (!disposed) setError(caught instanceof Error ? caught.message : 'Unable to load projects.')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void fetchProjects()

    return () => {
      disposed = true
    }
  }, [limit])

  return { projects, loading, error, hasProjects: projects.length > 0, mostRecentProject: projects[0] ?? null }
}
