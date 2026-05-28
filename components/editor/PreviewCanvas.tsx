'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Film, Loader2 } from 'lucide-react'
import { CinematicPreviewRuntime } from '@/components/editor/cinematic-preview-runtime'
import { ViralClipSplitPreview } from '@/components/editor/viral-clip-split-preview'
import { PreviewGenerationState } from '@/components/editor/preview-generation-state'
import { PreviewFeedbackShell } from '@/components/editor/preview-feedback-shell'
import { InfinityTrailLoader } from '@/components/editor/infinity-trail-loader'
import { SourceStagePlaceholder } from '@/components/editor/source-stage-placeholder'
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
  isPreviewLoadingVisible: boolean
  isPreviewBriefGenerating: boolean
  showPreviewFeedback: boolean
  showInlinePreviewStatus: boolean
  sourceStageError: string | null
  inlinePreviewStatusLabel: string | null
  isInlinePreviewStatusExpanded: boolean
  isInlineSourceDragOver: boolean
  visiblePreviewAspectRatio: number
  previewFrameWidth: string
  musicSpotlightPortalRef: (node: HTMLDivElement | null) => void
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
  onSetIsPreviewBriefGenerating: (visible: boolean) => void
  onSetShowPreviewFeedback: (show: boolean) => void
  onSetInlinePreviewStatusHovered: (hovered: boolean) => void
  onPickSource: () => void
  onInlineSourceDragOver: (event: React.DragEvent<HTMLButtonElement>) => void
  onInlineSourceDragLeave: () => void
  onInlineSourceDrop: (event: React.DragEvent<HTMLButtonElement>) => void
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
  isPreviewLoadingVisible,
  isPreviewBriefGenerating,
  showPreviewFeedback,
  showInlinePreviewStatus,
  sourceStageError,
  inlinePreviewStatusLabel,
  isInlinePreviewStatusExpanded,
  isInlineSourceDragOver,
  visiblePreviewAspectRatio,
  previewFrameWidth,
  musicSpotlightPortalRef,
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
  onSetIsPreviewBriefGenerating,
  onSetShowPreviewFeedback,
  onSetInlinePreviewStatusHovered,
  onPickSource,
  onInlineSourceDragOver,
  onInlineSourceDragLeave,
  onInlineSourceDrop,
}: PreviewCanvasProps) {
  if (activeWorkspaceTab === 'Music') return null

  return (
    <div className="w-full max-w-[min(100%,54rem)] self-center rounded-[18px] border border-white/8 bg-[#09090c] p-3">
      <div className="flex h-[clamp(250px,40vh,460px)] items-center justify-center rounded-[14px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)] p-4">
        <div className="relative flex h-full w-full items-center justify-center">
          <div
            ref={musicSpotlightPortalRef}
            className="pointer-events-none absolute right-2 top-2 z-20"
          />
          <input
            ref={sourceFileInputRef}
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={onInlineSourceFileInputChange}
          />
          <motion.div
            layout
            className="group relative overflow-hidden rounded-[8px] border border-[#267dff]/18 bg-black shadow-[0_18px_48px_-30px_rgba(0,0,0,0.95)] transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#267dff]/28 hover:shadow-[0_20px_54px_-30px_rgba(38,125,255,0.2)]"
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
            <div className="relative h-full w-full">
              <BriefPipelineProgress
                status={job?.transcriptStatus}
                steps={job?.previewProgressSteps}
              />

              {hasSourceAsset && hasPreviewMedia && !clipModeActive ? (
                <motion.div
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
                            src={previewUrl}
                            muted={isPreviewMuted}
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
                        onHoverStart={() => onSetInlinePreviewStatusHovered(true)}
                        onHoverEnd={() => onSetInlinePreviewStatusHovered(false)}
                        onFocus={() => onSetInlinePreviewStatusHovered(true)}
                        onBlur={() => onSetInlinePreviewStatusHovered(false)}
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
                            sourceStageError ? { rotate: 0, scale: [0.92, 1.02, 0.92] } : { rotate: 360 }
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
                  onPickSource={onPickSource}
                  onDragOver={onInlineSourceDragOver}
                  onDragLeave={onInlineSourceDragLeave}
                  onDrop={onInlineSourceDrop}
                />
              )}

              <div className="pointer-events-none absolute inset-[10%] rounded-[8px] border border-dashed border-white/12" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
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

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 px-8 backdrop-blur-sm">
      <InfinityTrailLoader
        label={isTranscribing ? 'Transcribing source' : 'Analyzing cinematic brief'}
        subtitle={
          isTranscribing
            ? 'Mapping audio patterns and speech timestamps.'
            : 'Extracting motion parameters from your prompt.'
        }
        className="w-full max-w-[320px]"
      />
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {(steps ?? []).map((item) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/68"
          >
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
