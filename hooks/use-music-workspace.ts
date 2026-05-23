'use client'

import * as React from 'react'
import { readLocalStorageJSON, writeLocalStorageJSON } from '@/lib/storage'
import type { MusicRecommendation, StagedMusicTrack } from '@/lib/types'

const STAGED_MUSIC_STORAGE_PREFIX = 'prometheus.editor.staged-music.v1'
const SELECTED_EDITOR_MUSIC_STORAGE_PREFIX = 'prometheus.editor.selected-track.v1'
const MUSIC_PREVIEW_VOLUME_STORAGE_PREFIX = 'prometheus.editor.music-preview-volume.v1'
const DEFAULT_MUSIC_PREVIEW_VOLUME = 0.34

export function useMusicWorkspace(projectId: string) {
  const [selectedEditorMusicTrackId, setSelectedEditorMusicTrackId] = React.useState<string | null>(null)
  const [musicPreviewVolume, setMusicPreviewVolume] = React.useState(DEFAULT_MUSIC_PREVIEW_VOLUME)
  const [stagedTracks, setStagedTracks] = React.useState<StagedMusicTrack[]>([])

  // Load initial state from LocalStorage
  React.useEffect(() => {
    const savedTrackId = readLocalStorageJSON<string | null>(`${SELECTED_EDITOR_MUSIC_STORAGE_PREFIX}.${projectId}`)
    setSelectedEditorMusicTrackId(typeof savedTrackId === 'string' ? savedTrackId : null)

    const savedVolume = readLocalStorageJSON<number>(`${MUSIC_PREVIEW_VOLUME_STORAGE_PREFIX}.${projectId}`)
    if (typeof savedVolume === 'number') setMusicPreviewVolume(savedVolume)

    const savedStaged = readLocalStorageJSON<StagedMusicTrack[]>(`${STAGED_MUSIC_STORAGE_PREFIX}.${projectId}`)
    if (Array.isArray(savedStaged)) setStagedTracks(savedStaged)
  }, [projectId])

  // Sync to LocalStorage
  React.useEffect(() => {
    writeLocalStorageJSON(`${SELECTED_EDITOR_MUSIC_STORAGE_PREFIX}.${projectId}`, selectedEditorMusicTrackId)
  }, [projectId, selectedEditorMusicTrackId])

  React.useEffect(() => {
    writeLocalStorageJSON(`${MUSIC_PREVIEW_VOLUME_STORAGE_PREFIX}.${projectId}`, musicPreviewVolume)
  }, [projectId, musicPreviewVolume])

  React.useEffect(() => {
    writeLocalStorageJSON(`${STAGED_MUSIC_STORAGE_PREFIX}.${projectId}`, stagedTracks)
  }, [projectId, stagedTracks])

  const handleEditorMusicTrackSelect = React.useCallback((trackId: string) => {
    setSelectedEditorMusicTrackId(trackId)
  }, [])

  const handleMusicPreviewVolumeChange = React.useCallback((volume: number) => {
    setMusicPreviewVolume(volume)
  }, [])

  const stageTrack = React.useCallback((recommendation: MusicRecommendation) => {
    setStagedTracks((prev) => {
      if (prev.some((t) => t.recommendation.id === recommendation.id)) return prev
      return [
        ...prev,
        {
          id: `staged_${recommendation.id}_${Date.now()}`,
          projectId,
          recommendation,
          addedAt: new Date().toISOString(),
        },
      ]
    })
  }, [projectId])

  const removeStagedTrack = React.useCallback((stagedId: string) => {
    setStagedTracks((prev) => prev.filter((t) => t.id !== stagedId))
  }, [])

  const clearStagedTracks = React.useCallback(() => {
    setStagedTracks([])
  }, [])

  return {
    selectedEditorMusicTrackId,
    setSelectedEditorMusicTrackId,
    musicPreviewVolume,
    setMusicPreviewVolume,
    stagedTracks,
    setStagedTracks,
    handleEditorMusicTrackSelect,
    handleMusicPreviewVolumeChange,
    stageTrack,
    removeStagedTrack,
    clearStagedTracks,
  }
}
