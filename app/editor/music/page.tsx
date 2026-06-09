'use client'

import * as React from 'react'
import Image from 'next/image'
import { Music, Pause, Play, Search } from 'lucide-react'

import { MobileEditorPageShell } from '@/app/editor/components/mobile-editor-page-shell'
import { useR2Music } from '@/app/editor/hooks/use-r2-music'
import type { R2Track } from '@/lib/music/r2-sync'

export default function MusicPage() {
  const { error, isLoading, tracks } = useR2Music()
  const [query, setQuery] = React.useState('')

  const filteredTracks = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return tracks

    return tracks.filter((track) =>
      [track.title, track.artist, track.genre].some((value) => value.toLowerCase().includes(normalizedQuery)),
    )
  }, [query, tracks])

  return (
    <MobileEditorPageShell
      title="Music Library"
      description="R2 soundtrack library"
      icon={Music}
      actions={<span className="text-sm text-white/40">{tracks.length} songs</span>}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tracks..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-accent-cyan/50 focus:outline-none"
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 animate-spin rounded-full border-2 border-accent-cyan/30 border-t-accent-cyan" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-white/40">{error}</div>
        ) : filteredTracks.length === 0 ? (
          <div className="py-12 text-center text-white/40">No tracks found in library</div>
        ) : (
          <div className="space-y-2">
            {filteredTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </div>
    </MobileEditorPageShell>
  )
}

function TrackCard({ track }: { track: R2Track }) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [imageFailed, setImageFailed] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const togglePlay = React.useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(track.url)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [isPlaying, track.url])

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-white/5">
        {track.coverUrl && !imageFailed ? (
          <Image
            src={track.coverUrl}
            alt={track.title}
            fill
            sizes="56px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className="size-6 text-white/20" />
          </div>
        )}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          {isPlaying ? <Pause className="size-6 text-white" /> : <Play className="ml-0.5 size-6 text-white" />}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">{track.title}</div>
        <div className="mt-0.5 truncate text-xs text-white/40">{track.artist}</div>
        <div className="mt-0.5 truncate text-xs text-white/30">{track.genre}</div>
      </div>

      <div className="text-xs font-mono text-white/30">{formatDuration(track.duration)}</div>
    </div>
  )
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}
