'use client'

import * as React from 'react'
import { 
  PreviewMediaKind, 
  PreviewFitMode, 
  PreviewFramePreset, 
  SessionPreviewState,
  Project,
  ProcessingJob
} from '@/lib/types'
import { getSourcePreviewAspectRatio, getOutputProfileAspectRatio } from '@/lib/media/source-profile'

export function useVideoEngine(projectId: string, project: Project | null, job: ProcessingJob | null) {
  const [previewPlaying, setPreviewPlaying] = React.useState(false)
  const [previewDurationSec, setPreviewDurationSec] = React.useState(0)
  const [previewCurrentTimeSec, setPreviewCurrentTimeSec] = React.useState(0)
  const [previewIntrinsicAspectRatio, setPreviewIntrinsicAspectRatio] = React.useState<number | null>(null)
  const [persistedPreviewUrl, setPersistedPreviewUrl] = React.useState<string | null>(null)
  const [handoffPreview, setHandoffPreview] = React.useState<SessionPreviewState | null>(null)
  const [isPreviewMediaReady, setIsPreviewMediaReady] = React.useState(false)
  const [isPreviewLoadingVisible, setIsPreviewLoadingVisible] = React.useState(false)
  const [isPreviewMuted, setIsPreviewMuted] = React.useState(true)
  const [previewFramePreset, setPreviewFramePreset] = React.useState<PreviewFramePreset>('16:9')
  const [fitMode, setFitMode] = React.useState<PreviewFitMode>('fill')
  const [scale, setScale] = React.useState(100)
  const [offsetX, setOffsetX] = React.useState(0)
  const [offsetY, setOffsetY] = React.useState(0)
  const [isInlineSourceDragOver, setIsInlineSourceDragOver] = React.useState(false)
  const [viralClipSplitPreviewActive, setViralClipSplitPreviewActive] = React.useState(false)

  const previewVideoRef = React.useRef<HTMLVideoElement | null>(null)
  const previewPlaybackIntentRef = React.useRef<'playing' | 'paused'>('paused')
  const previewPlaybackCommandRef = React.useRef(0)
  const previewToggleCooldownRef = React.useRef<number | null>(null)

  const clearPreviewToggleCooldown = React.useCallback(() => {
    if (previewToggleCooldownRef.current === null) return
    window.clearTimeout(previewToggleCooldownRef.current)
    previewToggleCooldownRef.current = null
  }, [])

  const armPreviewToggleCooldown = React.useCallback(() => {
    clearPreviewToggleCooldown()
    previewToggleCooldownRef.current = window.setTimeout(() => {
      previewToggleCooldownRef.current = null
    }, 220)
  }, [clearPreviewToggleCooldown])

  const startPreviewPlayback = React.useCallback(() => {
    const previewUrl = handoffPreview?.url ?? persistedPreviewUrl ?? project?.thumbnailUrl ?? ''
    const previewKind = (handoffPreview?.kind ?? project?.previewKind ?? 'video') as PreviewMediaKind
    
    if (previewKind !== 'video' || !previewUrl) return
    const video = previewVideoRef.current
    if (!video) return

    previewPlaybackIntentRef.current = 'playing'
    const commandId = ++previewPlaybackCommandRef.current
    const playPromise = video.play()
    setPreviewPlaying(true)

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (previewPlaybackCommandRef.current !== commandId) return
        if (previewPlaybackIntentRef.current !== 'playing') return
        setPreviewPlaying(false)
      })
    }
  }, [handoffPreview, persistedPreviewUrl, project?.thumbnailUrl, project?.previewKind])

  const pausePreviewPlayback = React.useCallback(() => {
    const video = previewVideoRef.current
    if (!video) return
    previewPlaybackIntentRef.current = 'paused'
    video.pause()
    setPreviewPlaying(false)
  }, [])

  const togglePreviewPlayback = React.useCallback(() => {
    if (previewToggleCooldownRef.current !== null) return
    armPreviewToggleCooldown()
    if (previewPlaybackIntentRef.current === 'playing') {
      pausePreviewPlayback()
    } else {
      startPreviewPlayback()
    }
  }, [pausePreviewPlayback, startPreviewPlayback, armPreviewToggleCooldown])

  const handlePreviewMetadataLoaded = React.useCallback(() => {
    const video = previewVideoRef.current
    if (!video) return
    setPreviewDurationSec(Number.isFinite(video.duration) ? video.duration : 0)
    if (Number.isFinite(video.videoWidth) && Number.isFinite(video.videoHeight) && video.videoWidth > 0 && video.videoHeight > 0) {
      setPreviewIntrinsicAspectRatio(video.videoWidth / video.videoHeight)
    }
  }, [])

  const handlePreviewVideoReady = React.useCallback(() => {
    handlePreviewMetadataLoaded()
    setIsPreviewMediaReady(true)
  }, [handlePreviewMetadataLoaded])

  const handlePreviewTimeUpdate = React.useCallback(() => {
    const video = previewVideoRef.current
    if (!video) return
    setPreviewCurrentTimeSec(video.currentTime)
  }, [])

  const handlePreviewEnded = React.useCallback(() => {
    setPreviewPlaying(false)
    previewPlaybackIntentRef.current = 'paused'
  }, [])

  const handlePreviewVideoPlay = React.useCallback(() => {
    setPreviewPlaying(true)
    previewPlaybackIntentRef.current = 'playing'
  }, [])

  const handlePreviewVideoPause = React.useCallback(() => {
    setPreviewPlaying(false)
    previewPlaybackIntentRef.current = 'paused'
  }, [])

  const handlePreviewImageLoaded = React.useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setPreviewIntrinsicAspectRatio(image.naturalWidth / image.naturalHeight)
      }
      setIsPreviewMediaReady(true)
    },
    [],
  )

  // Computed values
  const previewAspectRatio = getSourcePreviewAspectRatio(
    project?.sourceProfile ?? null,
    project?.previewKind === 'image' ? 1 : 16 / 9,
  )
  const resolvedPreviewAspectRatio =
    previewFramePreset === 'source'
      ? previewIntrinsicAspectRatio ?? previewAspectRatio
      : getOutputProfileAspectRatio(previewFramePreset, project?.sourceProfile ?? null)

  const hasPreviewFrameAdjustment = scale !== 100 || offsetX !== 0 || offsetY !== 0
  const previewFrameTransformStyle = hasPreviewFrameAdjustment
    ? {
        transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale / 100})`,
        transformOrigin: 'center center',
        willChange: 'transform',
      }
    : undefined

  return {
    previewPlaying,
    setPreviewPlaying,
    previewDurationSec,
    setPreviewDurationSec,
    previewCurrentTimeSec,
    setPreviewCurrentTimeSec,
    previewIntrinsicAspectRatio,
    setPreviewIntrinsicAspectRatio,
    persistedPreviewUrl,
    setPersistedPreviewUrl,
    handoffPreview,
    setHandoffPreview,
    isPreviewMediaReady,
    setIsPreviewMediaReady,
    isPreviewLoadingVisible,
    setIsPreviewLoadingVisible,
    isPreviewMuted,
    setIsPreviewMuted,
    previewFramePreset,
    setPreviewFramePreset,
    fitMode,
    setFitMode,
    scale,
    setScale,
    offsetX,
    setOffsetX,
    offsetY,
    setOffsetY,
    isInlineSourceDragOver,
    setIsInlineSourceDragOver,
    viralClipSplitPreviewActive,
    setViralClipSplitPreviewActive,
    previewVideoRef,
    previewPlaybackIntentRef,
    previewPlaybackCommandRef,
    previewToggleCooldownRef,
    clearPreviewToggleCooldown,
    armPreviewToggleCooldown,
    startPreviewPlayback,
    pausePreviewPlayback,
    togglePreviewPlayback,
    handlePreviewMetadataLoaded,
    handlePreviewVideoReady,
    handlePreviewTimeUpdate,
    handlePreviewEnded,
    handlePreviewVideoPlay,
    handlePreviewVideoPause,
    handlePreviewImageLoaded,
    resolvedPreviewAspectRatio,
    previewFrameTransformStyle
  }
}
