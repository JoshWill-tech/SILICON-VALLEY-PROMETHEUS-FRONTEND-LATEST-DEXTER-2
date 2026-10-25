'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Film, Play, Pause, Maximize2, Minimize2, X, GripVertical } from 'lucide-react'
import { InlineLoadingAnimation } from '@/components/loading-animation'
import { CinematicPreviewRuntime } from '@/components/editor/cinematic-preview-runtime'
import { ViralClipSplitPreview } from '@/components/editor/viral-clip-split-preview'
import { PreviewGenerationState } from '@/components/editor/preview-generation-state'
import { PreviewFeedbackShell } from '@/components/editor/preview-feedback-shell'
import { SourceStagePlaceholder } from '@/components/editor/source-stage-placeholder'
import { MiniRunLiveOverlay } from '@/components/editor/mini-run-live-overlay'
import { MiniRunOutsideHud } from '@/components/editor/mini-run-outside-hud'
import { cn } from '@/lib/utils'
import type {
  Project,
  ProcessingJob,
  HeaderNavMode,
  PreviewMediaKind,
  AnimationPlan,
  TranscriptStatus
} from '@/lib/types'
import type { SplitPreviewAssetState } from '@/lib/hooks/useVideoEngine'

export interface PreviewCanvasProps {
  projectId: string
  project: Project | null
  job: ProcessingJob | null
  activeWorkspaceTab: HeaderNavMode
  hasSourceAsset: boolean
  hasPreviewMedia: boolean
  clipModeActive: boolean
  sourceAssetLabel: string | null
  previewOverlayPlan: AnimationPlan | null
  previewCurrentTimeSec: number
  transportCurrentTime: string
  transportTime: string
  showViralClipSplitPreview: boolean
  viralClipSplitAnimationKey: number
  previewUrl: string
  previewKind: PreviewMediaKind
  previewPlaying: boolean
  shouldUseLegacySessionPreviewSurface: boolean
  previewFrameTransformStyle: React.CSSProperties | undefined
  fitMode: 'fill' | 'fit'
  currentSplitPreviewAssets: SplitPreviewAssetState
  isLockedViralClipTriggerHovered: boolean
  isPreviewMuted: boolean
  isPreviewMediaReady: boolean
  isSourceStageActivelyLoading: boolean
  isPreviewBriefGenerating: boolean
  showPreviewFeedback: boolean
  showInlinePreviewStatus: boolean
  sourceStageError: string | null
  inlinePreviewStatusLabel: string | null
  isInlinePreviewStatusExpanded: boolean
  isInlineSourceDragOver: boolean
  visiblePreviewAspectRatio: number
  previewFrameWidth: string
  sourceFileInputRef: React.RefObject<HTMLInputElement | null>
  previewVideoRef: React.RefObject<HTMLVideoElement | null>
  onInlineSourceFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRestoreLandscape: () => void
  onPreviewImageLoaded: (event: React.SyntheticEvent<HTMLImageElement>) => void
  onPreviewMetadataLoaded: () => void
  onPreviewVideoReady: () => void
  onPreviewTimeUpdate: () => void
  onPreviewEnded: () => void
  onPreviewVideoPlay: () => void
  onPreviewVideoPause: () => void
  onPreviewVideoError: () => void
  onTogglePreviewPlayback: () => void
  onSeekPreview: (timeSec: number) => void
  onSetIsPreviewBriefGenerating: (visible: boolean) => void
  onSetShowPreviewFeedback: (show: boolean) => void
  onSetInlinePreviewStatusHovered: (hovered: boolean) => void
  onPickSource: () => void
  onInlineSourceDragOver: (event: React.DragEvent<HTMLButtonElement>) => void
  onInlineSourceDragLeave: () => void
  onInlineSourceDrop: (event: React.DragEvent<HTMLButtonElement>) => void
  comparisonControl?: React.ReactNode
}

export function PreviewCanvas({
  projectId,
  project,
  job,
  activeWorkspaceTab,
  hasSourceAsset,
  hasPreviewMedia,
  clipModeActive,
  sourceAssetLabel,
  previewOverlayPlan,
  previewCurrentTimeSec,
  transportCurrentTime,
  transportTime,
  showViralClipSplitPreview,
  viralClipSplitAnimationKey,
  previewUrl,
  previewKind,
  previewPlaying,
  shouldUseLegacySessionPreviewSurface,
  previewFrameTransformStyle,
  fitMode,
  currentSplitPreviewAssets,
  isLockedViralClipTriggerHovered,
  isPreviewMuted,
  isPreviewMediaReady,
  isSourceStageActivelyLoading,
  isPreviewBriefGenerating,
  showPreviewFeedback,
  showInlinePreviewStatus,
  sourceStageError,
  inlinePreviewStatusLabel,
  isInlinePreviewStatusExpanded,
  isInlineSourceDragOver,
  visiblePreviewAspectRatio,
  previewFrameWidth,
  sourceFileInputRef,
  previewVideoRef,
  onInlineSourceFileInputChange,
  onRestoreLandscape,
  onPreviewImageLoaded,
  onPreviewMetadataLoaded,
  onPreviewVideoReady,
  onPreviewTimeUpdate,
  onPreviewEnded,
  onPreviewVideoPlay,
  onPreviewVideoPause,
  onPreviewVideoError,
  onTogglePreviewPlayback,
  onSeekPreview,
  onSetIsPreviewBriefGenerating,
  onSetShowPreviewFeedback,
  onSetInlinePreviewStatusHovered,
  onPickSource,
  onInlineSourceDragOver,
  onInlineSourceDragLeave,
  onInlineSourceDrop,
  comparisonControl,
}: PreviewCanvasProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const fullscreenVideoRef = React.useRef<HTMLVideoElement | null>(null)
  const previewCanvasRef = React.useRef<HTMLDivElement | null>(null)
  const [isDraggingControls, setIsDraggingControls] = React.useState(false)
  const [isControlsHovered, setIsControlsHovered] = React.useState(false)
  const [controlsKey, setControlsKey] = React.useState(0)
  const [hasRepositionedControls, setHasRepositionedControls] = React.useState(false)

  const handleResetControlsPosition = React.useCallback(() => {
    setControlsKey((k) => k + 1)
    setHasRepositionedControls(false)
  }, [])

  const handleExitFullscreen = React.useCallback(() => {
    const fsVideo = fullscreenVideoRef.current
    const inlineVideo = previewVideoRef.current
    if (fsVideo && inlineVideo) {
      inlineVideo.currentTime = fsVideo.currentTime
      if (!fsVideo.paused) {
        void inlineVideo.play().catch(() => undefined)
      } else {
        inlineVideo.pause()
      }
      fsVideo.pause()
    }
    setIsFullscreen(false)
  }, [previewVideoRef])

  React.useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleExitFullscreen()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, handleExitFullscreen])

  // Handle fullscreen video mounting, initial synchronization, and inline video pausing
  React.useEffect(() => {
    if (!isFullscreen || previewKind !== 'video') return
    const fsVideo = fullscreenVideoRef.current
    const inlineVideo = previewVideoRef.current

    // Pause and silence inline video while expanded to eliminate overlapping desynced playback
    if (inlineVideo && !inlineVideo.paused) {
      inlineVideo.pause()
    }

    if (fsVideo) {
      const startSec = inlineVideo && Number.isFinite(inlineVideo.currentTime) && inlineVideo.currentTime > 0
        ? inlineVideo.currentTime
        : previewCurrentTimeSec
      if (Math.abs(fsVideo.currentTime - startSec) > 0.05) {
        fsVideo.currentTime = startSec
      }
      if (previewPlaying) {
        void fsVideo.play().catch(() => undefined)
      } else {
        fsVideo.pause()
      }
    }
  }, [isFullscreen, previewKind])

  // Synchronize play/pause state when changed without re-seeking or seek loops
  React.useEffect(() => {
    if (!isFullscreen || previewKind !== 'video') return
    const fsVideo = fullscreenVideoRef.current
    if (!fsVideo) return
    if (previewPlaying) {
      if (fsVideo.paused) void fsVideo.play().catch(() => undefined)
    } else {
      if (!fsVideo.paused) fsVideo.pause()
    }
  }, [isFullscreen, previewPlaying, previewKind])

  if (activeWorkspaceTab === 'Music') return null

  return (
    <>
    <div className="flex w-full flex-col items-center">
      <div ref={previewCanvasRef} className="group relative w-full max-w-[min(100%,54rem)] self-center">
        <div
          className={cn(
            'relative w-full',
            hasPreviewMedia
              ? 'max-h-[clamp(250px,40vh,460px)]'
              : 'h-[clamp(250px,40vh,460px)]',
          )}
          style={hasPreviewMedia ? { aspectRatio: visiblePreviewAspectRatio } : undefined}
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <motion.div
              data-theme-independent="media"
              layout
              className="relative overflow-visible"
              style={{
                aspectRatio: visiblePreviewAspectRatio,
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
              <div className="relative h-full w-full overflow-hidden rounded-xl">
                {hasSourceAsset && hasPreviewMedia && !clipModeActive ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute bottom-3 left-3 z-20"
                  >
                    <div className="inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/10 bg-black/48 px-3 py-1.5 text-[11px] text-white/86 shadow-[0_18px_30px_-22px_rgba(0,0,0,0.95)] backdrop-blur-md">
                      <Film className="size-3.5 shrink-0 text-accent-cyan" />
                      <div className="min-w-0 truncate font-medium text-white/90">
                        {sourceAssetLabel ?? project?.title ?? 'Source video'}
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                {hasPreviewMedia ? (
                  <>
                    <BriefPipelineProgress
                      status={job?.transcriptStatus}
                      steps={job?.previewProgressSteps}
                    />
                    <CinematicPreviewRuntime
                      animationPlan={previewOverlayPlan}
                      currentTimeMs={previewCurrentTimeSec * 1000}
                      aspectRatio={visiblePreviewAspectRatio}
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
                          mediaTransformStyle={
                            shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle
                          }
                          objectFit={fitMode === 'fill' ? 'cover' : 'contain'}
                          splitVideoSources={currentSplitPreviewAssets}
                          highlightRestore={isLockedViralClipTriggerHovered}
                          onRestoreLandscape={onRestoreLandscape}
                        />
                      ) : previewKind === 'image' ? (
                        <div className="absolute inset-0 overflow-hidden bg-black">
                          <div
                            className="absolute inset-0"
                            style={shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle}
                          >
                            <img
                              src={previewUrl}
                              alt={project?.title ?? 'Project preview'}
                              className="block h-full w-full bg-black"
                              onLoad={onPreviewImageLoaded}
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
                              onTogglePreviewPlayback()
                            }}
                            style={shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle}
                          >
                            <video
                              key={previewUrl}
                              ref={previewVideoRef}
                              crossOrigin="anonymous"
                              src={previewUrl}
                              autoPlay={!isFullscreen}
                              muted={isFullscreen ? true : isPreviewMuted}
                              playsInline
                              controls={false}
                              preload="auto"
                              onLoadedMetadata={onPreviewMetadataLoaded}
                              onLoadedData={onPreviewVideoReady}
                              onCanPlay={onPreviewVideoReady}
                              onTimeUpdate={onPreviewTimeUpdate}
                              onEnded={onPreviewEnded}
                              onPlay={onPreviewVideoPlay}
                              onPause={onPreviewVideoPause}
                              onError={onPreviewVideoError}
                              className="pointer-events-none block h-full w-full select-none bg-black"
                              style={{
                                objectFit: fitMode === 'fill' ? 'cover' : 'contain',
                              }}
                            />
                            <MiniRunLiveOverlay
                              videoRef={previewVideoRef}
                              projectId={projectId}
                              sourceAssetId={project?.sourceAssetId ?? undefined}
                              aspectRatio={visiblePreviewAspectRatio}
                              subtitlesOnly={true}
                              active={!isFullscreen}
                            />
                          </div>
                        </div>
                      )}
                    </CinematicPreviewRuntime>

                    <PreviewGenerationState
                      isVisible={isPreviewBriefGenerating}
                      onComplete={() => {
                        onSetIsPreviewBriefGenerating(false)
                        onSetShowPreviewFeedback(true)
                      }}
                    />

                    <PreviewFeedbackShell
                      previewId={undefined}
                      projectId={projectId}
                      show={showPreviewFeedback}
                      onDismiss={() => onSetShowPreviewFeedback(false)}
                      onSubmitPayload={(payload) => {
                        console.debug('Preview Feedback Submitted:', payload)
                        if (payload.sentiment === 'try_again') {
                          // Local only, no backend mutation
                          console.debug('Try again requested')
                        }
                      }}
                    />
                  </>
                ) : (
                  <SourceStagePlaceholder
                    status={sourceStageError ? 'error' : isSourceStageActivelyLoading ? 'loading' : 'empty'}
                    isDragActive={isInlineSourceDragOver}
                    onPickSource={onPickSource}
                    onDragOver={onInlineSourceDragOver}
                    onDragLeave={onInlineSourceDragLeave}
                    onDrop={onInlineSourceDrop}
                  />
                )}
              </div>

              {/* Outside Morphing HUD on the right side of the video */}
              {previewKind === 'video' && hasPreviewMedia && (
                <MiniRunOutsideHud
                  videoRef={previewVideoRef}
                  projectId={projectId}
                  sourceAssetId={project?.sourceAssetId ?? undefined}
                  currentTimeMs={previewCurrentTimeSec * 1000}
                />
              )}
            </motion.div>
          </div>

          {/* Floating Controls Overlay — appears only while hovering the video */}
          <AnimatePresence>
            {hasPreviewMedia && (
              <div
                className={cn(
                  'pointer-events-none absolute inset-x-0 bottom-6 z-30 flex items-center justify-center px-6 transition-opacity duration-300 ease-out',
                  isDraggingControls || isControlsHovered
                    ? 'pointer-events-auto opacity-100'
                    : 'opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
                )}
              >
                <motion.div
                  key={controlsKey}
                  data-preview-controls
                  data-draggable="true"
                  data-dragging={isDraggingControls ? 'true' : 'false'}
                  drag
                  dragConstraints={previewCanvasRef}
                  dragElastic={0.08}
                  dragMomentum={false}
                  whileDrag={{
                    scale: 1.02,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.2)',
                  }}
                  onDragStart={() => setIsDraggingControls(true)}
                  onDragEnd={(_, info) => {
                    setIsDraggingControls(false)
                    if (Math.hypot(info.offset.x, info.offset.y) > 4) {
                      setHasRepositionedControls(true)
                    }
                  }}
                  onMouseEnter={() => setIsControlsHovered(true)}
                  onMouseLeave={() => setIsControlsHovered(false)}
                  className={cn(
                    'glass-panel pointer-events-auto flex items-center gap-3.5 rounded-full border border-white/10 bg-void/60 px-2.5 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-[border-color,background-color] duration-200 select-none cursor-grab active:cursor-grabbing',
                    isDraggingControls && 'cursor-grabbing border-white/30 bg-void/80 shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
                  )}
                >
                  <div
                    className="flex items-center pl-1 text-white/35 transition-colors hover:text-white/80 cursor-grab active:cursor-grabbing"
                    title="Drag to reposition (Double-click to reset)"
                    aria-label="Drag controls to reposition"
                    onDoubleClick={handleResetControlsPosition}
                  >
                    <GripVertical className="size-4 shrink-0" />
                  </div>

                  <div
                    className="flex items-center gap-3 px-2 py-1 cursor-grab active:cursor-grabbing"
                    onDoubleClick={handleResetControlsPosition}
                    title="Double-click to reset position"
                  >
                    <span className="font-mono text-[11px] font-medium tracking-wide text-white/80">
                      {transportCurrentTime}
                    </span>
                    <span className="font-mono text-[11px] font-medium tracking-wide text-chrome-dim">
                      / {transportTime}
                    </span>
                  </div>

                  <button
                    type="button"
                    data-preview-playback
                    onClick={onTogglePreviewPlayback}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-cyan text-void transition-transform active:scale-95 cursor-pointer"
                    aria-label={previewPlaying ? 'Pause preview' : 'Play preview'}
                  >
                    {previewPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-1" />}
                  </button>

                  <div onPointerDown={(e) => e.stopPropagation()} className="cursor-pointer">
                    {comparisonControl}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
                    aria-label="Expand preview"
                    title="Expand preview"
                  >
                    <Maximize2 className="size-4" />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Status Badge */}
          {showInlinePreviewStatus && (
            <div className="pointer-events-none absolute left-6 top-6 z-20 flex justify-center">
              <motion.button
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'pointer-events-auto inline-flex items-center overflow-hidden rounded-full border border-white/10 bg-black/44 px-3 py-1.5 backdrop-blur-md',
                  isInlinePreviewStatusExpanded ? 'gap-2 text-[11px] text-white/72' : 'size-9 justify-center text-white/84'
                )}
              >
                {sourceStageError ? (
                  <motion.span
                    animate={{ scale: [0.92, 1.02, 0.92] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                  >
                    <AlertCircle className="size-4 text-rose-400" />
                  </motion.span>
                ) : (
                  <span className="size-2 rounded-full bg-[#9ff6e3] animate-pulse" />
                )}
                {isInlinePreviewStatusExpanded && inlinePreviewStatusLabel && (
                  <span>{inlinePreviewStatusLabel}</span>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
    {isFullscreen && typeof document !== 'undefined' ? createPortal(
      <AnimatePresence>
        <motion.div
          data-theme-independent="media"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/88 p-4 backdrop-blur-xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded preview"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleExitFullscreen()
          }}
        >
          <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="relative flex h-full w-full items-center justify-center">
            <button type="button" onClick={handleExitFullscreen} className="absolute right-0 top-0 z-30 grid size-11 place-items-center rounded-full border border-white/15 bg-black/62 text-white/76 backdrop-blur-xl transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50" aria-label="Exit expanded preview" title="Exit expanded preview"><Minimize2 className="size-4" /></button>
            <div
              className="relative flex items-center justify-center overflow-hidden rounded-lg bg-black shadow-[0_36px_100px_rgba(0,0,0,0.7)]"
              style={{
                aspectRatio: visiblePreviewAspectRatio > 0 ? visiblePreviewAspectRatio : 9 / 16,
                width: `min(calc(100vw - 2rem), calc((100svh - 4rem) * ${visiblePreviewAspectRatio > 0 ? visiblePreviewAspectRatio : 9 / 16}))`,
                height: `min(calc(100svh - 4rem), calc((100vw - 2rem) / ${visiblePreviewAspectRatio > 0 ? visiblePreviewAspectRatio : 9 / 16}))`,
              }}
            >
              <CinematicPreviewRuntime
                animationPlan={previewOverlayPlan}
                currentTimeMs={previewCurrentTimeSec * 1000}
                aspectRatio={visiblePreviewAspectRatio > 0 ? visiblePreviewAspectRatio : 9 / 16}
                showSafeZones={Boolean(previewOverlayPlan)}
                className="absolute inset-0"
              >
                {showViralClipSplitPreview ? (
                  <ViralClipSplitPreview
                    key={`viral-split-fs-${viralClipSplitAnimationKey}-${previewUrl}`}
                    active={showViralClipSplitPreview}
                    animationKey={viralClipSplitAnimationKey}
                    previewUrl={previewUrl}
                    previewKind={previewKind}
                    title={sourceAssetLabel ?? project?.title ?? 'Source video'}
                    isPlaying={previewPlaying}
                    currentTimeSec={previewCurrentTimeSec}
                    mediaTransformStyle={
                      shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle
                    }
                    objectFit={fitMode === 'fill' ? 'cover' : 'contain'}
                    splitVideoSources={currentSplitPreviewAssets}
                    highlightRestore={isLockedViralClipTriggerHovered}
                    onRestoreLandscape={onRestoreLandscape}
                  />
                ) : previewKind === 'image' ? (
                  <div className="absolute inset-0 overflow-hidden bg-black">
                    <div
                      className="absolute inset-0"
                      style={shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle}
                    >
                      <img
                        src={previewUrl}
                        alt={project?.title ?? 'Project preview'}
                        className="block h-full w-full bg-black object-contain"
                        onLoad={onPreviewImageLoaded}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
                    <div
                      className="relative h-full w-full"
                      style={shouldUseLegacySessionPreviewSurface ? undefined : previewFrameTransformStyle}
                    >
                      <video
                        ref={fullscreenVideoRef}
                        src={previewUrl}
                        muted={isPreviewMuted}
                        controls
                        playsInline
                        className="block h-full w-full select-none bg-black object-contain"
                        onPlay={onPreviewVideoPlay}
                        onPause={onPreviewVideoPause}
                        onEnded={onPreviewEnded}
                        onTimeUpdate={() => {
                          onPreviewTimeUpdate?.()
                        }}
                      />
                      <MiniRunLiveOverlay
                        videoRef={fullscreenVideoRef}
                        projectId={projectId}
                        sourceAssetId={project?.sourceAssetId ?? undefined}
                        aspectRatio={visiblePreviewAspectRatio}
                        subtitlesOnly={true}
                        active={isFullscreen}
                      />
                    </div>
                  </div>
                )}
              </CinematicPreviewRuntime>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body,
    ) : null}
    </>
  )
}

function BriefPipelineProgress({
  steps,
  status,
}: {
  steps?: string[]
  status?: TranscriptStatus
}) {
  const isTranscribing = status === 'transcribing' || status === 'queued'
  const hasSteps = steps && steps.length > 0

  if (!isTranscribing && !hasSteps) return null

  const statusLabel = isTranscribing ? null : 'Analyzing cinematic brief'

  return (
    <div className="absolute inset-x-4 bottom-4 z-30 flex flex-col items-center gap-3 px-4">
      {statusLabel ? (
        <div className="rounded-full border border-white/10 bg-black/48 px-3 py-1.5 text-[11px] font-medium text-white/70 shadow-[0_18px_30px_-22px_rgba(0,0,0,0.95)] backdrop-blur-md">
          {statusLabel}
        </div>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        {(steps ?? []).map((item) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border border-white/8 bg-black/44 px-3 py-1.5 text-[11px] text-white/62 backdrop-blur-sm"
          >
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
