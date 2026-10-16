'use client'

import * as React from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export function VideoVolumeControl({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  onInteractionStart,
  onInteractionEnd,
}: {
  volume: number
  muted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  return (
    <div className="flex h-9 items-center gap-1.5 rounded-full bg-black/25 px-1.5 text-white">
      <button
        type="button"
        onClick={onToggleMute}
        className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        title={muted ? 'Unmute video' : 'Mute video'}
      >
        {muted ? <VolumeX className="size-5" aria-hidden="true" /> : <Volume2 className="size-5" aria-hidden="true" />}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={muted ? 0 : volume}
        onChange={(event) => onVolumeChange(Number(event.target.value))}
        onPointerDown={(event) => { event.stopPropagation(); onInteractionStart() }}
        onPointerUp={(event) => { event.stopPropagation(); onInteractionEnd() }}
        onPointerCancel={onInteractionEnd}
        onKeyDown={(event) => event.stopPropagation()}
        onFocus={onInteractionStart}
        onBlur={onInteractionEnd}
        aria-label="Video volume"
        aria-valuetext={muted ? 'Muted' : `${Math.round(volume * 100)}%`}
        className="h-6 w-16 cursor-pointer accent-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:w-20"
      />
      <span aria-hidden="true" className="w-7 text-right text-[10px] tabular-nums text-white/75">
        {muted ? 0 : Math.round(volume * 100)}
      </span>
    </div>
  )
}
