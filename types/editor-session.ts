import type * as React from 'react'

export const EDITOR_SESSION_STORAGE_KEY = 'prometheus_editor_session'
export const EDITOR_SESSION_MAX_AGE_MS = 1000 * 60 * 30
export const EDITOR_SESSION_SAVE_INTERVAL_MS = 1000 * 3

export type EditorPlaybackState = 'playing' | 'paused'

// Persist only editor UI/runtime state that is safe to restore inside one browser session.
export interface EditorScrollPosition {
  x: number
  y: number
}

export interface EditorSessionState {
  videoCurrentTime: number
  activeTab: string
  sidebarOpen: boolean
  selectedTrackId: string | null
  zoomLevel: number
  scrollPosition: EditorScrollPosition
  selectedElementId: string | null
  playbackState: EditorPlaybackState
  timestamp: number
}

export type EditorSessionSnapshot = Omit<EditorSessionState, 'timestamp'> & {
  timestamp?: number
}

// Optional integration callbacks let the hook restore real editor state without knowing app internals.
export interface EditorSessionRestoreTargets {
  videoRef?: React.RefObject<HTMLVideoElement | null>
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  onActiveTabRestore?: (activeTab: string) => void
  onSidebarRestore?: (sidebarOpen: boolean) => void
  onSelectedTrackRestore?: (selectedTrackId: string | null) => void
  onZoomRestore?: (zoomLevel: number) => void
  onSelectedElementRestore?: (selectedElementId: string | null) => void
  onPlaybackStateRestore?: (playbackState: EditorPlaybackState) => void
}

export const DEFAULT_EDITOR_SESSION: EditorSessionState = {
  videoCurrentTime: 0,
  activeTab: 'timeline',
  sidebarOpen: true,
  selectedTrackId: null,
  zoomLevel: 1,
  scrollPosition: { x: 0, y: 0 },
  selectedElementId: null,
  playbackState: 'paused',
  timestamp: 0,
}
