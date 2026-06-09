export const SELECTED_EDITOR_MUSIC_STORAGE_PREFIX = 'prometheus.editor.selected-track.v1'
export const SELECTED_EDITOR_MUSIC_EVENT = 'prometheus:editor-selected-music-track'

export type SelectedEditorMusicEventDetail = {
  projectId: string
  trackId: string
}

export function selectedEditorMusicStorageKey(projectId: string) {
  return `${SELECTED_EDITOR_MUSIC_STORAGE_PREFIX}.${projectId}`
}

export function writeSelectedEditorMusicTrack(projectId: string, trackId: string) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(selectedEditorMusicStorageKey(projectId), JSON.stringify(trackId))
  window.dispatchEvent(
    new CustomEvent<SelectedEditorMusicEventDetail>(SELECTED_EDITOR_MUSIC_EVENT, {
      detail: { projectId, trackId },
    }),
  )
}
