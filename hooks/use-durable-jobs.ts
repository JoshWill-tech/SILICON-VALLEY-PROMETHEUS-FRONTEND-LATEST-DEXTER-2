'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'

export type DurableJobV2 = {
  id: string
  project_id?: string | null
  type?: string | null
  status?: 'queued' | 'processing' | 'completed' | 'failed' | string | null
  error_message?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: unknown
}

export function getDurableJobStatusLabel(job: DurableJobV2 | null | undefined) {
  if (!job) return 'Ready to process'
  if (!job.status) return 'Processing status unavailable'
  return job.status
}

export function useDurableJobs(projectId: string | null | undefined) {
  const [jobs, setJobs] = React.useState<DurableJobV2[]>([])
  const [loading, setLoading] = React.useState(Boolean(projectId))
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let disposed = false

    async function fetchJobs() {
      if (!projectId) {
        setJobs([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: queryError } = await supabase
          .from('durable_jobs')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (disposed) return

        if (queryError) {
          setError(queryError.message)
          setJobs([])
          return
        }

        setJobs((data ?? []) as DurableJobV2[])
      } catch (caught) {
        if (!disposed) setError(caught instanceof Error ? caught.message : 'Unable to load job status.')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void fetchJobs()

    return () => {
      disposed = true
    }
  }, [projectId])

  const latestJob = jobs[0] ?? null

  return {
    jobs,
    latestJob,
    loading,
    error,
    statusLabel: error ? 'Processing status unavailable' : getDurableJobStatusLabel(latestJob),
  }
}
