'use client'

import * as React from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BOTTOM_MODES } from '@/lib/constants'
import type { Project, HeaderNavMode, PreviewMediaKind, BottomMode } from '@/lib/types'

export interface TimelinePanelProps {
  activeWorkspaceTab: HeaderNavMode
  previewKind: PreviewMediaKind
  previewUrl: string
  previewPlaying: boolean
  transportCurrentTime: string
  transportTime: string
  transportProgress: number
  isPreviewMuted: boolean
  project: Project | null
  bottomMode: BottomMode
  onTogglePlayback: () => void
  onSeek: (value: number) => void
  onToggleMute: () => void
  onSetBottomMode: (mode: BottomMode) => void
}

export function TimelinePanel({
  activeWorkspaceTab,
  previewKind,
  previewUrl,
  previewPlaying,
  transportCurrentTime,
  transportTime,
  transportProgress,
  isPreviewMuted,
  project,
  bottomMode,
  onTogglePlayback,
  onSeek,
  onToggleMute,
  onSetBottomMode,
}: TimelinePanelProps) {
  if (activeWorkspaceTab === 'Music') return null

  return (
    <div className="w-full max-w-[min(100%,54rem)] self-center">
      <div className="mt-2.5 flex w-full flex-wrap items-center gap-3 rounded-[20px] border border-white/8 bg-[#0c0c10] px-4 py-2.5">
        <button
          type="button"
          onClick={onTogglePlayback}
          disabled={previewKind !== 'video' || !previewUrl}
          className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/76 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/28"
        >
          {previewPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
        </button>

        <div className="min-w-[84px] text-sm text-white/72">
          {transportCurrentTime} / {transportTime}
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={transportProgress}
          onChange={(event) => onSeek(Number(event.target.value))}
          disabled={previewKind !== 'video' || !previewUrl}
          className="h-1.5 flex-1 accent-white disabled:cursor-not-allowed disabled:opacity-40"
        />

        <button
          type="button"
          onClick={onToggleMute}
          title={isPreviewMuted ? 'Unmute' : 'Mute'}
          aria-label={
            project?.sourceProfile?.inspection.hasAudio === false
              ? `${isPreviewMuted ? 'Unmute' : 'Mute'} (Source detected as silent)`
              : isPreviewMuted
                ? 'Unmute source'
                : 'Mute source'
          }
          className={cn(
            'grid size-9 place-items-center rounded-full border transition-colors',
            isPreviewMuted
              ? 'border-white/8 bg-white/[0.02] text-white/44 hover:text-white/64'
              : 'border-white/14 bg-white/[0.06] text-white/82 hover:text-white',
          )}
        >
          {isPreviewMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>

      <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-2">
        {BOTTOM_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSetBottomMode(mode)}
            className={cn(
              'rounded-full border px-4 py-2 text-xs transition-colors',
              bottomMode === mode
                ? 'border-white/14 bg-white/[0.10] text-white'
                : 'border-white/8 bg-white/[0.03] text-white/56 hover:text-white/78',
            )}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  )
}
