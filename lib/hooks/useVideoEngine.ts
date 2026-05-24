'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { 
  PreviewMediaKind, 
  PreviewFitMode, 
  PreviewFramePreset, 
  SessionPreviewState,
  Project,
  ProcessingJob,
  CinematicAssetRegistry,
  AnimationPlan,
  ViralClipTargetPlatform,
} from '@/lib/types'
import { getSourcePreviewAspectRatio, getOutputProfileAspectRatio } from '@/lib/media/source-profile'
import { createSourceAssetObjectUrl, getStoredSourceAssetFile } from '@/lib/source-asset-store'
import { buildCinematicAnimationPlan } from '@/lib/cinematic/animation-planner'
import { setJobAnimationPlan } from '@/lib/mock'

export interface SplitPreviewAssetState {
  sourceAssetId: string | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  leftUrl: string | null
  rightUrl: string | null
  errorMessage: string | null
}

export const EMPTY_SPLIT_PREVIEW_ASSETS: SplitPreviewAssetState = {
  sourceAssetId: null,
  status: 'idle',
  leftUrl: null,
  rightUrl: null,
  errorMessage: null,
}

export interface VideoEngine {
  previewPlaying: boolean
  setPreviewPlaying: React.Dispatch<React.SetStateAction<boolean>>
  previewDurationSec: number
  setPreviewDurationSec: React.Dispatch<React.SetStateAction<number>>
  previewCurrentTimeSec: number
  setPreviewCurrentTimeSec: React.Dispatch<React.SetStateAction<number>>
  previewIntrinsicAspectRatio: number | null
  setPreviewIntrinsicAspectRatio: React.Dispatch<React.SetStateAction<number | null>>
  persistedPreviewUrl: string | null
  setPersistedPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>
  handoffPreview: SessionPreviewState | null
  setHandoffPreview: React.Dispatch<React.SetStateAction<SessionPreviewState | null>>
  isPreviewMediaReady: boolean
  setIsPreviewMediaReady: React.Dispatch<React.SetStateAction<boolean>>
  isPreviewLoadingVisible: boolean
  setIsPreviewLoadingVisible: React.Dispatch<React.SetStateAction<boolean>>
  isPreviewMuted: boolean
  setIsPreviewMuted: React.Dispatch<React.SetStateAction<boolean>>
  previewFramePreset: PreviewFramePreset
  setPreviewFramePreset: React.Dispatch<React.SetStateAction<PreviewFramePreset>>
  fitMode: PreviewFitMode
  setFitMode: React.Dispatch<React.SetStateAction<PreviewFitMode>>
  scale: number
  setScale: React.Dispatch<React.SetStateAction<number>>
  offsetX: number
  setOffsetX: React.Dispatch<React.SetStateAction<number>>
  offsetY: number
  setOffsetY: React.Dispatch<React.SetStateAction<number>>
  isInlineSourceDragOver: boolean
  setIsInlineSourceDragOver: React.Dispatch<React.SetStateAction<boolean>>
  viralClipSplitPreviewActive: boolean
  setViralClipSplitPreviewActive: React.Dispatch<React.SetStateAction<boolean>>
  previewVideoRef: React.RefObject<HTMLVideoElement | null>
  previewPlaybackIntentRef: React.MutableRefObject<'playing' | 'paused'>
  previewPlaybackCommandRef: React.MutableRefObject<number>
  previewToggleCooldownRef: React.MutableRefObject<number | null>
  clearPreviewToggleCooldown: () => void
  armPreviewToggleCooldown: () => void
  startPreviewPlayback: () => void
  pausePreviewPlayback: () => void
  togglePreviewPlayback: () => void
  handlePreviewMetadataLoaded: () => void
  handlePreviewVideoReady: () => void
  handlePreviewTimeUpdate: () => void
  handlePreviewEnded: () => void
  handlePreviewVideoPlay: () => void
  handlePreviewVideoPause: () => void
  handlePreviewVideoError: () => void
  handlePreviewImageLoaded: (event: React.SyntheticEvent<HTMLImageElement>) => void
  handlePreviewSeek: (nextValue: number) => void
  handleRestoreLandscapePreview: () => void
  resolvedPreviewAspectRatio: number
  previewFrameTransformStyle: React.CSSProperties | undefined
  isPreviewBriefGenerating: boolean
  setIsPreviewBriefGenerating: React.Dispatch<React.SetStateAction<boolean>>
  showPreviewFeedback: boolean
  setShowPreviewFeedback: React.Dispatch<React.SetStateAction<boolean>>
  viralClipClipPresetIndex: number
  setViralClipClipPresetIndex: React.Dispatch<React.SetStateAction<number>>
  viralClipSplitAnimationKey: number
  setViralClipSplitAnimationKey: React.Dispatch<React.SetStateAction<number>>
  viralClipSplitPreviewAssets: SplitPreviewAssetState
  setViralClipSplitPreviewAssets: React.Dispatch<React.SetStateAction<SplitPreviewAssetState>>
  isLockedViralClipTriggerHovered: boolean
  setIsLockedViralClipTriggerHovered: React.Dispatch<React.SetStateAction<boolean>>
  splitPreviewAssetCacheRef: React.MutableRefObject<Map<string, { leftUrl: string; rightUrl: string }>>
  previousPreviewFramePresetRef: React.MutableRefObject<PreviewFramePreset>
  previousFitModeRef: React.MutableRefObject<PreviewFitMode>
  sourceFileInputRef: React.RefObject<HTMLInputElement | null>
  inlinePreviewStatusVariant: 'hidden' | 'expanded' | 'icon'
  setInlinePreviewStatusVariant: React.Dispatch<React.SetStateAction<'hidden' | 'expanded' | 'icon'>>
  inlinePreviewStatusHovered: boolean
  setInlinePreviewStatusHovered: React.Dispatch<React.SetStateAction<boolean>>
  inlinePreviewStatusTimeoutRef: React.MutableRefObject<number | null>
  inlinePreviewStatusHasShownRef: React.MutableRefObject<boolean>
  ensureViralClipSplitPreviewAssets: (sourceAssetId: string, sourceVideoFile: File | null) => Promise<{ leftUrl: string; rightUrl: string }>
}

export function useVideoEngine(
  projectId: string, 
  project: Project | null, 
  job: ProcessingJob | null,
  setProject: React.Dispatch<React.SetStateAction<Project | null>>,
  setJob: React.Dispatch<React.SetStateAction<ProcessingJob | null>>,
  handleAutoSaveAnimationPlan: (plan: AnimationPlan) => Promise<void>,
  cinematicRegistry: CinematicAssetRegistry | null,
  sourceStageError: string | null,
  sourceStagePhase: string | null
): VideoEngine {
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

  // Transitionary stuff
  const [isPreviewBriefGenerating, setIsPreviewBriefGenerating] = React.useState(false)
  const [showPreviewFeedback, setShowPreviewFeedback] = React.useState(false)
  const [viralClipClipPresetIndex, setViralClipClipPresetIndex] = React.useState(1)
  const [viralClipSplitAnimationKey, setViralClipSplitAnimationKey] = React.useState(0)
  const [viralClipSplitPreviewAssets, setViralClipSplitPreviewAssets] =
    React.useState<SplitPreviewAssetState>(EMPTY_SPLIT_PREVIEW_ASSETS)
  const [isLockedViralClipTriggerHovered, setIsLockedViralClipTriggerHovered] = React.useState(false)
  const splitPreviewAssetCacheRef = React.useRef<Map<string, { leftUrl: string; rightUrl: string }>>(new Map())
  const previousPreviewFramePresetRef = React.useRef<PreviewFramePreset>(previewFramePreset)
  const previousFitModeRef = React.useRef<PreviewFitMode>(fitMode)
  const sourceFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [inlinePreviewStatusVariant, setInlinePreviewStatusVariant] = React.useState<'hidden' | 'expanded' | 'icon'>('hidden')
  const [inlinePreviewStatusHovered, setInlinePreviewStatusHovered] = React.useState(false)
  const inlinePreviewStatusTimeoutRef = React.useRef<number | null>(null)
  const inlinePreviewStatusHasShownRef = React.useRef(false)

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

  const handlePreviewVideoError = React.useCallback(() => {
    // Basic error handling placeholder
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

  const handlePreviewSeek = React.useCallback((nextValue: number) => {
    const video = previewVideoRef.current
    if (!video || !previewDurationSec) return
    const nextTime = (nextValue / 100) * previewDurationSec
    video.currentTime = nextTime
    setPreviewCurrentTimeSec(nextTime)
  }, [previewDurationSec])

  const handleRestoreLandscapePreview = React.useCallback(() => {
    setIsLockedViralClipTriggerHovered(false)
    setViralClipSplitPreviewActive(false)
    setPreviewFramePreset(previousPreviewFramePresetRef.current)
    setFitMode(previousFitModeRef.current)
  }, [])

  // Effects
  React.useEffect(() => {
    if (isPreviewMediaReady && !showPreviewFeedback && !isPreviewBriefGenerating) {
      setShowPreviewFeedback(true)
    }
  }, [isPreviewMediaReady, showPreviewFeedback, isPreviewBriefGenerating])

  React.useEffect(() => {
    let active = true
    let nextObjectUrl: string | null = null

    setPersistedPreviewUrl(null)

    const recoverPersistedSource = async () => {
      if (!project?.sourceAssetId) return

      try {
        const localUrl = await createSourceAssetObjectUrl(project.sourceAssetId)
        
        if (!active) {
          if (localUrl) URL.revokeObjectURL(localUrl)
          return
        }

        if (localUrl) {
          nextObjectUrl = localUrl
          setPersistedPreviewUrl(localUrl)
          return
        }

        const res = await fetch(`/api/projects/${projectId}/assets`)
        if (!res.ok) throw new Error('Cloud recovery failed')

        const data = await res.json()
        const cloudUrl = data.source?.url

        if (!active) return

        if (cloudUrl) {
          setPersistedPreviewUrl(cloudUrl)
        } else {
          throw new Error('No cloud URL returned')
        }
      } catch (err) {
        if (!active) return
        console.error('Source recovery failed:', err)
        setPersistedPreviewUrl(null)
        if (project?.sourceAssetId) {
          setIsPreviewMediaReady(false)
        }
      }
    }

    void recoverPersistedSource()

    return () => {
      active = false
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl)
      }
    }
  }, [project?.sourceAssetId, projectId])

  React.useEffect(() => {
    if (!project?.sourceAssetId || !persistedPreviewUrl) return
    if (!project.thumbnailUrl || !project.thumbnailUrl.startsWith('blob:')) return

    const nextProject: Project = {
      ...project,
      thumbnailUrl: '',
      updatedAt: new Date().toISOString(),
    }

    setProject(nextProject)
  }, [persistedPreviewUrl, project, setProject])

  React.useEffect(() => {
    const hasPreviewMedia = Boolean(persistedPreviewUrl || handoffPreview?.url)
    if (!viralClipSplitPreviewActive || !hasPreviewMedia) {
      setIsLockedViralClipTriggerHovered(false)
    }
  }, [viralClipSplitPreviewActive, persistedPreviewUrl, handoffPreview])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore spacebar if we're inside an input or textarea
      if (
        e.code === 'Space' && 
        e.target instanceof HTMLElement && 
        e.target.tagName !== 'INPUT' && 
        e.target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        togglePreviewPlayback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePreviewPlayback])

  React.useEffect(() => {
    return () => {
      if (inlinePreviewStatusTimeoutRef.current !== null) {
        window.clearTimeout(inlinePreviewStatusTimeoutRef.current)
        inlinePreviewStatusTimeoutRef.current = null
      }
    }
  }, [])

  React.useEffect(() => {
    const hasPreviewMedia = Boolean(persistedPreviewUrl || handoffPreview?.url)
    const isInlinePreviewStatusActive =
      Boolean(hasPreviewMedia) &&
      (sourceStageError || sourceStagePhase === 'staging_local_preview' || sourceStagePhase === 'persisting')

    if (!isInlinePreviewStatusActive) {
      inlinePreviewStatusHasShownRef.current = false
      setInlinePreviewStatusHovered(false)
      if (inlinePreviewStatusTimeoutRef.current !== null) {
        window.clearTimeout(inlinePreviewStatusTimeoutRef.current)
        inlinePreviewStatusTimeoutRef.current = null
      }
      setInlinePreviewStatusVariant('hidden')
      return
    }

    if (inlinePreviewStatusHasShownRef.current) {
      return
    }

    inlinePreviewStatusHasShownRef.current = true
    setInlinePreviewStatusVariant('expanded')
    if (inlinePreviewStatusTimeoutRef.current !== null) {
      window.clearTimeout(inlinePreviewStatusTimeoutRef.current)
    }
    inlinePreviewStatusTimeoutRef.current = window.setTimeout(() => {
      setInlinePreviewStatusVariant('icon')
      inlinePreviewStatusTimeoutRef.current = null
    }, 2200)
  }, [persistedPreviewUrl, handoffPreview, sourceStageError, sourceStagePhase])

  React.useEffect(() => {
    if (!cinematicRegistry || !job?.artifacts.animationPlan || !job?.input.prompt) return
    if (job.artifacts.animationPlan.registrySignature === cinematicRegistry.signature) return

    const nextPlan = buildCinematicAnimationPlan({
      projectId,
      input: job.input,
      transcript: job.artifacts.transcript,
      scenes: job.artifacts.scenes,
      highlights: job.artifacts.highlights,
      brollSuggestions: job.artifacts.brollSuggestions,
      registry: cinematicRegistry,
    })

    const updatedJob = setJobAnimationPlan(projectId, nextPlan)
    if (updatedJob) {
      setJob(updatedJob)
    }
    void handleAutoSaveAnimationPlan(nextPlan)
  }, [cinematicRegistry, job, projectId, handleAutoSaveAnimationPlan, setJob])

  const ensureViralClipSplitPreviewAssets = React.useCallback(
    async (sourceAssetId: string, sourceVideoFile: File | null) => {
      const cached = splitPreviewAssetCacheRef.current.get(sourceAssetId)
      if (cached) {
        setViralClipSplitPreviewAssets({
          sourceAssetId,
          status: 'ready',
          leftUrl: cached.leftUrl,
          rightUrl: cached.rightUrl,
          errorMessage: null,
        })
        return cached
      }

      const previewUrl = handoffPreview?.url ?? persistedPreviewUrl ?? project?.thumbnailUrl ?? ''
      const previewKind = (handoffPreview?.kind ?? project?.previewKind ?? 'video') as PreviewMediaKind
      
      let splitSourceFile = sourceVideoFile
      if (!splitSourceFile && previewKind === 'video' && previewUrl) {
        const previewResponse = await fetch(previewUrl)
        if (!previewResponse.ok) {
          throw new Error('Unable to restore the visible preview for split reel generation.')
        }

        const previewBlob = await previewResponse.blob()
        splitSourceFile = new File([previewBlob], 'split-preview-source.mp4', {
          type: previewBlob.type || 'video/mp4',
        })
      }

      if (!splitSourceFile) {
        throw new Error('Unable to access the source video file for split reel generation.')
      }

      setViralClipSplitPreviewAssets({
        sourceAssetId,
        status: 'loading',
        leftUrl: null,
        rightUrl: null,
        errorMessage: null,
      })

      const formData = new FormData()
      formData.append('source_video', splitSourceFile, splitSourceFile.name || 'source.mp4')

      const response = await fetch('/api/cinematic/split-preview', {
        method: 'POST',
        body: formData,
      })
      const payload = (await response.json().catch(() => null)) as
        | { leftUrl?: string; rightUrl?: string; error?: string }
        | null

      if (!response.ok || !payload?.leftUrl || !payload?.rightUrl) {
        throw new Error(payload?.error || 'Failed to build split reel previews.')
      }

      const nextAssets = {
        leftUrl: payload.leftUrl,
        rightUrl: payload.rightUrl,
      }
      splitPreviewAssetCacheRef.current.set(sourceAssetId, nextAssets)
      setViralClipSplitPreviewAssets({
        sourceAssetId,
        status: 'ready',
        leftUrl: nextAssets.leftUrl,
        rightUrl: nextAssets.rightUrl,
        errorMessage: null,
      })

      return nextAssets
    },
    [handoffPreview, persistedPreviewUrl, project?.thumbnailUrl, project?.previewKind],
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
    handlePreviewVideoError,
    handlePreviewImageLoaded,
    handlePreviewSeek,
    handleRestoreLandscapePreview,
    resolvedPreviewAspectRatio,
    previewFrameTransformStyle,
    isPreviewBriefGenerating,
    setIsPreviewBriefGenerating,
    showPreviewFeedback,
    setShowPreviewFeedback,
    viralClipClipPresetIndex,
    setViralClipClipPresetIndex,
    viralClipSplitAnimationKey,
    setViralClipSplitAnimationKey,
    viralClipSplitPreviewAssets,
    setViralClipSplitPreviewAssets,
    isLockedViralClipTriggerHovered,
    setIsLockedViralClipTriggerHovered,
    splitPreviewAssetCacheRef,
    previousPreviewFramePresetRef,
    previousFitModeRef,
    sourceFileInputRef,
    inlinePreviewStatusVariant,
    setInlinePreviewStatusVariant,
    inlinePreviewStatusHovered,
    setInlinePreviewStatusHovered,
    inlinePreviewStatusTimeoutRef,
    inlinePreviewStatusHasShownRef,
    ensureViralClipSplitPreviewAssets
  }
}
