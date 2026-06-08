import {
  DEFAULT_EDITOR_SESSION,
  EDITOR_SESSION_MAX_AGE_MS,
  EDITOR_SESSION_STORAGE_KEY,
  type EditorActiveTab,
  type EditorPlaybackState,
  type EditorSessionState,
} from '@/types/editor-session'

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function isActiveTab(value: unknown): value is EditorActiveTab {
  return value === 'timeline' || value === 'preview' || value === 'motion' || value === 'music' || value === 'export'
}

function isPlaybackState(value: unknown): value is EditorPlaybackState {
  return value === 'playing' || value === 'paused' || value === 'buffering'
}

function isSidebarWidth(value: unknown): value is EditorSessionState['sidebarWidth'] {
  return value === 280 || value === 72
}

export function isEditorSessionStale(session: Pick<EditorSessionState, 'timestamp'>, now = Date.now()) {
  return now - session.timestamp > EDITOR_SESSION_MAX_AGE_MS
}

export function normalizeEditorSession(value: unknown, now = Date.now()): EditorSessionState | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<EditorSessionState>
  if (typeof candidate.timestamp !== 'number') return null
  if (isEditorSessionStale({ timestamp: candidate.timestamp }, now)) return null

  return {
    videoCurrentTime:
      typeof candidate.videoCurrentTime === 'number' ? candidate.videoCurrentTime : DEFAULT_EDITOR_SESSION.videoCurrentTime,
    activeTab: isActiveTab(candidate.activeTab) ? candidate.activeTab : DEFAULT_EDITOR_SESSION.activeTab,
    sidebarOpen: typeof candidate.sidebarOpen === 'boolean' ? candidate.sidebarOpen : DEFAULT_EDITOR_SESSION.sidebarOpen,
    sidebarWidth: isSidebarWidth(candidate.sidebarWidth) ? candidate.sidebarWidth : DEFAULT_EDITOR_SESSION.sidebarWidth,
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

export function readEditorSession(storageKey = EDITOR_SESSION_STORAGE_KEY): EditorSessionState | null {
  if (!canUseSessionStorage()) return null

  try {
    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) return null

    const session = normalizeEditorSession(JSON.parse(raw))
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

export function writeEditorSession(session: EditorSessionState, storageKey = EDITOR_SESSION_STORAGE_KEY) {
  if (!canUseSessionStorage()) return
  window.sessionStorage.setItem(storageKey, JSON.stringify(session))
}

export function clearEditorSession(storageKey = EDITOR_SESSION_STORAGE_KEY) {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(storageKey)
}
