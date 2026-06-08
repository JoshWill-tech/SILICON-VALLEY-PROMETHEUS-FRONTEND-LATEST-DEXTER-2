'use client'

import * as React from 'react'
import {
  DEFAULT_EDITOR_SESSION,
  EDITOR_SESSION_MAX_AGE_MS,
  EDITOR_SESSION_SAVE_INTERVAL_MS,
  EDITOR_SESSION_STORAGE_KEY,
  type EditorPlaybackState,
  type EditorSessionRestoreTargets,
  type EditorSessionSnapshot,
  type EditorSessionState,
} from '@/types/editor-session'

export interface UseEditorSessionOptions extends EditorSessionRestoreTargets {
  storageKey?: string
  getSessionSnapshot?: () => Partial<EditorSessionSnapshot>
  restoreOnMount?: boolean
}

function isPlaybackState(value: unknown): value is EditorPlaybackState {
  return value === 'playing' || value === 'paused'
}

function normalizeSession(value: unknown): EditorSessionState | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<EditorSessionState>
  if (typeof candidate.timestamp !== 'number') return null
  // Session restore is intentionally ephemeral. Anything older than 30 minutes is stale context.
  if (Date.now() - candidate.timestamp > EDITOR_SESSION_MAX_AGE_MS) return null

  return {
    videoCurrentTime:
      typeof candidate.videoCurrentTime === 'number' ? candidate.videoCurrentTime : DEFAULT_EDITOR_SESSION.videoCurrentTime,
    activeTab: typeof candidate.activeTab === 'string' ? candidate.activeTab : DEFAULT_EDITOR_SESSION.activeTab,
    sidebarOpen: typeof candidate.sidebarOpen === 'boolean' ? candidate.sidebarOpen : DEFAULT_EDITOR_SESSION.sidebarOpen,
    selectedTrackId:
      typeof candidate.selectedTrackId === 'string' || candidate.selectedTrackId === null
        ? candidate.selectedTrackId
        : DEFAULT_EDITOR_SESSION.selectedTrackId,
    zoomLevel: typeof candidate.zoomLevel === 'number' ? candidate.zoomLevel : DEFAULT_EDITOR_SESSION.zoomLevel,
    scrollPosition: {
      x:
        typeof candidate.scrollPosition?.x === 'number'
          ? candidate.scrollPosition.x
          : DEFAULT_EDITOR_SESSION.scrollPosition.x,
      y:
        typeof candidate.scrollPosition?.y === 'number'
          ? candidate.scrollPosition.y
          : DEFAULT_EDITOR_SESSION.scrollPosition.y,
    },
    selectedElementId:
      typeof candidate.selectedElementId === 'string' || candidate.selectedElementId === null
        ? candidate.selectedElementId
        : DEFAULT_EDITOR_SESSION.selectedElementId,
    playbackState: isPlaybackState(candidate.playbackState)
      ? candidate.playbackState
      : DEFAULT_EDITOR_SESSION.playbackState,
    timestamp: candidate.timestamp,
  }
}

function readStoredSession(storageKey: string): EditorSessionState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) return null

    const session = normalizeSession(JSON.parse(raw))
    if (!session) {
      window.sessionStorage.removeItem(storageKey)
      return null
    }

    return session
  } catch {
    window.sessionStorage.removeItem(storageKey)
    return null
  }
}

function writeStoredSession(storageKey: string, session: EditorSessionState) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(storageKey, JSON.stringify(session))
}

function getWindowScrollPosition() {
  if (typeof window === 'undefined') return DEFAULT_EDITOR_SESSION.scrollPosition
  return { x: window.scrollX, y: window.scrollY }
}

export function useEditorSession({
  storageKey = EDITOR_SESSION_STORAGE_KEY,
  getSessionSnapshot,
  restoreOnMount = true,
  videoRef,
  scrollContainerRef,
  onActiveTabRestore,
  onSidebarRestore,
  onSelectedTrackRestore,
  onZoomRestore,
  onSelectedElementRestore,
  onPlaybackStateRestore,
}: UseEditorSessionOptions = {}) {
  // React state is used here because the host editor may need a rendering gate while restoration runs.
  const [session, setSession] = React.useState<EditorSessionState>(DEFAULT_EDITOR_SESSION)
  const [restoring, setRestoring] = React.useState(restoreOnMount)
  const sessionRef = React.useRef<EditorSessionState>(DEFAULT_EDITOR_SESSION)
  const hasRestoredRef = React.useRef(false)

  const buildSession = React.useCallback(
    (snapshot: Partial<EditorSessionSnapshot> = {}) => {
      // Pull from refs at save time so callers do not need to update React state every animation frame.
      const videoCurrentTime =
        typeof snapshot.videoCurrentTime === 'number'
          ? snapshot.videoCurrentTime
          : videoRef?.current?.currentTime ?? sessionRef.current.videoCurrentTime

      const scrollPosition =
        snapshot.scrollPosition ??
        (scrollContainerRef?.current
          ? { x: scrollContainerRef.current.scrollLeft, y: scrollContainerRef.current.scrollTop }
          : getWindowScrollPosition())

      return {
        ...DEFAULT_EDITOR_SESSION,
        ...sessionRef.current,
        ...snapshot,
        videoCurrentTime,
        scrollPosition,
        timestamp: Date.now(),
      }
    },
    [scrollContainerRef, videoRef]
  )

  const saveSession = React.useCallback(
    (snapshot: Partial<EditorSessionSnapshot> = {}) => {
      const next = buildSession({
        ...getSessionSnapshot?.(),
        ...snapshot,
      })

      sessionRef.current = next
      setSession(next)
      writeStoredSession(storageKey, next)
      return next
    },
    [buildSession, getSessionSnapshot, storageKey]
  )

  const applySession = React.useCallback(
    (next: EditorSessionState) => {
      sessionRef.current = next
      setSession(next)

      if (videoRef?.current) {
        videoRef.current.currentTime = next.videoCurrentTime
        if (next.playbackState === 'paused') videoRef.current.pause()
      }

      onActiveTabRestore?.(next.activeTab)
      onSidebarRestore?.(next.sidebarOpen)
      onSelectedTrackRestore?.(next.selectedTrackId)
      onZoomRestore?.(next.zoomLevel)
      onSelectedElementRestore?.(next.selectedElementId)
      onPlaybackStateRestore?.(next.playbackState)

      // Scroll after layout so restored tabs/panels have a chance to exist before positioning.
      const restoreScroll = () => {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollTo(next.scrollPosition.x, next.scrollPosition.y)
          return
        }
        window.scrollTo(next.scrollPosition.x, next.scrollPosition.y)
      }

      window.requestAnimationFrame(restoreScroll)
    },
    [
      onActiveTabRestore,
      onPlaybackStateRestore,
      onSelectedElementRestore,
      onSelectedTrackRestore,
      onSidebarRestore,
      onZoomRestore,
      scrollContainerRef,
      videoRef,
    ]
  )

  const restoreSession = React.useCallback(() => {
    const saved = readStoredSession(storageKey)
    const next = saved ?? { ...DEFAULT_EDITOR_SESSION, timestamp: Date.now() }
    applySession(next)
    hasRestoredRef.current = true
    setRestoring(false)
    return saved
  }, [applySession, storageKey])

  const clearSession = React.useCallback(() => {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(storageKey)
    sessionRef.current = DEFAULT_EDITOR_SESSION
    setSession(DEFAULT_EDITOR_SESSION)
  }, [storageKey])

  React.useLayoutEffect(() => {
    if (!restoreOnMount) {
      setRestoring(false)
      return
    }

    restoreSession()
  }, [restoreOnMount, restoreSession])

  React.useEffect(() => {
    if (restoring) return

    // Three-second cadence keeps session state fresh without saving on every timeline tick.
    const intervalId = window.setInterval(() => {
      saveSession()
    }, EDITOR_SESSION_SAVE_INTERVAL_MS)

    const handleBeforeUnload = () => {
      saveSession()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      saveSession()
    }
  }, [restoring, saveSession])

  return {
    session,
    restoring,
    hasRestoredRef,
    saveSession,
    restoreSession,
    clearSession,
  }
}
