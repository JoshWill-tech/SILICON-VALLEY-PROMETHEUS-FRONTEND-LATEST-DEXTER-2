'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  Layers3,
  MessageSquare,
  Music4,
  PenSquare,
  Sparkles,
  Wand2,
  Palette,
  FolderOpen
} from 'lucide-react'

import { AiLampDialog } from '@/components/editor/ai-lamp-dialog'
import { LuxuryVignette } from '@/components/editor/luxury-vignette'
import { EditorLoadingScreen } from '@/components/editor/editor-loading-screen'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { Toolbar } from '@/components/editor/Toolbar'
import { PreviewCanvas } from '@/components/editor/PreviewCanvas'
import { TimelinePanel } from '@/components/editor/TimelinePanel'
import { MusicPanel } from '@/components/editor/MusicPanel'
import { InspectorPanel } from '@/components/editor/InspectorPanel'
import { DownloadDialog } from '@/components/editor/DownloadDialog'
import { EditWorkflowPanel } from '@/components/editor/edit-workflow-panel'
import { ChatWorkspacePanel } from '@/components/editor/chat-workspace-panel'
import { SecondaryPanel } from '@/components/editor/SecondaryPanel'
import { FloatingChatComposer } from '@/components/editor/floating-chat-composer'
import { CommandOverlayShell } from '@/components/editor/command-overlay-shell'
import { DurableJobProgress } from '@/components/editor/durable-job-progress'
import { CinematicErrorBoundary } from '@/components/error-boundaries/CinematicErrorBoundary'

import { useSourceStage } from '@/hooks/use-source-stage'
import { useViralClipJob } from '@/hooks/use-viral-clip-job'
import { useEditorState } from '@/lib/hooks/useEditorState'
import { useVideoEngine, EMPTY_SPLIT_PREVIEW_ASSETS } from '@/lib/hooks/useVideoEngine'
import { useMusicWorkspace } from '@/lib/hooks/useMusicWorkspace'
import { msToTime } from '@/lib/editor-utils'
import { buildRevealVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  createProcessingJob,
  startProcessing,
  upsertProject,
  setJobAnimationPlan,
} from '@/lib/mock'
import {
  VIRAL_CLIP_COUNT_PRESETS,
} from '@/lib/constants'
import {
  buildVideoMusicContext,
  buildMusicRecommendationSet,
  buildProvidedTranscript,
  buildViralClipQuickActionPrompt,
  selectEditStyleTemplate,
  buildEditQuickActionPrompt,
  buildFallbackEditAnimationPlan,
} from '@/lib/editor-handlers'
import { MUSIC_CATALOG } from '@/lib/music-catalog'
import { buildEditDNAProfile } from '@/lib/editorial-frame/edit-dna-router'
import { compileEditBrief } from '@/lib/editorial-frame/edit-brief-compiler'
import { formatSourceProfileMetric } from '@/lib/media/source-profile'
import { setSessionSourcePreview } from '@/lib/source-preview-session'
import { getStoredSourceAssetFile } from '@/lib/source-asset-store'
import { normalizeUxError } from '@/lib/ux/errors'
import { toast } from 'sonner'

import type { 
  StyleTemplate, 
  CreativeMetadata, 
  PreviewMediaKind,
  Project,
  HeaderNavMode,
  BottomMode,
  LeftTabKey
} from '@/lib/types'
import type { WorkspaceNavItem } from '@/components/ui/anime-navbar'

const HEADER_NAV_ITEMS: WorkspaceNavItem[] = [
  { name: 'Motion', icon: Sparkles },
  { name: 'Music', icon: Music4 },
  { name: 'Output', icon: Layers3 },
]

const LEFT_TABS = [
  { key: 'chat' as LeftTabKey, label: 'Chat', icon: MessageSquare },
  { key: 'edit' as LeftTabKey, label: 'Edit', icon: PenSquare },
  { key: 'design' as LeftTabKey, label: 'Design', icon: Palette },
  { key: 'assets' as LeftTabKey, label: 'Assets', icon: FolderOpen },
]

const INLINE_SOURCE_MAX_BYTES = 3 * 1024 * 1024 * 1024

function validateInlineSourceFile(file: File) {
  if (!file.type.startsWith('video/')) {
    return 'That file type is not supported here. Upload an MP4, MOV, or WEBM video.'
  }

  if (file.size > INLINE_SOURCE_MAX_BYTES) {
    return 'That video is over the 3GB editor limit. Choose a smaller source for this workspace.'
  }

  return null
}

export default function EditorPage() {
  const editorState = useEditorState()
  const {
    projectId, project, setProject, job, setJob, setCurrentJobId, saveStatus, isEditorBootReady,
    leftTab, setLeftTab, activeWorkspaceTab, bottomMode, setBottomMode, isEditingTitle,
    tempTitle, setTempTitle, latestExport, isLeftPanelCollapsed, setIsLeftPanelCollapsed,
    isDeferredChromeReady, isAiLampOpen, setIsAiLampOpen, isExporting, isDownloading, setIsDownloading,
    isDownloadDialogOpen, setIsDownloadDialogOpen, sourceAssetLabel, cinematicRegistry,
    viralClipTargetPlatform, titleInputRef, chatComposerPortal, setChatComposerPortal,
    musicSpotlightPortalTarget, setMusicSpotlightPortalTarget, inspectorViewportRef,
    handleWorkspaceTabChange, handleTitleStartEdit, handleTitleSave, handleTitleKeyDown,
    handleBackNavigation, handleAiChatOpen, handleAiMusicOpen, handleAutoSave,
    handleAutoSaveAnimationPlan, handlePrepareExport, progressPercent,
    currentJobId, jobStatus, jobError, jobProgress, jobConnectionState,
    // Chat / Command Overlay
    chatDraft, setChatDraft, isComposerOpen, setIsComposerOpen,
    isCommandOverlayOpen, setIsCommandOverlayOpen, queuedPreviewRevision,
    pendingReplies, handleComposerSubmit, handleOverlaySubmit, stopPendingReplies, clearQueuedPreviewRevision
  } = editorState

  const {
    phase: sourceStagePhase, error: sourceStageError, stageSource: stageSourceFile,
    previewKind: stagedPreviewKind,
  } = useSourceStage({ currentPreviewUrl: null, currentPreviewKind: null })

  const videoEngine = useVideoEngine(
    projectId, project, job, setProject, setJob, handleAutoSaveAnimationPlan, 
    cinematicRegistry, sourceStageError, sourceStagePhase
  )

  const {
    previewPlaying, previewDurationSec, previewCurrentTimeSec, setPreviewCurrentTimeSec,
    setPreviewDurationSec, setPreviewIntrinsicAspectRatio, persistedPreviewUrl, handoffPreview,
    setHandoffPreview, isPreviewMediaReady, setIsPreviewMediaReady, isPreviewLoadingVisible,
    isPreviewMuted, setIsPreviewMuted, previewFramePreset, setPreviewFramePreset, fitMode,
    setFitMode, scale, setScale, offsetX, setOffsetX, offsetY, setOffsetY, isInlineSourceDragOver,
    setIsInlineSourceDragOver, viralClipSplitPreviewActive, setViralClipSplitPreviewActive,
    previewVideoRef, previewPlaybackIntentRef, previewPlaybackCommandRef, clearPreviewToggleCooldown,
    startPreviewPlayback, togglePreviewPlayback, handlePreviewMetadataLoaded, handlePreviewVideoReady,
    handlePreviewTimeUpdate, handlePreviewEnded, handlePreviewVideoPlay, handlePreviewVideoPause,
    handlePreviewVideoError, handlePreviewImageLoaded, handlePreviewSeek, handleRestoreLandscapePreview,
    resolvedPreviewAspectRatio, previewFrameTransformStyle, isPreviewBriefGenerating,
    setIsPreviewBriefGenerating, showPreviewFeedback, setShowPreviewFeedback, viralClipClipPresetIndex,
    viralClipSplitAnimationKey, setViralClipSplitAnimationKey, viralClipSplitPreviewAssets,
    setViralClipSplitPreviewAssets, isLockedViralClipTriggerHovered, setIsLockedViralClipTriggerHovered,
    previousPreviewFramePresetRef, previousFitModeRef, sourceFileInputRef, inlinePreviewStatusVariant,
    inlinePreviewStatusHovered, setInlinePreviewStatusHovered, ensureViralClipSplitPreviewAssets,
  } = videoEngine

  const {
    selectedEditorMusicTrackId, handleEditorMusicTrackSelect, stagedTracks, musicPreviewVolume, activePreviewTrack,
    handleMusicPreviewVolumeChange, removeStagedTrack, clearStagedTracks, togglePreviewTrack, stageTrack
  } = useMusicWorkspace(projectId)

  // Derived State
  const transportDurationSec = previewDurationSec > 0 ? previewDurationSec : 48
  const transportProgress = transportDurationSec > 0 ? (previewCurrentTimeSec / transportDurationSec) * 100 : 0
  const transportCurrentTime = msToTime(previewCurrentTimeSec * 1000)
  const transportTime = msToTime(transportDurationSec * 1000)
  const previewUrl = persistedPreviewUrl || handoffPreview?.url || project?.thumbnailUrl || ''
  const previewKind = (handoffPreview?.kind ?? stagedPreviewKind ?? project?.previewKind ?? 'video') as PreviewMediaKind
  const shouldUseLegacySessionPreviewSurface = Boolean(handoffPreview?.url) && previewKind === 'video'
  const hasPreviewMedia = Boolean(previewUrl)
  const clipModeActive = previewFramePreset === '9:16'
  
  const viralClipJob = useViralClipJob({ projectId, videoId: project?.sourceAssetId ?? null })
  const viralClipTriggerBusy = ['submitting', 'submitted', 'polling'].includes(viralClipJob.lifecycle)
  const showViralClipSplitPreview = viralClipSplitPreviewActive && clipModeActive && hasPreviewMedia

  const showInlinePreviewStatus = hasPreviewMedia && inlinePreviewStatusVariant !== 'hidden'
  const isInlinePreviewStatusExpanded = inlinePreviewStatusVariant === 'expanded' || inlinePreviewStatusHovered
  const inlinePreviewStatusLabel = sourceStageError ? normalizeUxError(sourceStageError, 'upload') : sourceStagePhase === 'staging_local_preview' ? 'Preparing the new source preview' : sourceStagePhase === 'persisting' ? 'Saving the source in the background' : null
  const sourceMetrics = project?.sourceProfile ? formatSourceProfileMetric(project.sourceProfile) : null
  const visiblePreviewAspectRatio = showViralClipSplitPreview ? 2.24 : resolvedPreviewAspectRatio
  const previewFrameWidth = `min(100%, calc((clamp(250px, 40vh, 460px) - 2rem) * ${visiblePreviewAspectRatio.toFixed(4)}))`

  const promptText = job?.input.prompt?.trim() || 'Your clip is staged and ready for refinement.'
  const sourceList = React.useMemo(() => job?.input.sources ?? [], [job?.input.sources])
  const videoContext = React.useMemo(() => buildVideoMusicContext({ projectTitle: project?.title ?? 'Untitled Project', promptText, sourceProfile: project?.sourceProfile ?? null, job, sourceList }), [job, project?.sourceProfile, project?.title, promptText, sourceList])
  const editorMusicShelf = React.useMemo(() => buildMusicRecommendationSet({ query: promptText, projectTitle: project?.title ?? 'Untitled Project', initialPrompt: promptText, videoContext, limit: 5, catalog: MUSIC_CATALOG }), [project?.title, promptText, videoContext])
  const editorMusicRecommendations = React.useMemo(() => editorMusicShelf.recommendations.slice(0, 5), [editorMusicShelf])
  const viralClipClipPreset = VIRAL_CLIP_COUNT_PRESETS[viralClipClipPresetIndex] ?? VIRAL_CLIP_COUNT_PRESETS[1]!
  const viralClipPrompt = React.useMemo(() => buildViralClipQuickActionPrompt({ projectTitle: project?.title ?? 'Untitled Project', originalPrompt: promptText, sourceCount: sourceList.length, transportTime, videoContext }), [project?.title, promptText, sourceList.length, transportTime, videoContext])
  const previewOverlayPlan = job?.artifacts.animationPlan ?? null
  const currentSplitPreviewAssets = viralClipSplitPreviewAssets.sourceAssetId === (project?.sourceAssetId ?? null) ? viralClipSplitPreviewAssets : EMPTY_SPLIT_PREVIEW_ASSETS

  // Logic Handlers
  const handleGenerateViralClips = async () => {
    if (!project?.sourceAssetId) { setViralClipSplitPreviewActive(false); setPreviewFramePreset('source'); toast.error('Add a source video first.'); return }
    try {
      if (!viralClipSplitPreviewActive) { previousFitModeRef.current = fitMode; previousPreviewFramePresetRef.current = previewFramePreset }
      setFitMode('fill'); setPreviewFramePreset('9:16'); setViralClipSplitPreviewActive(true); setViralClipSplitAnimationKey((c) => c + 1)
      const sourceVideoFile = await getStoredSourceAssetFile(project.sourceAssetId).catch(() => null)
      const splitPreviewPromise = ensureViralClipSplitPreviewAssets(project.sourceAssetId, sourceVideoFile)
      const [vResult, sResult] = await Promise.allSettled([ viralClipJob.startJob({ projectId, videoId: project.sourceAssetId, targetPlatform: viralClipTargetPlatform, clipCountMin: viralClipClipPreset.min, clipCountMax: viralClipClipPreset.max, prompt: viralClipPrompt, sourceMediaRef: project.sourceAssetId, creatorNiche: videoContext.summary || undefined, metadataOverrides: { projectTitle: project?.title ?? 'Untitled Project', sourceAssetId: project.sourceAssetId, previewKind: project?.previewKind ?? null, sourceProfileMetric: sourceMetrics, sourceProfile: project?.sourceProfile ?? null, clipMode: 'viral', targetPlatform: viralClipTargetPlatform, clipCountMin: viralClipClipPreset.min, clipCountMax: viralClipClipPreset.max }, providedTranscript: JSON.stringify(buildProvidedTranscript(job)) }, { sourceVideoFile }), splitPreviewPromise ])
      if (vResult.status === 'rejected') throw vResult.reason
      if (sResult.status === 'rejected') { const err = sResult.reason instanceof Error ? sResult.reason.message : 'Split reel generation failed.'; setViralClipSplitPreviewAssets({ sourceAssetId: project.sourceAssetId, status: 'error', leftUrl: null, rightUrl: null, errorMessage: err }); toast.error(err) }
      toast.success('Viral clip job submitted.')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to launch job.') }
  }

  const handleEditRequest = React.useCallback((request: { prompt: string; styleTemplate: StyleTemplate; metadata?: CreativeMetadata }) => {
    if (!project?.sourceAssetId) { toast.error('Add a source video first.'); return }
    const prompt = request.prompt.trim(); if (!prompt) return
    const editDNA = buildEditDNAProfile(request.metadata); const editBrief = compileEditBrief({ metadata: request.metadata, editDNA, transcriptText: job?.transcriptText, transcriptStatus: job?.transcriptStatus, videoDurationSeconds: project?.sourceProfile?.inspection.durationSec ?? undefined, projectTitle: project?.title })
    const nextJob = createProcessingJob({ projectId, input: { prompt, sources: sourceList, styleId: request.styleTemplate.id, metadata: request.metadata, editDNA } })
    nextJob.editBrief = editBrief; nextJob.previewProgressSteps = editBrief.progressSteps
    const startedJob = startProcessing(nextJob)
    void fetch('/api/jobs/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, type: 'ai_enhancement', metadata: { input: nextJob.input, editBrief: nextJob.editBrief, previewProgressSteps: nextJob.previewProgressSteps, artifacts: nextJob.artifacts, transcriptStatus: nextJob.transcriptStatus, transcriptText: nextJob.transcriptText } }) }).then(res => res.json()).then(data => { if (data.id) setCurrentJobId(data.id) }).catch(err => console.error('Failed to create durable job:', err))
    const fallbackPlan = buildFallbackEditAnimationPlan({ projectId, projectTitle: project?.title ?? 'Untitled Project', prompt, jobId: nextJob.id, sourceLabel: sourceAssetLabel ?? project?.title ?? null, styleTemplate: request.styleTemplate })
    const jobWithFallbackPlan = setJobAnimationPlan(projectId, fallbackPlan) ?? startedJob
    setJob(jobWithFallbackPlan); previewPlaybackIntentRef.current = 'paused'; previewPlaybackCommandRef.current += 1; clearPreviewToggleCooldown()
    if (previewKind === 'video' && previewUrl) void startPreviewPlayback()
    toast.success(`Edit job ${nextJob.id.slice(0, 6)} started.`)
  }, [projectId, project, job, sourceList, sourceAssetLabel, previewKind, previewUrl, setCurrentJobId, setJob, startPreviewPlayback, clearPreviewToggleCooldown, previewPlaybackIntentRef, previewPlaybackCommandRef])

  const handleAiEditLaunch = React.useCallback((label: string) => {
    const styleTemplate = selectEditStyleTemplate(label, videoContext); const editPrompt = buildEditQuickActionPrompt(project?.title ?? 'Untitled Project', videoContext, styleTemplate); const prompt = label === 'Edit this video' ? editPrompt : `${label}. ${editPrompt}`
    setIsAiLampOpen(false); setIsLeftPanelCollapsed(false); setLeftTab('chat'); handleWorkspaceTabChange('Motion'); setBottomMode('Original'); handleEditRequest({ prompt, styleTemplate })
  }, [handleEditRequest, project?.title, videoContext, setIsAiLampOpen, setIsLeftPanelCollapsed, setLeftTab, handleWorkspaceTabChange, setBottomMode])

  const handleInlineSourceSelection = React.useCallback(async (files: File[]) => {
    const file = files[0]; if (!file || !project) return
    const validationError = validateInlineSourceFile(file)
    if (validationError) {
      toast.error('Source rejected', { description: validationError })
      return
    }

    try {
      const stagedSource = await stageSourceFile(file, { allowedMediaKinds: ['video'] }); if (!stagedSource) return
      setSessionSourcePreview({ projectId, file, previewKind: stagedSource.previewKind ?? 'video', sourceAssetId: stagedSource.assetId })
      
      // Update backend
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceAssetId: stagedSource.assetId,
          previewKind: stagedSource.previewKind ?? 'video',
          sourceProfile: stagedSource.sourceProfile,
        }),
      })

      if (!res.ok) throw new Error('Failed to update project with new source')
      const { project: updatedProject } = await res.json()

      upsertProject(updatedProject); setProject(updatedProject)
      previewPlaybackIntentRef.current = 'paused'; previewPlaybackCommandRef.current += 1; setPreviewCurrentTimeSec(0); setPreviewDurationSec(0); setPreviewIntrinsicAspectRatio(null); setPreviewFramePreset('source'); setViralClipSplitPreviewActive(false)
      toast.success('Source video uploaded')
    } catch (error) { 
      console.error('Failed to stage source:', error)
      toast.error('Unable to stage video', { description: normalizeUxError(error, 'upload') })
    }
  }, [project, projectId, stageSourceFile, setProject, setPreviewCurrentTimeSec, setPreviewDurationSec, setPreviewIntrinsicAspectRatio, setPreviewFramePreset, setViralClipSplitPreviewActive, previewPlaybackIntentRef, previewPlaybackCommandRef])

  const handleConfirmDownload = async () => {
    if (!latestExport) return; setIsDownloadDialogOpen(false); setIsDownloading(true)
    try {
      const res = await fetch(`/api/exports/${latestExport.id}/download-url`); const data = await res.json()
      if (!res.ok) throw new Error(data.error); const link = document.body.appendChild(document.createElement('a')); link.href = data.download?.url || data.downloadUrl; link.setAttribute('download', data.download?.filename || 'export.mp4'); link.click(); link.remove(); toast.success('Download started')
    } catch (err) { toast.error('Could not download file') } finally { setIsDownloading(false) }
  }

  const aiLampActions = React.useMemo(() => [
    { label: 'Open chat lane', description: 'Jump into the editorial conversation.', icon: MessageSquare, onSelect: handleAiChatOpen },
    { label: 'Edit this video', description: 'Launch a polished first pass.', icon: PenSquare, onSelect: () => handleAiEditLaunch('Edit this video') },
    { label: 'Generate rough cuts', description: 'Start a faster structure pass.', icon: Wand2, onSelect: () => handleAiEditLaunch('Generate rough cuts') },
    { label: 'Add music', description: 'Open the soundtrack chamber.', icon: Music4, onSelect: handleAiMusicOpen },
  ], [handleAiChatOpen, handleAiEditLaunch, handleAiMusicOpen])

  const openInlineSourcePicker = React.useCallback(() => sourceFileInputRef.current?.click(), [sourceFileInputRef])

  if (!isEditorBootReady) return <EditorLoadingScreen caption="Opening editor..." />

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#07070a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(84,69,126,0.24)_0%,rgba(84,69,126,0.08)_24%,rgba(7,7,10,0)_56%),linear-gradient(180deg,rgba(16,14,24,0.72)_0%,rgba(7,7,10,1)_42%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_44px] opacity-[0.06]" aria-hidden />

      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <EditorHeader
          project={project} job={job} saveStatus={saveStatus} progressPercent={progressPercent} isEditingTitle={isEditingTitle} tempTitle={tempTitle} setTempTitle={setTempTitle} titleInputRef={titleInputRef} activeWorkspaceTab={activeWorkspaceTab} isDeferredChromeReady={isDeferredChromeReady} isExporting={isExporting} isDownloading={isDownloading} latestExport={latestExport} hasSourceAsset={Boolean(project?.sourceAssetId)} headerNavItems={HEADER_NAV_ITEMS} onBack={handleBackNavigation} onTitleSave={handleTitleSave} onTitleKeyDown={handleTitleKeyDown} onTitleStartEdit={handleTitleStartEdit} onWorkspaceTabChange={handleWorkspaceTabChange} onPrepareExport={handlePrepareExport} onDownload={() => setIsDownloadDialogOpen(true)}
        />

        <main className="relative z-20 mx-auto flex min-h-0 w-full max-w-[1580px] flex-1 overflow-hidden px-3 py-3 lg:px-5 lg:py-4 xl:px-6">
          <div className={cn('grid h-full min-h-0 w-full grid-rows-[minmax(0,1fr)] items-stretch gap-[clamp(0.75rem,1vw,1rem)] overflow-hidden', isLeftPanelCollapsed ? 'lg:grid-cols-[84px_minmax(0,1fr)] xl:grid-cols-[84px_minmax(0,1fr)_clamp(17rem,20vw,20.5rem)]' : 'lg:grid-cols-[clamp(17rem,22vw,19.75rem)_minmax(0,1fr)] xl:grid-cols-[clamp(17rem,22vw,19.75rem)_minmax(0,1fr)_clamp(17rem,20vw,20.5rem)]')}>
            <motion.aside layout className={cn('premium-ambient-panel premium-vignette-surface flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#131317] overscroll-contain transition-all duration-300', isLeftPanelCollapsed && 'lg:rounded-[26px]')}>
              <LuxuryVignette tone="neutral" />
              <div className="border-b border-white/8 px-4 py-4 flex items-center justify-between gap-2">
                {!isLeftPanelCollapsed && <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">{LEFT_TABS.map(({ key, label, icon: Icon }) => (<button key={key} type="button" onClick={() => setLeftTab(key)} aria-label={label} className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors', leftTab === key ? 'border border-white/10 bg-white/[0.08] text-white' : 'border border-transparent text-white/48 hover:bg-white/[0.04]')}> <Icon className="size-4" /> </button>))}</div>}
                <button type="button" onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)} className="grid size-9 place-items-center rounded-full border border-white/8 bg-white/[0.03] text-white/48">{isLeftPanelCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
              </div>
              <AnimatePresence mode="wait">
                {!isLeftPanelCollapsed && <motion.div key={leftTab} variants={buildRevealVariants({ delay: 0.12, distance: 16, blur: 10 })} initial="hidden" animate="visible" exit="exit" className="min-h-0 flex-1 overflow-hidden">{leftTab === 'edit' ? <EditWorkflowPanel projectTitle={project?.title ?? ''} sourceLabel={sourceAssetLabel} job={job} /> : leftTab === 'design' ? <SecondaryPanel title="Visual DNA" description="Tuning the typographic beats and color palette." items={['Restrained typography', 'Golden ratio scaling', 'Natural skin tones']} /> : leftTab === 'assets' ? <SecondaryPanel title="Cinematic Assets" description="External media and preset motion templates." items={['Background washes', 'Geometric framing', 'Lens aberrations']} /> : <ChatWorkspacePanel key={projectId} projectId={projectId} projectTitle={project?.title ?? ''} initialPrompt={promptText} initialSources={sourceList} videoContext={videoContext} composerPortalTarget={showViralClipSplitPreview || activeWorkspaceTab === 'Music' ? null : chatComposerPortal} musicSpotlightPortalTarget={isDeferredChromeReady ? musicSpotlightPortalTarget : null} onEditRequest={handleEditRequest} initialEditorState={project?.editorState} onSave={handleAutoSave} stagedTracks={stagedTracks} musicPreviewVolume={musicPreviewVolume} activePreviewTrack={activePreviewTrack} previewPlaying={previewPlaying} onMusicVolumeChange={handleMusicPreviewVolumeChange} onRemoveTrack={removeStagedTrack} onClearAll={clearStagedTracks} onPreviewToggle={togglePreviewTrack} onStageTrack={stageTrack} />}</motion.div>}
              </AnimatePresence>
            </motion.aside>

            <section className="premium-ambient-panel premium-vignette-surface relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#111115]">
              <LuxuryVignette tone={activeWorkspaceTab === 'Music' ? 'music' : 'cool'} />
              <Toolbar activeWorkspaceTab={activeWorkspaceTab} clipModeActive={clipModeActive} viralClipTriggerBusy={viralClipTriggerBusy} onLockedHoverChange={setIsLockedViralClipTriggerHovered} onGenerateViralClips={handleGenerateViralClips} onOpenAiLamp={() => setIsAiLampOpen(true)} />
              <div className={cn('flex min-h-0 flex-1 flex-col px-4 py-3', activeWorkspaceTab === 'Music' ? 'overflow-hidden' : 'overflow-y-auto')}>
                <MusicPanel activeWorkspaceTab={activeWorkspaceTab} editorMusicRecommendations={editorMusicRecommendations} project={project} selectedEditorMusicTrackId={selectedEditorMusicTrackId} onSelectTrack={handleEditorMusicTrackSelect} />
                <CinematicErrorBoundary
                  scope="render"
                  title="Preview renderer paused"
                  description="The editor shell stayed online while the preview surface recovered."
                  resetLabel="Retry preview"
                >
                  <PreviewCanvas projectId={projectId} project={project} job={job} activeWorkspaceTab={activeWorkspaceTab} hasSourceAsset={Boolean(project?.sourceAssetId)} hasPreviewMedia={Boolean(previewUrl)} clipModeActive={clipModeActive} sourceAssetLabel={sourceAssetLabel} previewOverlayPlan={previewOverlayPlan} previewCurrentTimeSec={previewCurrentTimeSec} showViralClipSplitPreview={showViralClipSplitPreview} viralClipSplitAnimationKey={viralClipSplitAnimationKey} previewUrl={previewUrl} previewKind={previewKind} previewPlaying={previewPlaying} shouldUseLegacySessionPreviewSurface={shouldUseLegacySessionPreviewSurface} previewFrameTransformStyle={previewFrameTransformStyle} fitMode={fitMode} currentSplitPreviewAssets={currentSplitPreviewAssets} isLockedViralClipTriggerHovered={isLockedViralClipTriggerHovered} isPreviewMuted={isPreviewMuted} isPreviewMediaReady={isPreviewMediaReady} isPreviewLoadingVisible={isPreviewLoadingVisible} isPreviewBriefGenerating={isPreviewBriefGenerating} showPreviewFeedback={showPreviewFeedback} showInlinePreviewStatus={showInlinePreviewStatus} sourceStageError={sourceStageError ? normalizeUxError(sourceStageError, 'upload') : null} inlinePreviewStatusLabel={inlinePreviewStatusLabel} isInlinePreviewStatusExpanded={isInlinePreviewStatusExpanded} isInlineSourceDragOver={isInlineSourceDragOver} visiblePreviewAspectRatio={visiblePreviewAspectRatio} previewFrameWidth={previewFrameWidth} musicSpotlightPortalRef={setMusicSpotlightPortalTarget} sourceFileInputRef={sourceFileInputRef} previewVideoRef={previewVideoRef} onInlineSourceFileInputChange={(e) => handleInlineSourceSelection(Array.from(e.target.files ?? []))} onRestoreLandscape={handleRestoreLandscapePreview} onPreviewImageLoaded={handlePreviewImageLoaded} onPreviewMetadataLoaded={handlePreviewMetadataLoaded} onPreviewVideoReady={handlePreviewVideoReady} onPreviewTimeUpdate={handlePreviewTimeUpdate} onPreviewEnded={handlePreviewEnded} onPreviewVideoPlay={handlePreviewVideoPlay} onPreviewVideoPause={handlePreviewVideoPause} onPreviewVideoError={handlePreviewVideoError} onTogglePreviewPlayback={togglePreviewPlayback} onSetIsPreviewBriefGenerating={setIsPreviewBriefGenerating} onSetShowPreviewFeedback={setShowPreviewFeedback} onSetInlinePreviewStatusHovered={setInlinePreviewStatusHovered} onPickSource={openInlineSourcePicker} onInlineSourceDragOver={(e) => { e.preventDefault(); setIsInlineSourceDragOver(true) }} onInlineSourceDragLeave={() => setIsInlineSourceDragOver(false)} onInlineSourceDrop={(e) => { e.preventDefault(); setIsInlineSourceDragOver(false); handleInlineSourceSelection(Array.from(e.dataTransfer.files ?? [])) }} />
                </CinematicErrorBoundary>
                <TimelinePanel activeWorkspaceTab={activeWorkspaceTab} previewKind={previewKind} previewUrl={previewUrl} previewPlaying={previewPlaying} transportCurrentTime={transportCurrentTime} transportTime={transportTime} transportProgress={transportProgress} isPreviewMuted={isPreviewMuted} project={project} bottomMode={bottomMode} onTogglePlayback={togglePreviewPlayback} onSeek={handlePreviewSeek} onToggleMute={() => setIsPreviewMuted(!isPreviewMuted)} onSetBottomMode={setBottomMode} />
              </div>
            </section>

            <InspectorPanel inspectorViewportRef={inspectorViewportRef} project={project} job={job} previewFramePreset={previewFramePreset} clipModeActive={clipModeActive} fitMode={fitMode} scale={scale} offsetX={offsetX} offsetY={offsetY} sourceMetrics={sourceMetrics} hasSourceAsset={Boolean(project?.sourceAssetId)} sourceStageError={sourceStageError} previewKind={previewKind} transportTime={transportTime} promptText={promptText} previewOverlayPlan={previewOverlayPlan} bottomMode={bottomMode} onSetViralClipSplitPreviewActive={setViralClipSplitPreviewActive} onSetPreviewFramePreset={setPreviewFramePreset} onPreviewFrameLabel={(p) => p === 'source' ? 'Source' : p} onSetFitMode={setFitMode} onSetScale={setScale} onSetOffsetX={setOffsetX} onSetOffsetY={setOffsetY} onPickSource={openInlineSourcePicker} />
          </div>
        </main>
      </div>

      <AiLampDialog open={isAiLampOpen} onOpenChange={setIsAiLampOpen} badge="Prometheus AI" title="Shape the next pass" description="Call up a directed AI lane for this project without leaving the chamber." actions={aiLampActions} />
      <DownloadDialog isOpen={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen} project={project} onConfirmDownload={handleConfirmDownload} isDownloading={isDownloading} />
      
      {chatComposerPortal ? createPortal(
        <>
          <FloatingChatComposer
            projectId={projectId}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            onSubmit={handleComposerSubmit}
            onStop={stopPendingReplies}
            loading={pendingReplies > 0}
            isOpen={isComposerOpen}
            onOpenChange={setIsComposerOpen}
            onOpenCommandOverlay={() => setIsCommandOverlayOpen(true)}
            queuedPreviewRevision={queuedPreviewRevision}
            onClearQueuedPreview={clearQueuedPreviewRevision}
          />

          <CommandOverlayShell 
            open={isCommandOverlayOpen}
            onOpenChange={setIsCommandOverlayOpen}
            initialPrompt={chatDraft}
            onSubmit={(data) => {
              const submission = {
                rawText: data.prompt,
                analysis: {
                  rawText: data.prompt,
                  displayText: data.prompt,
                  cleanInstructionText: data.prompt,
                  triggerText: null,
                  triggerState: 'inactive' as const,
                  triggerStartIndex: null,
                  triggerEndIndex: null,
                  frameTarget: null,
                  frameText: null,
                  referenceText: null,
                  referenceStartIndex: null,
                  referenceEndIndex: null,
                  isActive: false,
                  isPartial: false,
                  isValid: true,
                  validationNote: null,
                },
                revisionRequest: {
                  rawText: data.prompt,
                  displayText: data.prompt,
                  instructionText: data.prompt,
                  frameTarget: null,
                  matchedRegionId: null,
                  matchedRegionLabel: null,
                  selectedRegionMetadata: null,
                  previewThumbnailUrl: null,
                  attachments: [],
                  intent: 'generic_revision' as const,
                  metadata: data.metadata,
                }
              }
              void handleOverlaySubmit(submission)
            }}
          />

          <DurableJobProgress
            status={(jobStatus as any) || 'idle'}
            progress={jobProgress}
            type="ai_enhancement"
            errorMessage={jobError}
            connectionState={jobConnectionState as any}
            className="fixed bottom-24 right-6 z-50 w-[320px]"
          />
        </>,
        chatComposerPortal
      ) : null}

      <div ref={setChatComposerPortal} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-0 w-0" />
    </div>
  )
}
