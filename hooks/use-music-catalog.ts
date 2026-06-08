'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'

export type TrackMetadataV2 = {
  id: string
  title?: string | null
  artist?: string | null
  duration_seconds?: number | null
  preview_url?: string | null
  artwork_url?: string | null
  genre?: string | null
  mood?: string | null
  bpm?: number | null
  [key: string]: unknown
}

export function useMusicCatalog(searchQuery = '') {
  const [tracks, setTracks] = React.useState<TrackMetadataV2[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let disposed = false

    async function fetchTracks() {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: queryError } = await supabase
          .from('track_metadata')
          .select('*')
          .order('title', { ascending: true })

        if (disposed) return

        if (queryError) {
          setError(queryError.message)
          setTracks([])
          return
        }

        setTracks((data ?? []) as TrackMetadataV2[])
      } catch (caught) {
        if (!disposed) setError(caught instanceof Error ? caught.message : 'Unable to load music catalog.')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void fetchTracks()

    return () => {
      disposed = true
    }
  }, [])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredTracks = React.useMemo(() => {
    if (!normalizedQuery) return tracks
    return tracks.filter((track) =>
      [track.title, track.artist, track.genre, track.mood]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    )
  }, [normalizedQuery, tracks])

  return { tracks, filteredTracks, loading, error, empty: !loading && !error && tracks.length === 0 }
}
