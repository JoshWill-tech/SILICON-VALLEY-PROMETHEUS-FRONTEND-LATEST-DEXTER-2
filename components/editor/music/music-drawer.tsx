'use client'

import * as React from 'react'
import { Music, X } from 'lucide-react'
import { SlideDrawer } from '@/components/ui/slide-drawer'
import { MusicPanel, type MusicPanelProps } from '@/components/editor/MusicPanel'

export interface MusicDrawerProps extends Omit<MusicPanelProps, 'activeWorkspaceTab'> {
  isOpen: boolean
  onClose: () => void
  width?: string
  children?: React.ReactNode
}

export function MusicDrawer({
  isOpen,
  onClose,
  width = 'min(340px, calc(100vw - 24px))',
  children,
  editorMusicRecommendations,
  project,
  selectedEditorMusicTrackId,
  onSelectTrack,
}: MusicDrawerProps) {
  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      direction="right"
      width={width}
      ariaLabel="Music Catalog drawer"
      backdropBlur
    >
      <header className="flex min-h-16 items-center justify-between border-b border-white/[0.08] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-accent-cyan">
            <Music className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">Music Catalog</h2>
            <p className="truncate text-xs text-white/48">Songs, previews, and timeline adds</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close Music Catalog drawer"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 outline-none transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-cyan"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {children ?? (
          <MusicPanel
            activeWorkspaceTab="Music"
            editorMusicRecommendations={editorMusicRecommendations}
            project={project}
            selectedEditorMusicTrackId={selectedEditorMusicTrackId}
            onSelectTrack={onSelectTrack}
          />
        )}
      </div>
    </SlideDrawer>
  )
}
