'use client'

import * as React from 'react'
import {
  DEFAULT_EDITOR_SESSION,
  EDITOR_SESSION_SAVE_INTERVAL_MS,
  EDITOR_SESSION_STORAGE_KEY,
  type EditorSessionRestoreTargets,
  type EditorSessionSnapshot,
  type EditorSessionState,
} from '@/types/editor-session'
import { clearEditorSession, readEditorSession, writeEditorSession } from '@/lib/editor-session-storage'

export interface UseEditorSessionOptions extends EditorSessionRestoreTargets {
  storageKey?: string
  getSessionSnapshot?: () => Partial<EditorSessionSnapshot>
  restoreOnMount?: boolean
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
        sidebarWidth: snapshot.sidebarOpen === false ? 72 : snapshot.sidebarWidth ?? sessionRef.current.sidebarWidth,
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
      writeEditorSession(next, storageKey)
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

      if (next.selectedElementId) {
        const selectedElementId = next.selectedElementId
        window.requestAnimationFrame(() => {
          const target = document.getElementById(selectedElementId)
          target?.setAttribute('data-editor-session-selected', 'true')
          target?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        })
      }

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
    const saved = readEditorSession(storageKey)
    const next = saved ?? { ...DEFAULT_EDITOR_SESSION, timestamp: Date.now() }
    applySession(next)
    hasRestoredRef.current = true
    setRestoring(false)
    return saved
  }, [applySession, storageKey])

  const clearSession = React.useCallback(() => {
    clearEditorSession(storageKey)
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveSession()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      saveSession()
    }
  }, [restoring, saveSession])

  React.useEffect(() => {
    if (restoring || !videoRef?.current) return

    const video = videoRef.current
    let lastSavedAt = 0
    const handleTimeUpdate = () => {
      const now = Date.now()
      if (now - lastSavedAt < 1000) return
      lastSavedAt = now
      sessionRef.current = {
        ...sessionRef.current,
        videoCurrentTime: video.currentTime,
        playbackState: video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA ? 'buffering' : video.paused ? 'paused' : 'playing',
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [restoring, videoRef])

  return {
    session,
    restoring,
    hasRestoredRef,
    saveSession,
    restoreSession,
    clearSession,
  }
}
