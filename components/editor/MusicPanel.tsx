'use client'

import * as React from 'react'
import { MusicTabPanel } from '@/components/editor/music-tab-panel'
import type { Project, HeaderNavMode, MusicRecommendation } from '@/lib/types'

export interface MusicPanelProps {
  activeWorkspaceTab: HeaderNavMode
  editorMusicRecommendations: MusicRecommendation[]
  project: Project | null
  selectedEditorMusicTrackId: string | null
  onSelectTrack: (track: MusicRecommendation) => void
}

export function MusicPanel({
  activeWorkspaceTab,
  editorMusicRecommendations,
  project,
  selectedEditorMusicTrackId,
  onSelectTrack,
}: MusicPanelProps) {
  if (activeWorkspaceTab !== 'Music') return null

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 overflow-hidden py-4">
      <MusicTabPanel
        tracks={editorMusicRecommendations}
        projectTitle={project?.title ?? 'Untitled Project'}
        selectedTrackId={selectedEditorMusicTrackId}
        onSelectTrack={onSelectTrack}
      />
    </div>
  )
}
