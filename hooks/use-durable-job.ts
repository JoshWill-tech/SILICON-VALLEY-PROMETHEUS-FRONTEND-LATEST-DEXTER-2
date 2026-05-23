'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DurableJob, DurableJobStatus } from '@/lib/types/jobs'
import type { ProcessingJob } from '@/lib/types'

export interface UseDurableJobResult {
  job: DurableJob | null
  processingJob: ProcessingJob | null
  status: DurableJobStatus | 'idle'
  progress: number
  result: Record<string, any> | null
  error: string | null
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useDurableJob(jobId: string | null): UseDurableJobResult {
  const [job, setJob] = useState<DurableJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Memoize the supabase client so it doesn't trigger effect re-runs
  const supabase = useMemo(() => createClient(), [])

  const fetchJob = useCallback(async () => {
    if (!jobId) return

    try {
      const { data, error } = await supabase
        .from('durable_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setJob(data)
      }
    } catch (e: any) {
      setError(e.message)
    }
  }, [jobId, supabase])

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      setError(null)
      return
    }

    setIsLoading(true)
    fetchJob().finally(() => setIsLoading(false))

    console.log(`[useDurableJob] Subscribing to job: ${jobId}`)

    // Real-time Subscription
    const channel = supabase
      .channel(`job-updates-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'durable_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          console.log('[useDurableJob] Real-time update received:', payload.new)
          // Explicitly update the job state with the new data from Supabase
          setJob(payload.new as DurableJob)
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useDurableJob] SUCCESSFULLY SUBSCRIBED to real-time updates')
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[useDurableJob] Real-time subscription error:', err)
        }
        if (status === 'TIMED_OUT') {
          console.error('[useDurableJob] Real-time subscription timed out')
        }
      })

    return () => {
      console.log(`[useDurableJob] Cleaning up subscription for: ${jobId}`)
      supabase.removeChannel(channel)
    }
  }, [jobId, fetchJob, supabase])

  // Map DurableJob to ProcessingJob for UI compatibility
  const processingJob: ProcessingJob | null = useMemo(() => {
    if (!job) return null
    
    return {
      id: job.id,
      projectId: job.projectId,
      status: job.status === 'completed' ? 'completed' : job.status === 'failed' ? 'failed' : 'running',
      createdAt: job.createdAt,
      startedAt: job.createdAt,
      steps: (job.resultMetadata?.steps || []),
      input: job.resultMetadata?.input || {},
      artifacts: job.resultMetadata?.artifacts || {},
      transcriptStatus: job.resultMetadata?.transcriptStatus,
      transcriptText: job.resultMetadata?.transcriptText,
      editBrief: job.resultMetadata?.editBrief,
      previewProgressSteps: job.resultMetadata?.previewProgressSteps,
    }
  }, [job])

  return {
    job,
    processingJob,
    status: job?.status || 'idle',
    progress: job?.progress || 0,
    result: job?.resultMetadata || null,
    error,
    isLoading,
    refetch: fetchJob
  }
}
