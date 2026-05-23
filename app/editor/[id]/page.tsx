'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  CopyPlus,
  ChevronLeft,
  ChevronRight,
  Film,
  FolderOpen,
  Download,
  ImageIcon,
  Layers3,
  MessageSquare,
  Music4,
  Palette,
  Pause,
  PenSquare,
  Play,
  Loader2,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'

import { MusicPlayNotification } from '@/components/editor/music-play-notification'
import { MusicSpotlightOrb } from '@/components/editor/music-spotlight-orb'
import { MusicRecommendationShowcase } from '@/components/editor/music-recommendation-showcase'
import { AiLampDialog } from '@/components/editor/ai-lamp-dialog'
import { MusicTabPanel } from '@/components/editor/music-tab-panel'
import { LuxuryVignette } from '@/components/editor/luxury-vignette'
import { TextReveal } from '@/components/editor/text-reveal'
import { CinematicPreviewRuntime } from '@/components/editor/cinematic-preview-runtime'
import { EditWorkflowPanel } from '@/components/editor/edit-workflow-panel'
import { EditorialComposerFrameAssist } from '@/components/editor/editorial-composer-frame-assist'
import { FrameComposerDraftMirror } from '@/components/editor/frame-composer-draft-mirror'
import { StagedMusicRail } from '@/components/editor/staged-music-rail'
import { CinematicExportCluster } from '@/components/editor/cinematic-export-cluster'
import { PreviewFeedbackShell } from '@/components/editor/preview-feedback-shell'
import { PreviewGenerationState } from '@/components/editor/preview-generation-state'
import { EditorLoadingScreen } from '@/components/editor/editor-loading-screen'
import { InfinityTrailLoader } from '@/components/editor/infinity-trail-loader'
import { ViralClipSplitPreview } from '@/components/editor/viral-clip-split-preview'
import { ViralClipTrigger } from '@/components/editor/viral-clip-trigger'
import { CommandOverlayShell } from '@/components/editor/command-overlay-shell'
import { useSourceStage } from '@/hooks/use-source-stage'
import { useViralClipJob } from '@/hooks/use-viral-clip-job'
import { useDurableJob } from '@/hooks/use-durable-job'
import { useEditorState } from '@/hooks/use-editor-state'
import { useVideoEngine } from '@/hooks/use-video-engine'
import { useMusicWorkspace } from '@/hooks/use-music-workspace'
import { DurableJobProgress } from '@/components/editor/durable-job-progress'
import { WorkspaceNavBar, type WorkspaceNavItem } from '@/components/ui/anime-navbar'
import { clearPendingEditorNavigation, getRememberedEditorReturnPath } from '@/lib/editor-navigation'
import { useFrameTargeting } from '@/hooks/use-frame-targeting'
import { parseFrameReference } from '@/lib/editorial-frame/parse-frame-reference'
import {
  formatAspectFamily,
  formatDurationBucket,
  formatProcessingClass,
  formatSourceProfileMetric,
  formatTimeProfile,
  formatWeightBucket,
  getSourcePreviewAspectRatio,
  getOutputProfileAspectRatio,
} from '@/lib/media/source-profile'
import {
  MUSIC_CATALOG,
  createDefaultMusicPreference,
  normalizeMusicPreference,
} from '@/lib/music-catalog'
import {
  buildHeuristicSoundtrackProfile,
  buildMusicAnalysisStages,
  buildMusicRecommendationSet,
} from '@/lib/music-recommendation-core'
import { readLocalStorageJSON, writeLocalStorageJSON } from '@/lib/storage'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { buildRevealVariants } from '@/lib/motion'
import { buildEditDNAProfile } from '@/lib/editorial-frame/edit-dna-router'
import { compileEditBrief } from '@/lib/editorial-frame/edit-brief-compiler'
import { buildCinematicAnimationPlan, buildFallbackEditAnimationPlan } from '@/lib/cinematic/animation-planner'
import { cn } from '@/lib/utils'
import { createProcessingJob, getJobStatus, getProject, setJobAnimationPlan, startProcessing, upsertProject } from '@/lib/mock'
import { analyzeMusicIntent } from '@/lib/music-intent'
import { queuePreviewRevisionRequest } from '@/lib/editorial-frame/mock-preview-api'
import { getSessionSourcePreview, setSessionSourcePreview } from '@/lib/source-preview-session'
import { createSourceAssetObjectUrl, getStoredSourceAssetFile } from '@/lib/source-asset-store'
import { STYLE_TEMPLATES, type StyleTemplate } from '@/lib/styles/style-templates'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { CreativeMetadata, FrameAssistSubmission, FrameSuggestion, QueuedPreviewRevisionState } from '@/lib/editorial-frame/types'
import type {
  AnimationPlan,
  MusicPreference,
  MusicRecommendation,
  MusicRecommendationGroup,
  MusicRecommendationPhase,
  MusicRecommendationPipelineResult,
  MusicSoundtrackProfile,
  MusicVideoContext,
  ProcessingJob,
  Project,
  OutputProfile,
  StagedMusicTrack,
  ViralClipTargetPlatform,
  CinematicAssetRegistry,
  ProjectExport,
  TranscriptStatus,
  LeftTabKey,
  HeaderNavMode,
  PreviewFitMode,
  BottomMode,
  PreviewFramePreset,
  SessionPreviewState,
  PreviewMediaKind
} from '@/lib/types'
import {
  BOTTOM_MODES,
  HEADER_NAV_ITEMS,
  LEFT_TABS,
  MS_PER_DAY,
  PREVIEW_FRAME_PRESETS,
  SHOULD_PREFETCH_EDITOR_SUPPORT_ROUTES,
  VIRAL_CLIP_COUNT_PRESETS,
  VIRAL_CLIP_PLATFORM_DEFAULT,
} from '@/lib/constants'
import { SourceStagePlaceholder } from '@/components/editor/source-stage-placeholder'
import { InteractiveOrb } from '@/components/ui/interactive-orb'

type SplitPreviewAssetState = {
  sourceAssetId: string | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  leftUrl: string | null
  rightUrl: string | null
  errorMessage: string | null
}

const EMPTY_SPLIT_PREVIEW_ASSETS: SplitPreviewAssetState = {
  sourceAssetId: null,
  status: 'idle',
  leftUrl: null,
  rightUrl: null,
  errorMessage: null,
}

type ChatEntry = {
  id: string
  role: 'assistant' | 'user'
  text: string
  status?: 'loading' | 'ready'
  music?: ChatMusicBlock
}

type ChatMusicBlock = MusicRecommendationPipelineResult & {
  status: 'loading' | 'ready'
  query: string
  preference: MusicPreference
  contextSummary?: string
  profileModel?: string
}

type ChatApiResponse = {
  reply?: string
  error?: string
}

type ComposerAutomationRequest = {
  id: number
  prompt: string
}

type MusicApiResponse = MusicRecommendationPipelineResult & {
  error?: string
  contextSummary?: string
  profileModel?: string
}

function BriefPipelineProgress({ steps, status }: { steps?: string[]; status?: TranscriptStatus }) {
  if (status === 'completed' || status === 'failed' || !status) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-8 text-center"
    >
      <div className="mb-8 relative">
        <InteractiveOrb size={120} intensity="vivid" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="size-8 text-[#7ff2d4] animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-6 max-w-sm w-full">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">Sharpening your Edit DNA</h3>
          <p className="text-white/40 text-sm font-medium">Prometheus is building a high-resolution preview brief.</p>
        </div>

        <div className="space-y-3 pt-4">
          {(steps || ['Initializing', 'Analyzing source', 'Preparing brief', 'Readying preview']).map((step, i) => (
            <div key={i} className="flex items-center gap-3">
               <div className={cn(
                 "size-1.5 rounded-full",
                 i === 0 ? "bg-[#7ff2d4] shadow-[0_0_10px_#7ff2d4]" : "bg-white/10"
               )} />
               <span className={cn(
                 "text-xs font-bold uppercase tracking-widest",
                 i === 0 ? "text-white" : "text-white/20"
               )}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function SecondaryPanel({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: string[]
}) {
  const reduceMotion = useStableReducedMotion()
  const panelViewportRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-4">
      <motion.div
        variants={buildRevealVariants({ delay: 0.04, distance: 14, blur: 8, duration: 0.28 })}
        initial={reduceMotion ? false : 'hidden'}
        whileInView={reduceMotion ? undefined : 'visible'}
        viewport={reduceMotion ? undefined : { once: false, amount: 0.45 }}
        className="rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
      >
        <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">{title}</div>
        <p className="mt-3 text-sm leading-6 text-white/66">{description}</p>
      </motion.div>
      <div ref={panelViewportRef} className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
        {items.map((item) => (
          <motion.div
            key={item}
            variants={buildRevealVariants({ delay: 0.06, distance: 10, blur: 6, duration: 0.24 })}
            initial={reduceMotion ? false : 'hidden'}
            whileInView={reduceMotion ? undefined : 'visible'}
            viewport={reduceMotion ? undefined : { root: panelViewportRef, once: false, amount: 0.45 }}
            className="rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/68"
          >
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function EditorPage() {
  const {
    projectId,
    project,
    setProject,
    job,
    setJob,
    currentJobId,
    setCurrentJobId,
    jobProgress,
    jobStatus,
    dbJob,
    jobError,
    saveStatus,
    setSaveStatus,
    isEditorBootReady,
    setIsEditorBootReady,
    leftTab,
    setLeftTab,
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    bottomMode,
    setBottomMode,
    isEditingTitle,
    setIsEditingTitle,
    tempTitle,
    setTempTitle,
    latestExport,
    setLatestExport,
    isLeftPanelCollapsed,
    setIsLeftPanelCollapsed,
    isDeferredChromeReady,
    setIsDeferredChromeReady,
    isAiLampOpen,
    setIsAiLampOpen,
    isExporting,
    setIsExporting,
    isDownloading,
    setIsDownloading,
    isDownloadDialogOpen,
    setIsDownloadDialogOpen,
    sourceAssetLabel,
    setSourceAssetLabel,
    cinematicRegistry,
    setCinematicRegistry,
    viralClipTargetPlatform,
    setViralClipTargetPlatform,
    handleWorkspaceTabChange,
    handleTitleStartEdit,
    handleTitleSave,
    handleTitleKeyDown,
    handleBackNavigation,
    handleAiChatOpen,
    handleAiMusicOpen,
    handleAutoSave,
    handleAutoSaveAnimationPlan,
    handlePrepareExport,
    lastTranscriptSyncTimeRef,
    progressPercent
  } = useEditorState()

  const {
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
  } = useVideoEngine(projectId, project, job)

  const {
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
  } = useMusicWorkspace(projectId)

  // -- TRANSITIONARY REFS & STATE (To be extracted in Phase 2) --
  const titleInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isPreviewBriefGenerating, setIsPreviewBriefGenerating] = React.useState(false)
  const [showPreviewFeedback, setShowPreviewFeedback] = React.useState(false)

  // React to preview readiness
  React.useEffect(() => {
    if (isPreviewMediaReady && !showPreviewFeedback && !isPreviewBriefGenerating) {
      setShowPreviewFeedback(true)
    }
  }, [isPreviewMediaReady, showPreviewFeedback, isPreviewBriefGenerating])

  const [viralClipClipPresetIndex, setViralClipClipPresetIndex] = React.useState(1)
  const [viralClipSplitAnimationKey, setViralClipSplitAnimationKey] = React.useState(0)
  const [viralClipSplitPreviewAssets, setViralClipSplitPreviewAssets] =
    React.useState<SplitPreviewAssetState>(EMPTY_SPLIT_PREVIEW_ASSETS)
  const [isLockedViralClipTriggerHovered, setIsLockedViralClipTriggerHovered] = React.useState(false)
  const splitPreviewAssetCacheRef = React.useRef<Map<string, { leftUrl: string; rightUrl: string }>>(new Map())
  const previousPreviewFramePresetRef = React.useRef<PreviewFramePreset>(previewFramePreset)
  const previousFitModeRef = React.useRef<PreviewFitMode>(fitMode)
  const sourceFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [chatComposerPortal, setChatComposerPortal] = React.useState<HTMLDivElement | null>(null)
  const [musicSpotlightPortalTarget, setMusicSpotlightPortalTarget] = React.useState<HTMLDivElement | null>(null)
  const inspectorViewportRef = React.useRef<HTMLDivElement | null>(null)
  const [inlinePreviewStatusVariant, setInlinePreviewStatusVariant] = React.useState<'hidden' | 'expanded' | 'icon'>('hidden')
  const [inlinePreviewStatusHovered, setInlinePreviewStatusHovered] = React.useState(false)
  const inlinePreviewStatusTimeoutRef = React.useRef<number | null>(null)
  const inlinePreviewStatusHasShownRef = React.useRef(false)
  
  const projectPreviewSourceKey = project?.sourceAssetId ?? projectId
  const handoffPreviewForCurrentSource =
    handoffPreview?.sourceKey === projectPreviewSourceKey ? handoffPreview : null
  const stableProjectPreviewUrl =
    handoffPreviewForCurrentSource?.url
    ?? (project?.sourceAssetId ? persistedPreviewUrl ?? project?.thumbnailUrl ?? null : project?.thumbnailUrl ?? null)
  
  const {
    previewKind: stagedPreviewKind,
    phase: sourceStagePhase,
    error: sourceStageError,
    stageSource: stageSourceFile,
  } = useSourceStage({
    currentPreviewUrl: null,
    currentPreviewKind: null,
  })
  
  const viralClipJob = useViralClipJob({
    projectId,
    videoId: project?.sourceAssetId ?? null,
  })
  
  const {
    health: viralClipBackendHealth,
    lifecycle: viralClipLifecycle,
    jobId: viralClipJobId,
    backendStage: viralClipBackendStage,
    stageLabel: viralClipStageLabel,
    stageDetail: viralClipStageDetail,
    progressPercent: viralClipProgressPercent,
    warnings: viralClipWarnings,
    statusMessage: viralClipStatusMessage,
    errorMessage: viralClipErrorMessage,
    resultError: viralClipResultError,
    selectedClips: viralClipSelectedClips,
    startJob: startViralClipJob,
    refreshBackendHealth: refreshViralClipBackendHealth,
    refreshResult: refreshViralClipResult,
  } = viralClipJob

  React.useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [isEditingTitle])

  React.useEffect(() => {
    clearPendingEditorNavigation(`/editor/${projectId}`)
  }, [projectId])

  React.useEffect(() => {
    let active = true
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (res.ok) {
          const { project: apiProject } = await res.json()
          if (active && apiProject) {
            setProject(apiProject)
            upsertProject(apiProject)
          }
        }
      } catch (err) {
        console.error('Failed to fetch project from API:', err)
      }
    }
    fetchProject()
    return () => { active = false }
  }, [projectId, setProject])

  React.useEffect(() => {
    const loadLatestExport = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/exports/latest`)
        const data = await res.json()
        if (res.ok && data.export) {
          setLatestExport(data.export)
        }
      } catch (err) {
        console.warn('Failed to load latest export:', err)
      }
    }
    void loadLatestExport()
  }, [projectId, setLatestExport])

  React.useLayoutEffect(() => {
    let active = true
    let intervalId: number | null = null

    const syncState = () => {
      if (!active) return

      const nextProject = getProject(projectId)
      const nextJob = getJobStatus(projectId)

      setProject(nextProject)
      
      // Only use mock job if a real durable job isn't currently driving the UI
      if (!currentJobId) {
        setJob(nextJob)
      }

      setIsEditorBootReady(true)

      // Conservative transcript sync polling
      const now = Date.now()
      if (
        nextProject?.sourceAssetId && 
        nextJob?.transcriptStatus && 
        (nextJob.transcriptStatus === 'queued' || nextJob.transcriptStatus === 'transcribing') &&
        now - lastTranscriptSyncTimeRef.current > 6000
      ) {
        lastTranscriptSyncTimeRef.current = now
        void fetch(`/api/assets/${nextProject.sourceAssetId}/transcript/sync`, { method: 'POST' })
          .then(res => res.json())
          .then(data => {
             console.debug('[Editor] Transcript sync result:', data.status)
          })
          .catch(err => console.warn('[Editor] Transcript sync failed:', err))
      }

      if (nextJob?.status === 'completed' && intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }
    }

    syncState()
    intervalId = window.setInterval(syncState, 900)

    return () => {
      active = false
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
    }
  }, [projectId, currentJobId, setProject, setJob, setIsEditorBootReady, lastTranscriptSyncTimeRef])

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
  }, [project?.sourceAssetId, projectId, setPersistedPreviewUrl, setIsPreviewMediaReady])

  React.useEffect(() => {
    let active = true

    setSourceAssetLabel(null)

    if (!project?.sourceAssetId) return

    void getStoredSourceAssetFile(project.sourceAssetId)
      .then((file) => {
        if (!active) return
        if (!file) {
          setSourceAssetLabel(null)
          return
        }
        const nextLabel = file.name?.trim().replace(/\.[^/.]+$/, '') || file.name?.trim() || 'Source video'
        setSourceAssetLabel(nextLabel)
      })
      .catch(() => {
        if (!active) return
        setSourceAssetLabel(null)
      })

    return () => {
      active = false
    }
  }, [project?.sourceAssetId, setSourceAssetLabel])

  React.useEffect(() => {
    if (!project?.sourceAssetId || !persistedPreviewUrl) return
    if (!project.thumbnailUrl || !project.thumbnailUrl.startsWith('blob:')) return

    const nextProject: Project = {
      ...project,
      thumbnailUrl: '',
      updatedAt: new Date().toISOString(),
    }

    upsertProject(nextProject)
    setProject(nextProject)
  }, [persistedPreviewUrl, project, setProject])

  React.useEffect(() => {
    let rafId = 0
    let timeoutId = 0

    rafId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setIsDeferredChromeReady(true)
      }, 140)
    })

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
    }
  }, [setIsDeferredChromeReady])

  React.useEffect(() => {
    let active = true

    void fetch('/api/cinematic/assets', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load cinematic assets (${response.status}).`)
        }
        return (await response.json()) as CinematicAssetRegistry
      })
      .then((registry) => {
        if (!active) return
        setCinematicRegistry(registry)
      })
      .catch(() => {
        if (!active) return
        setCinematicRegistry(null)
      })

    return () => {
      active = false
    }
  }, [setCinematicRegistry])

  React.useEffect(() => {
    if (!SHOULD_PREFETCH_EDITOR_SUPPORT_ROUTES) return

    void router.prefetch('/projects')
  }, [projectId, router])

  const totalDurationMs = React.useMemo(() => {
    const scenes = job?.artifacts.scenes ?? []
    return scenes.length > 0 ? scenes[scenes.length - 1]!.endMs : 48_000
  }, [job])

  const transportDurationSec = previewDurationSec > 0 ? previewDurationSec : totalDurationMs / 1000
  const transportProgress = transportDurationSec > 0 ? (previewCurrentTimeSec / transportDurationSec) * 100 : 0
  const transportCurrentTime = msToTime(previewCurrentTimeSec * 1000)
  const transportTime = msToTime(transportDurationSec * 1000)
  const previewUrl = stableProjectPreviewUrl ?? ''
  const previewKind = (handoffPreviewForCurrentSource?.kind ?? stagedPreviewKind ?? project?.previewKind ?? 'video') as PreviewMediaKind
  const shouldUseLegacySessionPreviewSurface = Boolean(handoffPreviewForCurrentSource?.url) && previewKind === 'video'
  const hasPreviewMedia = Boolean(previewUrl)
  const clipModeActive = previewFramePreset === '9:16'
  const viralClipTriggerBusy =
    viralClipLifecycle === 'submitting' || viralClipLifecycle === 'submitted' || viralClipLifecycle === 'polling'
  const showViralClipSplitPreview = viralClipSplitPreviewActive && clipModeActive && hasPreviewMedia
  
  React.useEffect(() => {
    if (!showViralClipSplitPreview) {
      setIsLockedViralClipTriggerHovered(false)
    }
  }, [showViralClipSplitPreview])

  React.useEffect(() => {
    return () => {
      if (inlinePreviewStatusTimeoutRef.current !== null) {
        window.clearTimeout(inlinePreviewStatusTimeoutRef.current)
        inlinePreviewStatusTimeoutRef.current = null
      }
    }
  }, [])

  React.useEffect(() => {
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
  }, [hasPreviewMedia, sourceStageError, sourceStagePhase])

  const showInlinePreviewStatus = Boolean(hasPreviewMedia) && inlinePreviewStatusVariant !== 'hidden'
  const isInlinePreviewStatusExpanded =
    inlinePreviewStatusVariant === 'expanded' || inlinePreviewStatusHovered
  const inlinePreviewStatusLabel = sourceStageError
    ? sourceStageError
    : sourceStagePhase === 'staging_local_preview'
      ? 'Preparing the new source preview'
      : sourceStagePhase === 'persisting'
        ? 'Saving the source in the background'
        : null
  const sourceMetrics = project?.sourceProfile ? formatSourceProfileMetric(project.sourceProfile) : null
  
  const previewFrameWidth = `min(100%, calc((clamp(250px, 40vh, 460px) - 2rem) * ${resolvedPreviewAspectRatio.toFixed(4)}))`

  const promptText = job?.input.prompt?.trim() || 'Your clip is staged and ready for refinement.'
  const sourceList = React.useMemo(() => job?.input.sources ?? [], [job?.input.sources])
  const videoContext = React.useMemo(
    () =>
      buildVideoMusicContext({
        projectTitle: project?.title ?? 'Untitled Project',
        promptText,
        sourceProfile: project?.sourceProfile ?? null,
        job,
        sourceList,
      }),
    [job, project?.sourceProfile, project?.title, promptText, sourceList],
  )
  const editorMusicShelf = React.useMemo(
    () =>
      buildMusicRecommendationSet({
        query: promptText,
        projectTitle: project?.title ?? 'Untitled Project',
        initialPrompt: promptText,
        videoContext,
        limit: 5,
        catalog: MUSIC_CATALOG,
      }),
    [project?.title, promptText, videoContext],
  )
  const editorMusicRecommendations = React.useMemo(
    () => editorMusicShelf.recommendations.slice(0, 5),
    [editorMusicShelf],
  )
  const selectedEditorMusicTrack = React.useMemo(
    () => editorMusicRecommendations.find((track) => track.id === selectedEditorMusicTrackId) ?? null,
    [editorMusicRecommendations, selectedEditorMusicTrackId],
  )
  const viralClipClipPreset = VIRAL_CLIP_COUNT_PRESETS[viralClipClipPresetIndex] ?? VIRAL_CLIP_COUNT_PRESETS[1]!
  const viralClipProvidedTranscript = buildProvidedTranscript(job)
  const viralClipPrompt = React.useMemo(
    () =>
      buildViralClipQuickActionPrompt({
        projectTitle: project?.title ?? 'Untitled Project',
        originalPrompt: promptText,
        sourceCount: sourceList.length,
        transportTime,
        videoContext,
      }),
    [project?.title, promptText, sourceList.length, transportTime, videoContext],
  )

  const previewOverlayPlan = job?.artifacts.animationPlan ?? null

  React.useEffect(() => {
    if (!cinematicRegistry || !previewOverlayPlan || !job?.input.prompt) return
    if (previewOverlayPlan.registrySignature === cinematicRegistry.signature) return

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
  }, [cinematicRegistry, job, previewOverlayPlan, projectId, handleAutoSaveAnimationPlan, setJob])

  const currentSplitPreviewAssets =
    viralClipSplitPreviewAssets.sourceAssetId === (project?.sourceAssetId ?? null)
      ? viralClipSplitPreviewAssets
      : EMPTY_SPLIT_PREVIEW_ASSETS

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
    [previewKind, previewUrl],
  )

  const handleGenerateViralClips = React.useCallback(async () => {
    if (!project?.sourceAssetId) {
      setViralClipSplitPreviewActive(false)
      setPreviewFramePreset('source')
      toast.error('Add a source video first so the clip workflow has something to analyze.')
      return
    }

    try {
      if (!viralClipSplitPreviewActive) {
        previousFitModeRef.current = fitMode
        previousPreviewFramePresetRef.current = previewFramePreset
      }
      setFitMode('fill')
      setPreviewFramePreset('9:16')
      setViralClipSplitPreviewActive(true)
      setViralClipSplitAnimationKey((current) => current + 1)

      const sourceVideoFile = await getStoredSourceAssetFile(project.sourceAssetId).catch(() => null)
      const splitPreviewPromise = ensureViralClipSplitPreviewAssets(project.sourceAssetId, sourceVideoFile)

      const [viralClipJobResult, splitPreviewResult] = await Promise.allSettled([
        startViralClipJob(
          {
            projectId,
            videoId: project.sourceAssetId,
            targetPlatform: viralClipTargetPlatform,
            clipCountMin: viralClipClipPreset.min,
            clipCountMax: viralClipClipPreset.max,
            prompt: viralClipPrompt,
            sourceMediaRef: project.sourceAssetId,
            creatorNiche: videoContext.summary || undefined,
            metadataOverrides: {
              projectTitle: project?.title ?? 'Untitled Project',
              sourceAssetId: project.sourceAssetId,
              previewKind: project?.previewKind ?? null,
              sourceProfileMetric: sourceMetrics,
              sourceProfile: project?.sourceProfile ?? null,
              clipMode: 'viral',
              targetPlatform: viralClipTargetPlatform,
              clipCountMin: viralClipClipPreset.min,
              clipCountMax: viralClipClipPreset.max,
            },
            providedTranscript: viralClipProvidedTranscript ?? undefined,
          },
          {
            sourceVideoFile,
          },
        ),
        splitPreviewPromise,
      ])

      if (viralClipJobResult.status === 'rejected') {
        throw viralClipJobResult.reason
      }

      if (splitPreviewResult.status === 'rejected') {
        const splitPreviewError =
          splitPreviewResult.reason instanceof Error
            ? splitPreviewResult.reason.message
            : 'Split reel generation failed.'

        setViralClipSplitPreviewAssets({
          sourceAssetId: project.sourceAssetId,
          status: 'error',
          leftUrl: null,
          rightUrl: null,
          errorMessage: splitPreviewError,
        })
        toast.error(splitPreviewError)
      }

      toast.success('Viral clip job submitted. Watching backend stages now.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to launch the viral clip job.')
    }
  }, [
    fitMode,
    project,
    projectId,
    previewFramePreset,
    sourceMetrics,
    viralClipClipPreset.max,
    viralClipClipPreset.min,
    viralClipPrompt,
    viralClipProvidedTranscript,
    viralClipTargetPlatform,
    viralClipSplitPreviewActive,
    ensureViralClipSplitPreviewAssets,
    startViralClipJob,
    videoContext.summary,
    setFitMode,
    setPreviewFramePreset,
    setViralClipSplitPreviewActive,
  ])

  const handleRestoreLandscapePreview = React.useCallback(() => {
    setIsLockedViralClipTriggerHovered(false)
    setViralClipSplitPreviewActive(false)
    setPreviewFramePreset(previousPreviewFramePresetRef.current)
    setFitMode(previousFitModeRef.current)
  }, [setFitMode, setPreviewFramePreset, setViralClipSplitPreviewActive])

  const handlePreviewSeek = React.useCallback((nextValue: number) => {
    const video = previewVideoRef.current
    if (!video || !transportDurationSec) return
    const nextTime = (nextValue / 100) * transportDurationSec
    video.currentTime = nextTime
    setPreviewCurrentTimeSec(nextTime)
  }, [transportDurationSec, setPreviewCurrentTimeSec, previewVideoRef])

  const handleEditRequest = React.useCallback(
    (request: { prompt: string; styleTemplate: StyleTemplate; metadata?: CreativeMetadata }) => {
      if (!project?.sourceAssetId) {
        toast.error('Add a source video first so the edit pass has something to render.')
        return
      }

      const prompt = request.prompt.trim()
      if (!prompt) return

      const editDNA = buildEditDNAProfile(request.metadata)
      const editBrief = compileEditBrief({
        metadata: request.metadata,
        editDNA,
        transcriptText: job?.transcriptText,
        transcriptStatus: job?.transcriptStatus,
        videoDurationSeconds: project?.sourceProfile?.inspection.durationSec ?? undefined,
        projectTitle: project?.title,
      })

      const nextJob = createProcessingJob({
        projectId,
        input: {
          prompt,
          sources: sourceList,
          styleId: request.styleTemplate.id,
          metadata: request.metadata,
          editDNA,
        },
      })
      
      // Attach the compiled brief to the job
      nextJob.editBrief = editBrief
      nextJob.previewProgressSteps = editBrief.progressSteps

      const startedJob = startProcessing(nextJob)

      // --- NEW: Create Real Durable Job ---
      void fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          type: 'ai_enhancement',
          metadata: {
            input: nextJob.input,
            editBrief: nextJob.editBrief,
            previewProgressSteps: nextJob.previewProgressSteps,
            artifacts: nextJob.artifacts,
            transcriptStatus: nextJob.transcriptStatus,
            transcriptText: nextJob.transcriptText,
          }
        })
      }).then(res => res.json()).then(data => {
        if (data.id) {
          console.log('[Editor] Durable job created:', data.id)
          setCurrentJobId(data.id)
        }
      }).catch(err => console.error('[Editor] Failed to create durable job:', err))
      // -------------------------------------

      const fallbackPlan = buildFallbackEditAnimationPlan({
        projectId,
        projectTitle: project?.title ?? 'Untitled Project',
        prompt,
        jobId: nextJob.id,
        sourceLabel: sourceAssetLabel ?? project?.title ?? null,
        styleTemplate: request.styleTemplate,
      })
      const jobWithFallbackPlan = setJobAnimationPlan(projectId, fallbackPlan) ?? startedJob

      setJob(jobWithFallbackPlan)
      previewPlaybackIntentRef.current = 'paused'
      previewPlaybackCommandRef.current += 1
      clearPreviewToggleCooldown()
      setPreviewPlaying(false)
      if (previewKind === 'video' && previewUrl) {
        void startPreviewPlayback()
      }

      toast.success(`Edit job ${nextJob.id.slice(0, 6)} started.`)

      if (cinematicRegistry) {
        const refinedPlan = buildCinematicAnimationPlan({
          projectId,
          input: nextJob.input,
          transcript: jobWithFallbackPlan.artifacts.transcript,
          scenes: jobWithFallbackPlan.artifacts.scenes,
          highlights: jobWithFallbackPlan.artifacts.highlights,
          brollSuggestions: jobWithFallbackPlan.artifacts.brollSuggestions,
          registry: cinematicRegistry,
        })

        const refinedJob = setJobAnimationPlan(projectId, refinedPlan)
        if (refinedJob) {
          setJob(refinedJob)
        }
      }
    },
    [
      cinematicRegistry,
      clearPreviewToggleCooldown,
      previewKind,
      previewUrl,
      project?.sourceAssetId,
      project?.title,
      projectId,
      sourceAssetLabel,
      sourceList,
      startPreviewPlayback,
      setCurrentJobId,
      setJob,
      setPreviewPlaying,
      job?.transcriptStatus,
      job?.transcriptText,
      project?.sourceProfile?.inspection.durationSec,
      handleAutoSaveAnimationPlan,
      previewPlaybackIntentRef,
      previewPlaybackCommandRef,
    ],
  )

  const handleAiEditLaunch = React.useCallback(
    (label: string) => {
      const styleTemplate = selectEditStyleTemplate(label, videoContext)
      const editPrompt = buildEditQuickActionPrompt(project?.title ?? 'Untitled Project', videoContext, styleTemplate)
      const prompt = label === 'Edit this video' ? editPrompt : `${label}. ${editPrompt}`

      setIsAiLampOpen(false)
      setIsLeftPanelCollapsed(false)
      setLeftTab('chat')
      setActiveWorkspaceTab('Motion')
      setBottomMode('Original')
      handleEditRequest({ prompt, styleTemplate })
    },
    [handleEditRequest, project?.title, videoContext, setIsAiLampOpen, setIsLeftPanelCollapsed, setLeftTab, setActiveWorkspaceTab, setBottomMode],
  )

  const aiLampActions = React.useMemo(
    () => [
      {
        label: 'Open chat lane',
        description: 'Jump into the editorial conversation and steer the next pass directly.',
        icon: MessageSquare,
        onSelect: handleAiChatOpen,
      },
      {
        label: 'Edit this video',
        description: 'Launch a polished first pass tuned to the current project context.',
        icon: PenSquare,
        onSelect: () => handleAiEditLaunch('Edit this video'),
      },
      {
        label: 'Generate rough cuts',
        description: 'Start a faster structure pass focused on trims, hooks, and pacing.',
        icon: Wand2,
        onSelect: () => handleAiEditLaunch('Generate rough cuts'),
      },
      {
        label: 'Add music',
        description: 'Open the soundtrack chamber and shape the emotional lane there.',
        icon: Music4,
        onSelect: handleAiMusicOpen,
      },
    ],
    [handleAiChatOpen, handleAiEditLaunch, handleAiMusicOpen],
  )

  const openInlineSourcePicker = React.useCallback(() => {
    sourceFileInputRef.current?.click()
  }, [])

  const handleInlineSourceSelection = React.useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return

      if (!project) {
        toast.error('The project is still loading. Please try again in a moment.')
        return
      }

      try {
        const stagedSource = await stageSourceFile(file, {
          allowedMediaKinds: ['video'],
        })

        if (!stagedSource) return

        const sessionSourcePreview = setSessionSourcePreview({
          projectId,
          file,
          previewKind: stagedSource.previewKind ?? 'video',
          sourceAssetId: stagedSource.assetId,
        })

        if (sessionSourcePreview) {
          setHandoffPreview({
            sourceKey: stagedSource.assetId,
            url: sessionSourcePreview.url,
            kind: sessionSourcePreview.kind,
          })
        }

        const nextProject: Project = {
          ...project,
          sourceAssetId: stagedSource.assetId,
          previewKind: stagedSource.previewKind ?? 'video',
          thumbnailUrl: '',
          sourceProfile: stagedSource.sourceProfile ?? project.sourceProfile,
          updatedAt: new Date().toISOString(),
        }

        upsertProject(nextProject)
        setProject(nextProject)

        setPreviewPlaying(false)
        previewPlaybackIntentRef.current = 'paused'
        previewPlaybackCommandRef.current += 1
        setPreviewCurrentTimeSec(0)
        setPreviewDurationSec(0)
        setPreviewIntrinsicAspectRatio(null)
        setPreviewFramePreset('source')
        setViralClipSplitPreviewActive(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to stage that source video right now.')
      }
    },
    [project, projectId, stageSourceFile, setHandoffPreview, setProject, setPreviewPlaying, setPreviewCurrentTimeSec, setPreviewDurationSec, setPreviewIntrinsicAspectRatio, setPreviewFramePreset, setViralClipSplitPreviewActive, previewPlaybackIntentRef, previewPlaybackCommandRef],
  )

  const handleInlineSourceFileInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.currentTarget.files ?? [])
      event.currentTarget.value = ''
      void handleInlineSourceSelection(files)
    },
    [handleInlineSourceSelection],
  )

  const handleInlineSourceDrop = React.useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault()
      setIsInlineSourceDragOver(false)
      void handleInlineSourceSelection(Array.from(event.dataTransfer.files ?? []))
    },
    [handleInlineSourceSelection, setIsInlineSourceDragOver],
  )

  const handleInlineSourceDragOver = React.useCallback((event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setIsInlineSourceDragOver(true)
  }, [setIsInlineSourceDragOver])

  const handleInlineSourceDragLeave = React.useCallback(() => {
    setIsInlineSourceDragOver(false)
  }, [setIsInlineSourceDragOver])

  const hasSourceAsset = Boolean(project?.sourceAssetId)

  const renderLeftPanel = () => {
    switch (leftTab) {
      case 'edit':
        return (
          <EditWorkflowPanel
            projectTitle={project?.title ?? 'Untitled Project'}
            sourceLabel={sourceAssetLabel}
            job={job}
          />
        )
      case 'design':
        return (
          <SecondaryPanel
            title="Design"
            description="Shape the motion language, titles, and overlays without clutter."
            items={[
              'Use restrained typography',
              'Keep one dominant visual anchor',
              'Avoid over-animated transitions',
            ]}
          />
        )
      case 'assets':
        return (
          <SecondaryPanel
            title="Assets"
            description="Gather the lightweight elements for the edit without leaving the workspace."
            items={[
              'Reference stills',
              'Music stems',
              'Caption kit',
              'Logo lockup',
            ]}
          />
        )
      case 'chat':
      default:
        return (
          <ChatWorkspacePanel
            key={projectId}
            projectId={projectId}
            projectTitle={project?.title ?? 'Untitled Project'}
            initialPrompt={promptText}
            initialSources={sourceList}
            videoContext={videoContext}
            composerPortalTarget={showViralClipSplitPreview || activeWorkspaceTab === 'Music' ? null : chatComposerPortal}
            musicSpotlightPortalTarget={isDeferredChromeReady ? musicSpotlightPortalTarget : null}
            onEditRequest={handleEditRequest}
            initialEditorState={project?.editorState}
            onSave={handleAutoSave}
          />
        )
    }
  }

  return !isEditorBootReady ? (
    <EditorLoadingScreen caption="Opening editor..." />
  ) : (
    <>
      <div className="relative h-[100dvh] overflow-hidden bg-[#07070a] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(84,69,126,0.24)_0%,rgba(84,69,126,0.08)_24%,rgba(7,7,10,0)_56%),linear-gradient(180deg,rgba(16,14,24,0.72)_0%,rgba(7,7,10,1)_42%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_44px] opacity-[0.06]"
      />

      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <header className="relative z-30 shrink-0 border-b border-white/8">
          <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-4 px-4 py-[clamp(0.875rem,1.8vh,1rem)] lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <motion.button
                type="button"
                onClick={handleBackNavigation}
                variants={buildRevealVariants({ delay: 0.03, distance: 10, blur: 6, duration: 0.24 })}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.55 }}
                className="inline-flex items-center gap-2 text-sm text-white/72 transition-colors hover:text-white"
              >
                <ArrowLeft className="size-4" />
                <span>Back</span>
              </motion.button>

              <motion.div
                variants={buildRevealVariants({ delay: 0.08, distance: 10, blur: 6, duration: 0.24 })}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.55 }}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-400/8 px-3 py-1.5 text-[11px] text-emerald-100"
              >
                <span className="size-2 rounded-full bg-emerald-300" />
                {hasSourceAsset
                  ? job?.status === 'completed'
                    ? 'Ready to refine'
                    : 'Processing in background'
                  : 'Waiting for a source video'}
              </motion.div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <motion.div
                variants={buildRevealVariants({ delay: 0.1, distance: 14, blur: 8, duration: 0.28 })}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.45 }}
                className="min-w-0"
              >
                <div className="group relative">
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={handleTitleKeyDown}
                      className="editor-display w-full bg-transparent text-[1.45rem] leading-tight text-white outline-none"
                    />
                  ) : (
                    <div 
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={handleTitleStartEdit}
                      title="Click to rename project"
                    >
                      <TextReveal
                        as="div"
                        text={project?.title ?? 'Loading project...'}
                        split="words"
                        delay={0.08}
                        className="editor-display truncate text-[1.45rem] leading-tight text-white"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/42">
                  <span className={cn(
                    "inline-flex items-center gap-2 transition-colors",
                    saveStatus === 'saving' ? "text-white/60" : saveStatus === 'error' ? "text-rose-400" : "text-white/42"
                  )}>
                    {saveStatus === 'saving' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    {saveStatus === 'saving' ? 'Saving changes...' : saveStatus === 'error' ? 'Error saving' : 'All changes saved'}
                  </span>
                  <span>{progressPercent}% staged</span>
                </div>
              </motion.div>

              <motion.div
                variants={buildRevealVariants({ delay: 0.16, distance: 14, blur: 8, duration: 0.28 })}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.45 }}
                className="xl:flex-1"
              >
                <WorkspaceNavBar
                  items={HEADER_NAV_ITEMS}
                  defaultActive="Motion"
                  activeItem={activeWorkspaceTab}
                  onChange={handleWorkspaceTabChange}
                  className="xl:flex-1"
                />
              </motion.div>

              <motion.div
                variants={buildRevealVariants({ delay: 0.22, distance: 14, blur: 8, duration: 0.28 })}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.45 }}
              >
                {isDeferredChromeReady ? (
                  <CinematicExportCluster 
                    onExport={handlePrepareExport}
                    isExporting={isExporting}
                    isCompleted={latestExport?.status === 'completed'}
                    onDownload={handleDownload}
                    isDownloading={isDownloading}
                  />
                ) : (
                  <div className="h-[52px] w-[220px] rounded-full border border-white/8 bg-white/[0.03]" />
                )}
              </motion.div>
            </div>
          </div>
        </header>

        <main className="relative z-20 mx-auto flex min-h-0 w-full max-w-[1580px] flex-1 overflow-hidden px-3 py-3 lg:px-5 lg:py-4 xl:px-6">
          <div
            className={cn(
              'grid h-full min-h-0 w-full grid-rows-[minmax(0,1fr)] items-stretch gap-[clamp(0.75rem,1vw,1rem)] overflow-hidden',
              isLeftPanelCollapsed
                ? 'lg:grid-cols-[84px_minmax(0,1fr)] xl:grid-cols-[84px_minmax(0,1fr)_clamp(17rem,20vw,20.5rem)]'
                : 'lg:grid-cols-[clamp(17rem,22vw,19.75rem)_minmax(0,1fr)] xl:grid-cols-[clamp(17rem,22vw,19.75rem)_minmax(0,1fr)_clamp(17rem,20vw,20.5rem)]',
            )}
          >
            <motion.aside
              layout
              className={cn(
                'premium-ambient-panel premium-vignette-surface flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#131317] overscroll-contain transition-[width,transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isLeftPanelCollapsed && 'lg:rounded-[26px]',
              )}
            >
              <LuxuryVignette tone="neutral" />
              <motion.div
                variants={buildRevealVariants({ delay: 0.08, distance: 12, blur: 8, duration: 0.26 })}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.5 }}
                className="border-b border-white/8 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-2">
                  {!isLeftPanelCollapsed ? (
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {LEFT_TABS.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setLeftTab(key)}
                          aria-label={label}
                          className={cn(
                            'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm transition-colors',
                            leftTab === key
                              ? 'border border-white/10 bg-white/[0.08] text-white'
                              : 'border border-transparent text-white/48 hover:bg-white/[0.04] hover:text-white/82',
                          )}
                        >
                          <Icon className="size-4" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-1" aria-hidden />
                  )}

                  <button
                    type="button"
                    onClick={() => setIsLeftPanelCollapsed((current) => !current)}
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-white/8 bg-white/[0.03] text-white/48 transition-colors hover:text-white/80"
                    aria-label={isLeftPanelCollapsed ? 'Expand left panel' : 'Collapse left panel'}
                  >
                    {isLeftPanelCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                  </button>
                </div>
              </motion.div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={leftTab}
                  variants={buildRevealVariants({ delay: 0.12, distance: 16, blur: 10, duration: 0.3 })}
                  initial="hidden"
                  animate={isLeftPanelCollapsed ? 'hidden' : 'visible'}
                  exit="exit"
                  className={cn(
                    'min-h-0 flex-1 overflow-hidden',
                    isLeftPanelCollapsed ? 'pointer-events-none invisible' : 'visible',
                  )}
                  aria-hidden={isLeftPanelCollapsed}
                >
                  {renderLeftPanel()}
                </motion.div>
              </AnimatePresence>
            </motion.aside>

            <section className="premium-ambient-panel premium-vignette-surface relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#111115]">
              <LuxuryVignette tone={activeWorkspaceTab === 'Music' ? 'music' : 'cool'} />
              {activeWorkspaceTab !== 'Music' ? (
                <motion.div
                  variants={buildRevealVariants({ delay: 0.08, distance: 12, blur: 8, duration: 0.26 })}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.45 }}
                  className="shrink-0 border-b border-white/8 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 text-white/48">
                      <ViralClipTrigger
                        active={clipModeActive || viralClipTriggerBusy}
                        processing={viralClipTriggerBusy}
                        disabled={clipModeActive || viralClipTriggerBusy}
                        onLockedHoverChange={setIsLockedViralClipTriggerHovered}
                        onActivate={() => {
                          void handleGenerateViralClips()
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsAiLampOpen(true)}
                        aria-label="Open AI direction"
                        className="grid size-9 place-items-center rounded-full border border-white/8 bg-white/[0.02] transition-colors hover:text-white/72"
                      >
                        <Sparkles className="size-4" />
                      </button>
                      <button type="button" className="grid size-9 place-items-center rounded-full border border-white/8 bg-white/[0.02] transition-colors hover:text-white/72">
                        <Layers3 className="size-4" />
                      </button>
                      <button type="button" className="grid size-9 place-items-center rounded-full border border-white/8 bg-white/[0.02] transition-colors hover:text-white/72">
                        <SlidersHorizontal className="size-4" />
                      </button>
                    </div>

                    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/52">
                      Preview may be choppy. Exports stay frame-perfect.
                    </div>
                  </div>
                </motion.div>
              ) : null}

              <div
                className={cn(
                  'flex min-h-0 flex-1 flex-col px-4',
                  activeWorkspaceTab === 'Music'
                    ? 'overflow-hidden py-4'
                    : 'overflow-y-auto overscroll-contain py-3',
                )}
              >
                {activeWorkspaceTab === 'Music' ? (
                  <MusicTabPanel
                    tracks={editorMusicRecommendations}
                    projectTitle={project?.title ?? 'Untitled Project'}
                    selectedTrackId={selectedEditorMusicTrackId}
                    onSelectTrack={(track) => handleEditorMusicTrackSelect(track.id)}
                  />
                ) : null}

                <div className={cn('w-full max-w-[min(100%,54rem)] self-center rounded-[18px] border border-white/8 bg-[#09090c] p-3', activeWorkspaceTab === 'Music' && 'hidden')}>
                  <div className="flex h-[clamp(250px,40vh,460px)] items-center justify-center rounded-[14px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)] p-4">
                    <div className="relative flex h-full w-full items-center justify-center">
                      <div
                        ref={setMusicSpotlightPortalTarget}
                        className="pointer-events-none absolute right-2 top-2 z-20"
                      />
                      <input
                        ref={sourceFileInputRef}
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        onChange={handleInlineSourceFileInputChange}
                      />
                      <motion.div
                        layout
                        className="group relative overflow-hidden rounded-[8px] border border-[#267dff]/18 bg-black shadow-[0_18px_48px_-30px_rgba(0,0,0,0.95)] transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#267dff]/28 hover:shadow-[0_20px_54px_-30px_rgba(38,125,255,0.2)]"
                        style={{
                          aspectRatio: resolvedPreviewAspectRatio,
                          width: previewFrameWidth,
                          height: 'auto',
                          willChange: 'width, height, transform',
                        }}
                        transition={{
                          layout: {
                            duration: 0.72,
                            ease: [0.645, 0.045, 0.355, 1],
                          },
                        }}
                      >
                        <div className="relative h-full w-full">
                          <BriefPipelineProgress 
                            status={job?.transcriptStatus} 
                            steps={job?.previewProgressSteps}
                          />

                          {hasSourceAsset && hasPreviewMedia && !clipModeActive ? (                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                              className="pointer-events-none absolute bottom-3 left-3 z-20"
                            >
                              <div className="inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/10 bg-black/48 px-3 py-1.5 text-[11px] text-white/86 shadow-[0_18px_30px_-22px_rgba(0,0,0,0.95)] backdrop-blur-md">
                                <Film className="size-3.5 shrink-0 text-[#9ff6e3]" />
                                <div className="min-w-0 truncate font-medium text-white/90">
                                  {sourceAssetLabel ?? project?.title ?? 'Source video'}
                                </div>
                              </div>
                            </motion.div>
                          ) : null}

                          {hasPreviewMedia ? (
                            <>
                              <CinematicPreviewRuntime
                                animationPlan={previewOverlayPlan}
                                currentTimeMs={previewCurrentTimeSec * 1000}
                                aspectRatio={resolvedPreviewAspectRatio}
                                showSafeZones={Boolean(previewOverlayPlan)}
                                className="absolute inset-0"
                              >
                                {showViralClipSplitPreview ? (
                                  <ViralClipSplitPreview
                                    key={`viral-split-${viralClipSplitAnimationKey}-${previewUrl}`}
                                    active={showViralClipSplitPreview}
                                    animationKey={viralClipSplitAnimationKey}
                                    previewUrl={previewUrl}
                                    previewKind={previewKind}
                                    title={sourceAssetLabel ?? project?.title ?? 'Source video'}
                                    isPlaying={previewPlaying}
                                    currentTimeSec={previewCurrentTimeSec}
                                    mediaTransformStyle={shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle}
                                    objectFit={fitMode === 'fill' ? 'cover' : 'contain'}
                                    splitVideoSources={currentSplitPreviewAssets}
                                    highlightRestore={isLockedViralClipTriggerHovered}
                                    onRestoreLandscape={handleRestoreLandscapePreview}
                                  />
                                ) : previewKind === 'image' ? (
                                  <div className="absolute inset-0 overflow-hidden bg-black">
                                    <div className="absolute inset-0" style={shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle}>
                                      <img
                                        src={previewUrl}
                                        alt={project?.title ?? 'Project preview'}
                                        className="block h-full w-full bg-black"
                                        onLoad={handlePreviewImageLoaded}
                                        style={{
                                          objectFit: fitMode === 'fill' ? 'cover' : 'contain',
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
                                    <div
                                      className="absolute inset-0 cursor-pointer"
                                      onPointerDown={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        togglePreviewPlayback()
                                      }}
                                      style={shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle}
                                    >
                                      <video
                                        key={previewUrl}
                                        ref={previewVideoRef}
                                        src={previewUrl}
                                        muted={isPreviewMuted}
                                        playsInline
                                        controls={false}
                                        preload="auto"
                                        onLoadedMetadata={handlePreviewMetadataLoaded}
                                        onLoadedData={handlePreviewVideoReady}
                                        onCanPlay={handlePreviewVideoReady}
                                        onTimeUpdate={handlePreviewTimeUpdate}
                                        onEnded={handlePreviewEnded}
                                        onPlay={handlePreviewVideoPlay}
                                        onPause={handlePreviewVideoPause}
                                        onError={handlePreviewVideoError}
                                        className="pointer-events-none block h-full w-full select-none bg-black"
                                        style={{
                                          objectFit: fitMode === 'fill' ? 'cover' : 'contain',
                                        }}
                                      />
                                    </div>

                                    {!isPreviewMediaReady && isPreviewLoadingVisible ? (
                                      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/15 px-6">
                                        <InfinityTrailLoader
                                          label="Loading source preview"
                                          subtitle="Preparing the visible video surface."
                                          variant="stacked"
                                          className="w-full max-w-[320px]"
                                        />
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </CinematicPreviewRuntime>

                              <PreviewGenerationState 
                                isVisible={isPreviewBriefGenerating}
                                onComplete={() => {
                                  setIsPreviewBriefGenerating(false)
                                  setShowPreviewFeedback(true)
                                }}
                              />

                              <PreviewFeedbackShell
                                previewId={undefined}
                                projectId={projectId}
                                show={showPreviewFeedback}
                                onDismiss={() => setShowPreviewFeedback(false)}
                                onSubmitPayload={(payload) => {
                                  console.debug('Preview Feedback Submitted:', payload)
                                  if (payload.sentiment === 'try_again') {
                                    // Local only, no backend mutation
                                    console.debug('Try again requested')
                                  }
                                }}
                              />

                              {showInlinePreviewStatus ? (
                                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-5">
                                  <motion.button
                                    type="button"
                                    aria-label={
                                      sourceStageError
                                        ? 'Source upload error'
                                        : inlinePreviewStatusLabel ?? 'Source upload status'
                                    }
                                    layout
                                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                    onHoverStart={() => setInlinePreviewStatusHovered(true)}
                                    onHoverEnd={() => setInlinePreviewStatusHovered(false)}
                                    onFocus={() => setInlinePreviewStatusHovered(true)}
                                    onBlur={() => setInlinePreviewStatusHovered(false)}
                                    className={cn(
                                      'pointer-events-auto inline-flex items-center overflow-hidden border border-white/10 bg-black/44 shadow-[0_18px_30px_-22px_rgba(0,0,0,0.95)] backdrop-blur-md transition-[border-radius,padding,gap,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                      isInlinePreviewStatusExpanded
                                        ? 'gap-2 rounded-full px-3 py-1.5 text-[11px] text-white/72'
                                        : 'size-9 justify-center rounded-full text-white/84 hover:bg-black/56',
                                    )}
                                  >
                                    <motion.span
                                      aria-hidden
                                      className="flex size-4 shrink-0 items-center justify-center"
                                      animate={
                                        sourceStageError
                                          ? { rotate: 0, scale: [0.92, 1.02, 0.92] }
                                          : { rotate: 360 }
                                      }
                                      transition={
                                        sourceStageError
                                          ? { duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }
                                          : { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }
                                      }
                                    >
                                      {sourceStageError ? (
                                        <AlertCircle className="size-4 text-rose-100" />
                                      ) : (
                                        <Loader2 className="size-4 text-[#9ff6e3]" />
                                      )}
                                    </motion.span>

                                    <AnimatePresence initial={false}>
                                      {isInlinePreviewStatusExpanded && inlinePreviewStatusLabel ? (
                                        <motion.span
                                          key="inline-preview-status-label"
                                          initial={{ opacity: 0, x: -6 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: -4 }}
                                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                        >
                                          {inlinePreviewStatusLabel}
                                        </motion.span>
                                      ) : null}
                                    </AnimatePresence>
                                  </motion.button>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <SourceStagePlaceholder
                              status={sourceStageError ? 'error' : previewUrl || hasSourceAsset ? 'loading' : 'empty'}
                              isDragActive={isInlineSourceDragOver}
                              onPickSource={openInlineSourcePicker}
                              onDragOver={handleInlineSourceDragOver}
                              onDragLeave={handleInlineSourceDragLeave}
                              onDrop={handleInlineSourceDrop}
                            />
                          )}

                          <div className="pointer-events-none absolute inset-[10%] rounded-[8px] border border-dashed border-white/12" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div className={cn('w-full max-w-[min(100%,54rem)] self-center', activeWorkspaceTab === 'Music' && 'hidden')}>
                  <div className="mt-2.5 flex w-full flex-wrap items-center gap-3 rounded-[20px] border border-white/8 bg-[#0c0c10] px-4 py-2.5">
                    <button
                      type="button"
                      onClick={togglePreviewPlayback}
                      disabled={previewKind !== 'video' || !previewUrl}
                      className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/76 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/28"
                    >
                      {previewPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
                    </button>

                    <div className="min-w-[84px] text-sm text-white/72">
                      {transportCurrentTime} / {transportTime}
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={transportProgress}
                      onChange={(event) => handlePreviewSeek(Number(event.target.value))}
                      disabled={previewKind !== 'video' || !previewUrl}
                      className="h-1.5 flex-1 accent-white disabled:cursor-not-allowed disabled:opacity-40"
                    />

                    <button
                      type="button"
                      onClick={() => setIsPreviewMuted((prev) => !prev)}
                      title={isPreviewMuted ? 'Unmute' : 'Mute'}
                      aria-label={
                        project?.sourceProfile?.inspection.hasAudio === false
                          ? `${isPreviewMuted ? 'Unmute' : 'Mute'} (Source detected as silent)`
                          : isPreviewMuted
                            ? 'Unmute source'
                            : 'Mute source'
                      }
                      className={cn(
                        'grid size-9 place-items-center rounded-full border transition-colors',
                        isPreviewMuted
                          ? 'border-white/8 bg-white/[0.02] text-white/44 hover:text-white/64'
                          : 'border-white/14 bg-white/[0.06] text-white/82 hover:text-white',
                      )}
                    >
                      {isPreviewMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>
                  </div>

                  <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-2">
                    {BOTTOM_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setBottomMode(mode)}
                        className={cn(
                          'rounded-full border px-4 py-2 text-xs transition-colors',
                          bottomMode === mode
                            ? 'border-white/14 bg-white/[0.10] text-white'
                            : 'border-white/8 bg-white/[0.03] text-white/56 hover:text-white/78',
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            <motion.aside
              layout
              className="premium-ambient-panel premium-vignette-surface flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#131317] overscroll-contain lg:col-span-2 xl:col-span-1"
            >
              <LuxuryVignette tone="cool" />
              <motion.div
                variants={buildRevealVariants({ delay: 0.1, distance: 12, blur: 8, duration: 0.26 })}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.45 }}
                className="flex items-center justify-between border-b border-white/8 px-4 py-4"
              >
                <div>
                  <TextReveal as="div" text="Video" delay={0.04} className="text-sm text-white" />
                  <TextReveal as="div" text="Transform and frame the current source." delay={0.08} className="mt-1 text-xs text-white/38" />
                </div>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-full border border-white/8 bg-white/[0.03] text-white/42 transition-colors hover:text-white/72"
                >
                  <Settings2 className="size-4" />
                </button>
              </motion.div>

              <div ref={inspectorViewportRef} className="premium-scroll-mask min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <motion.div
                  variants={buildRevealVariants({ delay: 0.14, distance: 14, blur: 10, duration: 0.28 })}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
                  className="rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Frame</div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {PREVIEW_FRAME_PRESETS.map((framePreset) => (
                      <button
                        key={framePreset}
                        type="button"
                        onClick={() => {
                          setViralClipSplitPreviewActive(false)
                          setPreviewFramePreset(framePreset)
                        }}
                        className={cn(
                          'rounded-[12px] border px-3 py-2 text-left text-sm transition-colors',
                          previewFramePreset === framePreset
                            ? 'border-[#267dff]/45 bg-[#267dff]/12 text-white'
                            : 'border-white/8 bg-white/[0.03] text-white/58 hover:border-white/14 hover:bg-white/[0.05] hover:text-white/82',
                        )}
                      >
                        <div className="font-medium text-white/88">{previewFrameLabel(framePreset)}</div>
                        <div className="mt-1 text-[11px] text-white/42">
                          {framePreset === 'source'
                            ? 'Uses the source shape.'
                            : `${framePreset} output frame.`}
                        </div>
                      </button>
                    ))}
                  </div>
                  {clipModeActive ? (
                    <div className="mt-3 rounded-[14px] border border-[#9ff6e3]/16 bg-[#9ff6e3]/[0.06] px-3 py-2 text-[11px] leading-5 text-[#dffdf5]">
                      Viral clip mode is armed. This preview is stress-testing the cut in a 9:16 delivery frame.
                    </div>
                  ) : null}
                </motion.div>

                <motion.div
                  variants={buildRevealVariants({ delay: 0.18, distance: 14, blur: 10, duration: 0.28 })}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
                  className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.32em] text-[#c9b7ff]/68">Transform</div>

                  <div className="mt-4 rounded-[14px] border border-white/8 bg-[#0d0d12] p-1">
                    <div className="grid grid-cols-2 gap-1">
                      {(['fill', 'fit'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFitMode(mode)}
                          className={cn(
                            'rounded-[10px] px-3 py-2 text-sm transition-colors',
                            fitMode === mode ? 'bg-white/[0.12] text-white' : 'text-white/44 hover:text-white/74',
                          )}
                        >
                          {mode === 'fill' ? 'Fill' : 'Fit'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <InspectorField
                    label="Scale"
                    value={`${Math.round(scale)}%`}
                    viewportRoot={inspectorViewportRef}
                    revealDelay={0.18}
                  >
                    <input
                      type="range"
                      min={80}
                      max={130}
                      value={scale}
                      onChange={(event) => setScale(Number(event.target.value))}
                      className="h-1.5 w-full accent-white"
                    />
                  </InspectorField>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InspectorNumberField
                      label="Offset X"
                      value={offsetX}
                      onChange={setOffsetX}
                      viewportRoot={inspectorViewportRef}
                      revealDelay={0.22}
                    />
                    <InspectorNumberField
                      label="Offset Y"
                      value={offsetY}
                      onChange={setOffsetY}
                      viewportRoot={inspectorViewportRef}
                      revealDelay={0.26}
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={buildRevealVariants({ delay: 0.24, distance: 14, blur: 10, duration: 0.28 })}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
                  className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Source Profile</div>
                  {project?.sourceProfile ? (
                    <>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/8 bg-[#0d0d12] px-3 py-1 text-[11px] text-white/74">
                          {formatAspectFamily(project.sourceProfile.aspectFamily)}
                        </span>
                        <span className="rounded-full border border-white/8 bg-[#0d0d12] px-3 py-1 text-[11px] text-white/74">
                          {formatTimeProfile(project.sourceProfile.timeProfile)}
                        </span>
                        <span className="rounded-full border border-white/8 bg-[#0d0d12] px-3 py-1 text-[11px] text-white/74">
                          {formatProcessingClass(project.sourceProfile.processingClass)}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3 text-sm text-white/68">
                        <InspectorMeta
                          label="Resolution"
                          value={sourceMetrics?.resolution ?? 'Unknown resolution'}
                          viewportRoot={inspectorViewportRef}
                          revealDelay={0.26}
                        />
                        <InspectorMeta
                          label="Duration"
                          value={sourceMetrics?.duration ?? 'Unknown duration'}
                          viewportRoot={inspectorViewportRef}
                          revealDelay={0.3}
                        />
                        <InspectorMeta
                          label="Weight"
                          value={formatWeightBucket(project.sourceProfile.weightBucket)}
                          viewportRoot={inspectorViewportRef}
                          revealDelay={0.34}
                        />
                        <InspectorMeta
                          label="Bucket"
                          value={formatDurationBucket(project.sourceProfile.durationBucket)}
                          viewportRoot={inspectorViewportRef}
                          revealDelay={0.38}
                        />
                      </div>
                    </>
                  ) : hasSourceAsset ? (
                    <div className="mt-3 rounded-[14px] border border-white/8 bg-[#0d0d12] p-4">
                      <div className="text-sm font-medium text-white/88">Source staged</div>
                      <div className="mt-1 text-xs leading-5 text-white/46">
                        The frame is live. Local profiling will fill in richer source details as they become available.
                      </div>
                      <button
                        type="button"
                        onClick={openInlineSourcePicker}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-3 py-2 text-[11px] font-medium text-black transition-transform hover:scale-[1.01]"
                      >
                        <Sparkles className="size-3.5" />
                        Replace video
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[14px] border border-white/8 bg-[#0d0d12] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white/88">No source attached yet</div>
                          <div className="mt-1 text-xs leading-5 text-white/46">
                            Stage a video in the main frame and the preview will wake up in place.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={openInlineSourcePicker}
                          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white px-3 py-2 text-[11px] font-medium text-black transition-transform hover:scale-[1.01]"
                        >
                          <Sparkles className="size-3.5" />
                          Choose video
                        </button>
                      </div>
                      {sourceStageError ? (
                        <div className="mt-3 rounded-[12px] border border-rose-400/16 bg-rose-500/8 px-3 py-2 text-[11px] leading-5 text-rose-100/92">
                          {sourceStageError}
                        </div>
                      ) : null}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  variants={buildRevealVariants({ delay: 0.32, distance: 14, blur: 10, duration: 0.28 })}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
                  className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Source</div>
                  <div className="mt-4 space-y-3 text-sm text-white/68">
                    <InspectorMeta
                      label="Type"
                      value={previewKind === 'image' ? 'Image' : 'Video'}
                      viewportRoot={inspectorViewportRef}
                      revealDelay={0.34}
                    />
                    <InspectorMeta
                      label="Status"
                      value={hasSourceAsset ? (job?.status === 'completed' ? 'Ready' : 'Staging') : 'No source'}
                      viewportRoot={inspectorViewportRef}
                      revealDelay={0.38}
                    />
                    <InspectorMeta
                      label="Duration"
                      value={transportTime}
                      viewportRoot={inspectorViewportRef}
                      revealDelay={0.42}
                    />
                    <InspectorMeta
                      label="Prompt"
                      value={promptText.slice(0, 48)}
                      viewportRoot={inspectorViewportRef}
                      revealDelay={0.46}
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={buildRevealVariants({ delay: 0.35, distance: 14, blur: 10, duration: 0.28 })}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
                  className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.32em] text-[#f4eb72]/72">Preview Rendering</div>
                  <div className="mt-3 rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/84">
                        {previewOverlayPlan ? 'Live edit overlay' : 'Direct source preview only'}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.22em] text-white/36">
                        {previewOverlayPlan ? 'streaming edit pass' : 'overlays off'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs leading-5 text-white/46">
                      {previewOverlayPlan
                        ? 'The backend edit stream is painting typographic beats and preset assets directly onto the imported video.'
                        : 'Cinematic captions, explainer panels, background washes, and other generated preview treatments will attach here once an edit job starts.'}
                    </div>
                  </div>

                  <div className="mt-3 rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 py-3 text-sm text-white/72">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/42">Current view</span>
                      <span className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                        {bottomMode.toLowerCase()}
                      </span>
                    </div>
                    <div className="mt-2 font-medium text-white/88">
                      {previewOverlayPlan
                        ? 'The editor is rendering the live style lane on top of the uploaded media.'
                        : 'The editor is showing the uploaded media without generated video edits.'}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-white/46">
                      {previewOverlayPlan
                        ? 'Use the frame controls, crop and fit controls, and playback controls as usual. The style lane is active on top of the imported clip.'
                        : 'Use the frame controls, crop and fit controls, and playback controls as usual. The auto-styled cinematic layer is no longer applied on top.'}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={buildRevealVariants({ delay: 0.38, distance: 14, blur: 10, duration: 0.28 })}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
                  className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Queue</div>
                  <div className="mt-4 space-y-2">
                    {(job?.steps ?? []).map((step, index) => (
                      <motion.div
                        key={step.key}
                        variants={buildRevealVariants({ delay: 0.42 + index * 0.04, distance: 10, blur: 6, duration: 0.24 })}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ root: inspectorViewportRef, once: false, amount: 0.35 }}
                        className="rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-white/78">{step.title}</span>
                          <span className="text-white/40">{Math.round(step.progress * 100)}%</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-white/[0.54]"
                            style={{ width: `${Math.max(6, Math.round(step.progress * 100))}%` }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.aside>
          </div>
        </main>
      </div>
      </div>
      <AiLampDialog
        open={isAiLampOpen}
        onOpenChange={setIsAiLampOpen}
        badge="Prometheus AI"
        title="Shape the next pass"
        description="Call up a directed AI lane for this project without leaving the chamber. Pick the route you want, and Prometheus will move the edit, music, or chat flow forward from there."
        actions={aiLampActions}
      />

      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent className="max-w-[480px] border-white/12 bg-[#0e1016]/95 text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(circle_at_32%_22%,rgba(155,142,255,0.14)_0%,rgba(155,142,255,0)_42%)]" />
          
          <DialogHeader className="relative">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Download className="size-6 text-[#9ff6e3]" />
            </div>
            <DialogTitle className="text-2xl font-medium tracking-tight">Prepare final download?</DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed text-white/60">
              Your export is ready. This prototype download uses the current source-backed export proof. Real rendered edits will replace this in the render worker phase.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mx-6 mt-4 space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Project</span>
              <span className="font-medium text-white/90">{project?.title ?? 'Untitled'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Status</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Completed
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Type</span>
              <span className="text-white/80">MP4 Video</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Security</span>
              <span className="text-white/50">Signed R2 Link</span>
            </div>
          </div>

          <DialogFooter className="relative mt-6 gap-3 px-6 pb-6">
            <Button
              variant="ghost"
              onClick={() => setIsDownloadDialogOpen(false)}
              className="h-11 flex-1 rounded-xl border border-white/8 bg-white/5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDownload}
              className="h-11 flex-1 rounded-xl bg-white text-sm font-medium text-black transition-all hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
            >
              Download MP4
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <DurableJobProgress
        status={jobStatus}
        progress={jobProgress}
        type={dbJob?.type}
        errorMessage={jobError || dbJob?.errorMessage}
      />

      <div
        ref={setChatComposerPortal}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] h-0 w-0 overflow-visible"
      />
    </>
  )
}

function InspectorField({
  label,
  value,
  children,
  viewportRoot,
  revealDelay = 0,
}: {
  label: string
  value: string
  children: React.ReactNode
  viewportRoot?: React.RefObject<HTMLDivElement | null>
  revealDelay?: number
}) {
  const reduceMotion = useStableReducedMotion()
  return (
    <motion.div
      variants={buildRevealVariants({ delay: revealDelay, distance: 12, blur: 8, duration: 0.26 })}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={reduceMotion ? undefined : { root: viewportRoot, once: false, amount: 0.4 }}
      className="mt-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-white/42">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      {children}
    </motion.div>
  )
}

function InspectorNumberField({
  label,
  value,
  onChange,
  viewportRoot,
  revealDelay = 0,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  viewportRoot?: React.RefObject<HTMLDivElement | null>
  revealDelay?: number
}) {
  const reduceMotion = useStableReducedMotion()
  return (
    <motion.label
      variants={buildRevealVariants({ delay: revealDelay, distance: 12, blur: 8, duration: 0.26 })}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={reduceMotion ? undefined : { root: viewportRoot, once: false, amount: 0.4 }}
      className="block"
    >
      <div className="mb-2 text-xs text-white/42">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 text-sm text-white outline-none transition-colors focus:border-white/16"
      />
    </motion.label>
  )
}

function InspectorMeta({
  label,
  value,
  viewportRoot,
  revealDelay = 0,
}: {
  label: string
  value: string
  viewportRoot?: React.RefObject<HTMLDivElement | null>
  revealDelay?: number
}) {
  const reduceMotion = useStableReducedMotion()
  return (
    <motion.div
      variants={buildRevealVariants({ delay: revealDelay, distance: 10, blur: 6, duration: 0.24 })}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={reduceMotion ? undefined : { root: viewportRoot, once: false, amount: 0.4 }}
      className="flex items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 py-3"
    >
      <span className="text-white/42">{label}</span>
      <span className="max-w-[60%] truncate text-right text-white/78">{value}</span>
    </motion.div>
  )
}
