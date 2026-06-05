'use client'

import * as React from 'react'
import { Pause, Play, Volume2, VolumeX, Layers, Scissors, Music } from 'lucide-react'
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
    <div className="w-full max-w-[min(100%,64rem)] self-center px-4">
      <div className="glass-panel flex flex-col gap-4 bg-abyss/40 p-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]">
        {/* Segments Selector / Rail */}
        <div className="relative h-12 w-full overflow-hidden rounded-xl border border-white/5 bg-void/60">
          {/* Mock Segments */}
          <div className="absolute inset-y-0 left-0 w-[30%] bg-track-video/20 border-r border-track-video/40 flex items-center px-3">
            <span className="text-[10px] uppercase tracking-widest text-track-video font-bold">Intro</span>
          </div>
          <div className="absolute inset-y-0 left-[30%] w-[45%] bg-track-motion/20 border-r border-track-motion/40 flex items-center px-3">
            <span className="text-[10px] uppercase tracking-widest text-track-motion font-bold">Main Content</span>
          </div>
          <div className="absolute inset-y-0 left-[75%] w-[25%] bg-track-text/20 flex items-center px-3">
            <span className="text-[10px] uppercase tracking-widest text-track-text font-bold">Outro</span>
          </div>
          
          {/* Playhead Marker */}
          <div 
            className="absolute inset-y-0 z-10 w-px bg-accent-cyan shadow-[0_0_10px_rgba(0,240,255,0.8)]"
            style={{ left: `${transportProgress}%` }}
          />
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlayback}
              disabled={previewKind !== 'video' || !previewUrl}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white/60 transition-all hover:border-white/20 hover:text-white disabled:opacity-20"
            >
              {previewPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current ml-0.5" />}
            </button>

            <div className="flex flex-col min-w-[100px]">
              <span className="font-mono text-xs font-medium text-white">
                {transportCurrentTime}
              </span>
              <span className="font-mono text-[10px] text-chrome-dim">
                {transportTime}
              </span>
            </div>
          </div>

          <div className="relative flex-1 group">
            <input
              type="range"
              min={0}
              max={100}
              value={transportProgress}
              onChange={(event) => onSeek(Number(event.target.value))}
              disabled={previewKind !== 'video' || !previewUrl}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent-cyan disabled:opacity-20"
            />
            {/* Hover Tooltip Mockup */}
            <div className="absolute -top-8 left-[var(--seek-pos)] hidden group-hover:block translate-x-[-50%] rounded bg-surface px-2 py-1 text-[10px] text-white border border-white/10">
              Seek to Frame
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            >
              {isPreviewMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <div className="h-6 w-px bg-white/8 mx-1" />
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white">
              <Layers className="size-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white">
              <Scissors className="size-4" />
            </button>
          </div>
        </div>

        {/* View Selectors */}
        <div className="flex items-center justify-center gap-1 p-1 bg-void/40 rounded-full border border-white/5 self-center">
          {BOTTOM_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => onSetBottomMode(mode)}
              className={cn(
                'rounded-full px-5 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-all',
                bottomMode === mode
                  ? 'bg-white/10 text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

