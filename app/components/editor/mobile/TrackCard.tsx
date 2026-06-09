'use client'

import * as React from 'react'
import { Check, Music2 } from 'lucide-react'
import type { MusicRecommendation } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrackCardProps {
  isSelected: boolean
  onSelect: (track: MusicRecommendation) => void
  track: MusicRecommendation
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.max(0, Math.round(seconds % 60))
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

export function TrackCard({ isSelected, onSelect, track }: TrackCardProps) {
  const [artFailed, setArtFailed] = React.useState(false)

  return (
    <button
      type="button"
      onClick={() => onSelect(track)}
      aria-pressed={isSelected}
      className={cn(
        'group flex min-h-16 w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-purple/70',
        isSelected
          ? 'border-prometheus-accent-purple/55 bg-prometheus-accent-purple/12 shadow-[0_0_28px_rgba(124,58,237,0.18)]'
          : 'border-white/10 bg-white/[0.035] hover:border-white/16 hover:bg-white/[0.055]',
      )}
    >
      <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.35),rgba(14,165,233,0.16))]">
        {!artFailed ? (
          // Local static artwork supports the existing public assets without remote image configuration.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.coverArtUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setArtFailed(true)}
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-xs font-semibold text-white/82">
            {initials(track.title) || <Music2 className="size-4" />}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white/90">{track.title}</span>
        <span className="mt-1 block truncate text-xs text-white/48">
          {track.artist} / {track.genre}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-xs tabular-nums text-white/42">{formatDuration(track.durationSec)}</span>
        <span
          className={cn(
            'grid h-7 w-7 place-items-center rounded-full border transition-colors',
            isSelected ? 'border-prometheus-accent-purple/50 bg-prometheus-accent-purple/24 text-white' : 'border-white/10 text-white/28 group-hover:text-white/70',
          )}
        >
          {isSelected ? <Check className="size-3.5" /> : <Music2 className="size-3.5" />}
        </span>
      </span>
    </button>
  )
}
