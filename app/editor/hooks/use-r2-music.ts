'use client'

import * as React from 'react'

import { fetchR2Tracks, type R2Track } from '@/lib/music/r2-sync'

export function useR2Music() {
  const [tracks, setTracks] = React.useState<R2Track[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    fetchR2Tracks()
      .then((nextTracks) => {
        if (cancelled) return
        setTracks(nextTracks)
        setError(null)
      })
      .catch((nextError: unknown) => {
        if (cancelled) return
        setTracks([])
        setError(nextError instanceof Error ? nextError.message : 'Unable to load R2 tracks')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { error, isLoading, tracks }
}
