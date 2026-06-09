'use client'

import * as React from 'react'
import { Mic, Search, Sparkles, X } from 'lucide-react'
import type { MusicRecommendation } from '@/lib/types'
import { MOBILE_EDITOR_TRACKS } from '@/lib/data/mock-tracks'
import { cn } from '@/lib/utils'

import { TrackCard } from '../TrackCard'

const FILTERS = ['All', 'High', 'Medium', 'Low', 'Cinematic', 'Uplifting', 'Minimal'] as const

interface MusicTabProps {
  onTrackSelect?: (track: MusicRecommendation) => void
}

export function MusicTab({ onTrackSelect }: MusicTabProps) {
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>('All')
  const [selectedTrackId, setSelectedTrackId] = React.useState<string | null>(MOBILE_EDITOR_TRACKS[0]?.id ?? null)

  const filteredTracks = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return MOBILE_EDITOR_TRACKS.filter((track) => {
      const matchesQuery =
        !normalizedQuery ||
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery) ||
        track.genre.toLowerCase().includes(normalizedQuery) ||
        track.vibeTags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      const matchesFilter =
        filter === 'All' ||
        track.energy.toLowerCase() === filter.toLowerCase() ||
        track.mood.toLowerCase() === filter.toLowerCase()
      return matchesQuery && matchesFilter
    })
  }, [filter, query])

  const handleSelectTrack = (track: MusicRecommendation) => {
    setSelectedTrackId(track.id)
    onTrackSelect?.(track)
  }

  return (
    <section className="flex flex-col gap-4 px-4 pb-5 pt-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/36">Music Library</div>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Soundtrack tools</h2>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/36" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tracks..."
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-10 pr-20 text-sm text-white outline-none transition-colors placeholder:text-white/34 focus:border-prometheus-accent-purple/70 focus:ring-2 focus:ring-prometheus-accent-purple/20"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-11 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-white/42 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Clear music search"
          >
            <X className="size-4" />
          </button>
        ) : null}
        <button
          type="button"
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-white/42 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Voice search"
        >
          <Mic className="size-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-white/54">149 songs available</span>
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-prometheus-accent-purple/30 bg-prometheus-accent-purple/12 px-3 text-sm font-medium text-white transition-colors hover:bg-prometheus-accent-purple/18"
        >
          <Sparkles className="size-4 text-prometheus-accent-purple" aria-hidden="true" />
          AI Auto-Match
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden" aria-label="Music filters">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              'min-h-9 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors',
              filter === item ? 'border-prometheus-accent-purple/45 bg-prometheus-accent-purple/16 text-white' : 'border-white/10 bg-white/[0.03] text-white/52',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredTracks.map((track) => (
          <TrackCard key={track.id} track={track} isSelected={selectedTrackId === track.id} onSelect={handleSelectTrack} />
        ))}
        {!filteredTracks.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/46">
            No tracks match this search.
          </div>
        ) : null}
      </div>
    </section>
  )
}
