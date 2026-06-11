'use client'

import * as React from 'react'
import { readLocalStorageJSON, writeLocalStorageJSON } from '@/lib/storage'
import type { MusicRecommendation, StagedMusicTrack } from '@/lib/types'

const STAGED_MUSIC_STORAGE_PREFIX = 'prometheus.editor.staged-music.v1'
const SELECTED_EDITOR_MUSIC_STORAGE_PREFIX = 'prometheus.editor.selected-track.v1'
const MUSIC_PREVIEW_VOLUME_STORAGE_PREFIX = 'prometheus.editor.music-preview-volume.v1'
const DEFAULT_MUSIC_PREVIEW_VOLUME = 0.34

export interface MusicWorkspace {
  selectedEditorMusicTrackId: string | null
  setSelectedEditorMusicTrackId: React.Dispatch<React.SetStateAction<string | null>>
  musicPreviewVolume: number
  setMusicPreviewVolume: React.Dispatch<React.SetStateAction<number>>
  stagedTracks: StagedMusicTrack[]
  setStagedTracks: React.Dispatch<React.SetStateAction<StagedMusicTrack[]>>
  handleEditorMusicTrackSelect: (track: MusicRecommendation) => void
  handleMusicPreviewVolumeChange: (volume: number) => void
  stageTrack: (recommendation: MusicRecommendation) => void
  removeStagedTrack: (stagedId: string) => void
  clearStagedTracks: () => void
  activePreviewTrack: MusicRecommendation | null
  previewPlaying: boolean
  togglePreviewTrack: (track: MusicRecommendation) => void
  musicPreviewToggleCooldownRef: React.MutableRefObject<number | null>
}

export function useMusicWorkspace(projectId: string): MusicWorkspace {
  const [selectedEditorMusicTrackId, setSelectedEditorMusicTrackId] = React.useState<string | null>(null)
  const [musicPreviewVolume, setMusicPreviewVolume] = React.useState(DEFAULT_MUSIC_PREVIEW_VOLUME)
  const [stagedTracks, setStagedTracks] = React.useState<StagedMusicTrack[]>([])

  const [activePreviewTrack, setActivePreviewTrack] = React.useState<MusicRecommendation | null>(null)
  const [previewPlaying, setPreviewPlaying] = React.useState(false)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)
  const musicPreviewToggleCooldownRef = React.useRef<number | null>(null)
  const musicPreviewVolumeRef = React.useRef(DEFAULT_MUSIC_PREVIEW_VOLUME)

  // Audio element cleanup
  React.useEffect(() => {
    return () => {
      previewAudioRef.current?.pause()
      previewAudioRef.current = null
    }
  }, [])

  // Sync audio src and play/pause
  React.useEffect(() => {
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio()
    }

    const audio = previewAudioRef.current
    if (!activePreviewTrack) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return
    }

    audio.loop = true
    audio.preload = 'auto'
    audio.volume = musicPreviewVolumeRef.current
    audio.src = activePreviewTrack.previewUrl
    audio.load()

    if (previewPlaying) {
      void audio.play().catch(() => {
        setPreviewPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [activePreviewTrack, previewPlaying])

  React.useEffect(() => {
    musicPreviewVolumeRef.current = musicPreviewVolume
    if (!previewAudioRef.current) return
    previewAudioRef.current.volume = musicPreviewVolume
  }, [musicPreviewVolume])

  const togglePreviewTrack = React.useCallback(
    (track: MusicRecommendation) => {
      if (musicPreviewToggleCooldownRef.current !== null) return

      if (activePreviewTrack?.id === track.id) {
        setPreviewPlaying(!previewPlaying)
      } else {
        setActivePreviewTrack(track)
        setPreviewPlaying(true)
      }

      musicPreviewToggleCooldownRef.current = window.setTimeout(() => {
        musicPreviewToggleCooldownRef.current = null
      }, 220)
    },
    [activePreviewTrack, previewPlaying]
  )

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

  const handleEditorMusicTrackSelect = React.useCallback((track: MusicRecommendation) => {
    setSelectedEditorMusicTrackId(track.id)
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
    activePreviewTrack,
    previewPlaying,
    togglePreviewTrack,
    musicPreviewToggleCooldownRef,
  }
}
