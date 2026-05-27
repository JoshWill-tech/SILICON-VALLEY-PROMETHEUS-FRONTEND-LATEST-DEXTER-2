'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DurableJob, DurableJobStatus } from '@/lib/types/jobs'
import type { ProcessingJob } from '@/lib/types'
import { normalizeUxError } from '@/lib/ux/errors'

export type DurableJobConnectionState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline'

export interface UseDurableJobResult {
  job: DurableJob | null
  processingJob: ProcessingJob | null
  status: DurableJobStatus | 'idle'
  progress: number
  result: Record<string, any> | null
  error: string | null
  isLoading: boolean
  connectionState: DurableJobConnectionState
  refetch: () => Promise<void>
}

export function useDurableJob(jobId: string | null): UseDurableJobResult {
  const [job, setJob] = useState<DurableJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionState, setConnectionState] = useState<DurableJobConnectionState>('idle')
  
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
        setError(normalizeUxError(error, 'job'))
      } else {
        setJob(data)
        setError(null)
      }
    } catch (e) {
      setError(normalizeUxError(e, 'job'))
    }
  }, [jobId, supabase])

  useEffect(() => {
    if (!jobId) {
      let disposed = false
      queueMicrotask(() => {
        if (disposed) return
        setJob(null)
        setError(null)
        setConnectionState('idle')
      })
      return () => {
        disposed = true
      }
    }

    let disposed = false
    queueMicrotask(() => {
      if (disposed) return
      setIsLoading(true)
      setConnectionState('connecting')
      void fetchJob().finally(() => {
        if (!disposed) setIsLoading(false)
      })
    })

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
          setError(null)
          setConnectionState('live')
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useDurableJob] SUCCESSFULLY SUBSCRIBED to real-time updates')
          setConnectionState('live')
          setError(null)
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[useDurableJob] Real-time subscription error:', err)
          setConnectionState('reconnecting')
          setError('Reconnecting to render engine...')
          void fetchJob()
        }
        if (status === 'TIMED_OUT') {
          console.error('[useDurableJob] Real-time subscription timed out')
          setConnectionState('reconnecting')
          setError('Reconnecting to render engine...')
          void fetchJob()
        }
        if (status === 'CLOSED') {
          setConnectionState('offline')
          setError('Render engine connection is paused. We will retry when the channel returns.')
        }
      })

    return () => {
      disposed = true
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
    connectionState,
    refetch: fetchJob
  }
}
