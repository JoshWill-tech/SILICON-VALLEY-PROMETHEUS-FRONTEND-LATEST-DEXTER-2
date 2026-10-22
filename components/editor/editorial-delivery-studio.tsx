'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDownToLine, Check, Columns2, Film, LoaderCircle, Plus, RefreshCw, Type, X, Sparkles, Wand2, SlidersHorizontal } from 'lucide-react'
import type { ProjectExport } from '@/lib/types'
import type { EditorialCue } from '@/lib/editor/editorial-timeline-state'
import { useEditorialTimeline } from '@/hooks/use-editorial-timeline'
import { canSubmitSourceRender, isPlayableRender, projectRenderHistory, renderDownloadPath, renderPreviewPath, type SourceUploadStatus } from '@/lib/editor/render-delivery'
import { downloadMedia } from '@/lib/editor/browser-download'
import { VideoAnnotateButton, VideoReviewDownloadButton, VideoReviewProvider, VideoReviewToolbar } from '@/components/editor/video-review-annotations'
import { registerVoiceCompanionBridge } from '@/lib/voice-companion/bridge'
import { useMiniRunDraftStore } from '@/lib/editor/mini-run-draft-store'
import { miniRun } from '@/lib/api/mini-run'
import mobileWorkspaceStyles from '@/components/editor/mobile-editor-workspace.module.css'

type TextTreatment = {
  fontFamily: string
  fontSizePx: number
  maxWidthPct: number
  xPct: number
  yPct: number
  animation: string
}

type RenderStartResult = {success: boolean; summary: string; renderInitiated: boolean}

const fonts = ['Inter', 'Arial', 'Georgia', 'Impact', 'Courier New']
const animations = ['none', 'fade', 'rise', 'pop', 'typewriter']
const defaultTreatment: TextTreatment = {
  fontFamily: 'Inter', fontSizePx: 48, maxWidthPct: 80, xPct: 50, yPct: 80, animation: 'fade',
}

function textTreatmentOf(cue: EditorialCue | undefined): TextTreatment {
  const raw = cue?.context?.textStyle
  const saved = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
  return {
    fontFamily: typeof saved.fontFamily === 'string' && fonts.includes(saved.fontFamily) ? saved.fontFamily : defaultTreatment.fontFamily,
    fontSizePx: typeof saved.fontSizePx === 'number' ? saved.fontSizePx : defaultTreatment.fontSizePx,
    maxWidthPct: typeof saved.maxWidthPct === 'number' ? saved.maxWidthPct : defaultTreatment.maxWidthPct,
    xPct: typeof saved.xPct === 'number' ? saved.xPct : defaultTreatment.xPct,
    yPct: typeof saved.yPct === 'number' ? saved.yPct : defaultTreatment.yPct,
    animation: typeof saved.animation === 'string' && animations.includes(saved.animation) ? saved.animation : defaultTreatment.animation,
  }
}

function dateLabel(value: string) {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString() : 'Unknown date'
}

function renderProgress(record: ProjectExport | undefined): number | null {
  const metadata = record?.metadata
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const progress = (metadata as Record<string, unknown>).progressPercent
  return typeof progress === 'number' && Number.isFinite(progress) && progress >= 0 && progress <= 100
    ? Math.round(progress)
    : null
}

export function EditorialDeliveryStudio({
  projectId, sourceAssetId, sourceUrl, projectTitle, currentTimeSec, durationSec, presentation = 'studio', sourceUploadStatus = 'ready',
}: {
  projectId: string
  sourceAssetId: string | null
  sourceUrl: string | null
  projectTitle: string
  currentTimeSec: number
  durationSec: number
  presentation?: 'studio' | 'preview'
  sourceUploadStatus?: SourceUploadStatus
}) {
  const editorial = useEditorialTimeline()
  const prefersReducedMotion = useReducedMotion()
  const [records, setRecords] = React.useState<ProjectExport[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [selectedCueId, setSelectedCueId] = React.useState<string | null>(null)
  const [text, setText] = React.useState('')
  const [treatment, setTreatment] = React.useState<TextTreatment>(defaultTreatment)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [historyError, setHistoryError] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState(false)
  const [comparisonOpen, setComparisonOpen] = React.useState(false)
  const refreshSequenceRef = React.useRef(0)
  const submissionInFlightRef = React.useRef(false)
  const comparisonSourceRef = React.useRef<HTMLVideoElement>(null)
  const comparisonRenderRef = React.useRef<HTMLVideoElement>(null)

  const [creativeBias, setCreativeBias] = React.useState<'balanced' | 'broll' | 'vox' | 'kinetic' | 'custom'>('balanced')
  const [customPrompt, setCustomPrompt] = React.useState('')
  const [aiInstruction, setAiInstruction] = React.useState('')
  const [isApplyingAi, setIsApplyingAi] = React.useState(false)
  const [aiDiffSummary, setAiDiffSummary] = React.useState<{ summary: string; changes: any[]; modelUsed?: string } | null>(null)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const draftState = useMiniRunDraftStore()

  const effectivePrompt = React.useMemo(() => {
    switch (creativeBias) {
      case 'broll':
        return 'Bias heavily towards cinematic B-roll cutaways, visual overlays, and context-relevant stock footage.'
      case 'vox':
        return 'Vox explainer animation style with elevated motion graphics density, visual charts, and kinetic text animations.'
      case 'kinetic':
        return 'Fast-paced kinetic typography with rapid jump zooms, punchy transitions, and dynamic sound effects.'
      case 'custom':
        return customPrompt.trim()
      case 'balanced':
      default:
        return customPrompt.trim() ? customPrompt.trim() : undefined
    }
  }, [creativeBias, customPrompt])

  const cues = editorial.timeline?.cues ?? []
  const textCues = cues.filter((cue) => cue.type === 'text')
  const selectedCue = textCues.find((cue) => cue.id === selectedCueId) ?? textCues[0]
  const history = sourceAssetId ? projectRenderHistory(records, projectId, sourceAssetId) : []
  const completedRecords = history.filter((record) => isPlayableRender(record, projectId, sourceAssetId ?? ''))
  const selectedRecord = completedRecords.find((record) => record.id === selectedId) ?? completedRecords[0]
  const finishedRecord = selectedRecord && sourceAssetId && isPlayableRender(selectedRecord, projectId, sourceAssetId) ? selectedRecord : null
  const pendingRecord = history.find((record) => record.status === 'pending' || record.status === 'processing')
  const latestRecord = history[0]
  const pendingProgress = renderProgress(pendingRecord)

  React.useEffect(() => {
    if (!comparisonOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setComparisonOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [comparisonOpen])

  const refresh = React.useCallback(async () => {
    const requestSequence = ++refreshSequenceRef.current
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/exports/history`, {cache: 'no-store'})
      const payload = await response.json() as {exports?: ProjectExport[]; error?: string}
      if (!response.ok) throw new Error(payload.error || 'Unable to load renders.')
      if (requestSequence !== refreshSequenceRef.current) return
      setRecords(Array.isArray(payload.exports) ? payload.exports : [])
      setHistoryError(null)
    } catch (cause) {
      if (requestSequence !== refreshSequenceRef.current) return
      setHistoryError(cause instanceof Error ? cause.message : 'Unable to load renders.')
    }
  }, [projectId])

  React.useEffect(() => {
    setRecords([])
    setSelectedId(null)
    void refresh()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 5000)
    return () => {
      window.clearInterval(timer)
      refreshSequenceRef.current += 1
    }
  }, [projectId, sourceAssetId, refresh])

  React.useEffect(() => {
    if (!selectedCue) {
      setSelectedCueId(null)
      setText('')
      setTreatment(defaultTreatment)
      return
    }
    setSelectedCueId(selectedCue.id)
    setText(selectedCue.text ?? '')
    setTreatment(textTreatmentOf(selectedCue))
  }, [selectedCue])

  const addText = () => {
    if (!sourceAssetId || !editorial.timeline) return
    const start = Math.max(0, Math.min(currentTimeSec, Math.max(0, durationSec - 0.2)))
    const end = Math.min(Math.max(durationSec, start + 0.2), start + 3)
    const cue: EditorialCue = {
      id: `text-${crypto.randomUUID()}`, type: 'text', start, end, title: 'New text', text: 'Your text',
      region: 'custom', origin: 'editor', context: {textStyle: defaultTreatment},
    }
    editorial.patch({type: 'cues', cues: [...cues, cue]})
    setSelectedCueId(cue.id)
    setExpanded(true)
  }

  const saveText = () => {
    if (!selectedCue || !text.trim()) return
    editorial.patch({
      type: 'cues',
      cues: cues.map((cue) => cue.id === selectedCue.id ? {
        ...cue, text: text.trim(), title: text.trim().slice(0, 80), region: 'custom', origin: 'editor' as const,
        context: {...cue.context, textStyle: treatment},
      } : cue),
    })
  }

  const handleApplyAiModification = React.useCallback(async (instructionToUse?: string) => {
    const text = (instructionToUse ?? aiInstruction).trim()
    if (!text || isApplyingAi) return { success: false, summary: 'No instruction provided.' }
    setIsApplyingAi(true)
    setAiError(null)
    try {
      const currentManifest = useMiniRunDraftStore.getState().getDraftManifest()
      const res = await miniRun.editManifest({
        manifest: currentManifest,
        instruction: text,
      })
      if (!res.ok || !res.manifest) {
        throw new Error(res.error || 'Failed to modify manifest with AI.')
      }
      useMiniRunDraftStore.getState().updateFullManifest(res.manifest)
      setAiDiffSummary({
        summary: res.diff?.summary || 'Modifications applied successfully.',
        changes: res.diff?.changes || [],
        modelUsed: res.modelUsed,
      })
      setAiInstruction('')
      return {
        success: true,
        summary: res.diff?.summary || 'Manifest updated.',
        diff: res.diff,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI edit failed.'
      setAiError(msg)
      return { success: false, summary: msg }
    } finally {
      setIsApplyingAi(false)
    }
  }, [aiInstruction, isApplyingAi])

  const startRender = React.useCallback(async (promptOverride?: string): Promise<RenderStartResult> => {
    if (!canSubmitSourceRender(sourceAssetId, sourceUploadStatus)) {
      const summary = sourceUploadStatus === 'uploading'
        ? 'Wait for the source video to finish saving before rendering.'
        : sourceUploadStatus === 'failed'
          ? 'The source upload failed. Check its upload error before retrying.'
          : 'Add a source video before rendering.'
      setError(summary)
      return {success: false, summary, renderInitiated: false}
    }
    if (pendingRecord?.id) {
      return {success: true, summary: `Your MP4 render is already ${pendingRecord.status === 'pending' ? 'queued' : 'processing'}.`, renderInitiated: true}
    }
    if (isSubmitting || submissionInFlightRef.current) {
      return {success: false, summary: 'A render submission is already in progress. Check its status before retrying.', renderInitiated: false}
    }
    submissionInFlightRef.current = true
    setIsSubmitting(true)
    setError(null)
    setExpanded(true)
    try {
      const draftStore = useMiniRunDraftStore.getState()
      const promptToDispatch = promptOverride ?? effectivePrompt
      const draftManifest = draftStore.isDirty ? draftStore.getDraftManifest() : undefined

      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/exports`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          preset: 'mini-run-maul-portrait',
          sourceAssetId,
          prompt: promptToDispatch,
          draftManifest,
        }),
        signal: AbortSignal.timeout(60_000),
      })
      const payload = await response.json() as {export?: ProjectExport; error?: string}
      if (!response.ok) throw new Error(payload.error || 'The render could not start.')
      const created = payload.export
      if (!created?.id) throw new Error('The export service returned no tracked render job.')
      if (created.status === 'failed') throw new Error(created.errorMessage || 'The render service rejected the job.')
      if (!['pending', 'processing', 'completed'].includes(created.status)) throw new Error('The render service did not confirm an accepted job.')
      setRecords((current) => [created, ...current.filter((record) => record.id !== created.id)])
      await refresh()
      return {success: true, summary: `Your MP4 render is ${created.status === 'pending' ? 'queued' : created.status}.`, renderInitiated: true}
    } catch (cause) {
      const summary = cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError')
        ? 'The render submission response timed out. Refresh render status before retrying; a job may already have been accepted.'
        : cause instanceof Error ? cause.message : 'The render could not start.'
      setError(summary)
      return {success: false, summary, renderInitiated: false}
    } finally {
      submissionInFlightRef.current = false
      setIsSubmitting(false)
    }
  }, [sourceAssetId, sourceUploadStatus, pendingRecord, isSubmitting, projectId, effectivePrompt, refresh])

  React.useEffect(() => {
    registerVoiceCompanionBridge({
      projectId,
      sourceAssetId,
      onStartRender: async (mode: 'preview' | 'final', prompt?: string) => {
        if (mode === 'preview') {
          setComparisonOpen(true)
          return { success: true, summary: 'Export review opened.', renderInitiated: false }
        }
        return await startRender(prompt)
      },
      onModifyManifest: async (instruction: string) => {
        return await handleApplyAiModification(instruction)
      },
    })
  }, [projectId, sourceAssetId, handleApplyAiModification, startRender])

  React.useEffect(() => {
    if (!finishedRecord) return
    const meta = finishedRecord.metadata as Record<string, unknown> | undefined
    const miniRunJobId = typeof meta?.miniRunJobId === 'string' ? meta.miniRunJobId : null
    if (!miniRunJobId) return

    let cancelled = false
    void (async () => {
      try {
        const res = await miniRun.getManifest(miniRunJobId)
        if (!cancelled && res.ok && res.manifest) {
          useMiniRunDraftStore.getState().setPlan(res.manifest, sourceUrl || undefined)
        }
      } catch {
        // Silently skip if manifest endpoint is not available yet
      }
    })()
    return () => {
      cancelled = true
    }
  }, [finishedRecord?.id, sourceUrl])

  const download = async () => {
    if (!finishedRecord || isDownloading) return
    setIsDownloading(true)
    setError(null)
    try {
      const response = await fetch(renderDownloadPath(finishedRecord.id), {cache: 'no-store'})
      const payload = await response.json() as {downloadUrl?: string; download?: {url?: string; filename?: string}; error?: string}
      if (!response.ok) throw new Error(payload.error || 'Could not prepare the download.')
      const url = payload.download?.url ?? payload.downloadUrl
      if (!url) throw new Error('The finished MP4 has no download URL.')
      const filename = payload.download?.filename ?? `${projectTitle.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.mp4`
      await downloadMedia(url, filename)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not download the MP4.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (presentation === 'preview') {
    return (
      <>
        <button
          type="button"
          onClick={() => setComparisonOpen(true)}
          disabled={!sourceUrl}
          aria-label="Compare original and rendered video"
          title="Compare versions"
          className="grid size-10 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Columns2 className="size-4" strokeWidth={1.6} />
        </button>
        {comparisonOpen && typeof document !== 'undefined' ? createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[240] flex items-center justify-center bg-black/92 p-3 backdrop-blur-xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Compare original and rendered video"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setComparisonOpen(false)
            }}
          >
            <VideoReviewProvider key={`${projectId}:${sourceAssetId}`} projectId={projectId} sourceAssetId={sourceAssetId} projectTitle={projectTitle}>
            <motion.section
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`flex h-[min(92dvh,60rem)] w-full max-w-[96rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090a0b] shadow-[0_36px_100px_rgba(0,0,0,0.68)] ${mobileWorkspaceStyles.delivery}`}
            >
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <Columns2 className="size-4 shrink-0 text-[#b4fb60]" />
                  <h2 className="truncate text-sm font-medium text-white/88">Compare versions</h2>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <VideoReviewDownloadButton />
                  <button type="button" onClick={() => void refresh()} aria-label="Refresh versions" title="Refresh versions" className="grid size-9 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white"><RefreshCw className="size-4" /></button>
                  <button type="button" onClick={() => setComparisonOpen(false)} aria-label="Close comparison" title="Close" className="grid size-9 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white"><X className="size-4" /></button>
                </div>
              </header>

              {(error || historyError || editorial.status === 'error') ? (
                <p role="alert" className="shrink-0 border-b border-rose-400/15 bg-rose-400/5 px-5 py-2 text-xs text-rose-200">{error ?? historyError ?? `Editor timeline sync failed: ${editorial.error || 'Unable to confirm the save.'}`}</p>
              ) : null}

              <p className="px-4 pt-3 text-[11px] text-white/50 sm:px-6">Source Mini-Run MP4s use the original footage with automatic music and captions; editor timeline layers are not included.</p>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:grid-cols-2 sm:p-5">
                <figure className="relative flex aspect-video min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-black sm:aspect-auto">
                  {sourceUrl ? <video key={sourceUrl} ref={comparisonSourceRef} crossOrigin="anonymous" src={sourceUrl} controls playsInline preload="metadata" className="absolute inset-0 size-full object-contain" aria-label="Original video" /> : <div className="grid h-full place-items-center text-xs text-white/40">Source video unavailable</div>}
                  {sourceUrl ? <VideoAnnotateButton videoRef={comparisonSourceRef} source="original" /> : null}
                  <figcaption className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/12 bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white/75 backdrop-blur">Original</figcaption>
                </figure>

                <figure className="relative flex aspect-video min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[#b4fb60]/16 bg-black sm:aspect-auto">
                  {finishedRecord ? <video key={finishedRecord.id} ref={comparisonRenderRef} crossOrigin="anonymous" src={renderPreviewPath(finishedRecord.id)} controls playsInline preload="metadata" className="absolute inset-0 size-full object-contain" aria-label="Rendered MP4" /> : <div className="grid h-full place-items-center px-6 text-center text-xs text-white/42">{pendingRecord ? 'The backend is rendering. The MP4 will appear here when its receipt is ready.' : 'No completed MP4 is available yet.'}</div>}
                  {finishedRecord ? <VideoAnnotateButton videoRef={comparisonRenderRef} source="rendered" renderId={finishedRecord.id} /> : null}
                  <figcaption className="pointer-events-none absolute left-3 top-3 rounded-full border border-[#b4fb60]/22 bg-black/70 px-2.5 py-1 text-[10px] font-medium text-[#c9ff88] backdrop-blur">Rendered MP4</figcaption>
                </figure>
              </div>

              <footer className="flex min-h-12 shrink-0 items-center gap-2 overflow-x-auto border-t border-white/8 px-4 py-2 sm:px-6">
                {completedRecords.map((record, index) => <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} aria-pressed={finishedRecord?.id === record.id} title={dateLabel(record.createdAt)} className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] transition ${finishedRecord?.id === record.id ? 'border-[#9df65a]/45 bg-[#9df65a]/12 text-[#c9ff88]' : 'border-white/10 text-white/52 hover:text-white'}`}>V{completedRecords.length - index}</button>)}
                {finishedRecord ? <button type="button" onClick={() => void download()} disabled={isDownloading} className="ml-auto inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/12 px-3 text-[11px] text-white/70 hover:bg-white/5"><ArrowDownToLine className="size-3.5" /> Download</button> : null}
              </footer>
            </motion.section>
            </VideoReviewProvider>
          </motion.div>,
          document.body,
        ) : null}
      </>
    )
  }

  return (
    <VideoReviewProvider key={`${projectId}:${sourceAssetId}`} projectId={projectId} sourceAssetId={sourceAssetId} projectTitle={projectTitle}>
    <section aria-label="Final render studio" className={`w-full overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#0a0e0c] shadow-[0_20px_70px_rgba(0,0,0,.35)] ${mobileWorkspaceStyles.delivery}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(157,246,90,.13),transparent_35%)] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#9df65a]/20 bg-[#9df65a]/10 text-[#b4fb60]"><Film className="size-4" /></span>
          <div><h2 className="text-sm font-semibold text-white">MP4 exports</h2><p className="text-[11px] text-white/45">Source Mini-Run: portrait MP4, up to 30 seconds, automatic music and captions. Editor timeline layers are not included.</p></div>
        </div>
        <div className="flex items-center gap-2">
          <VideoReviewDownloadButton />
          <button type="button" onClick={() => void refresh()} className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white" aria-label="Refresh renders"><RefreshCw className="size-4" /></button>
          <button type="button" onClick={() => setComparisonOpen(true)} disabled={!sourceUrl} aria-label="Compare original and rendered video" title="Compare versions side-by-side" className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><Columns2 className="size-4" /></button>
          <button type="button" onClick={() => void startRender()} disabled={!canSubmitSourceRender(sourceAssetId, sourceUploadStatus) || isSubmitting || Boolean(pendingRecord)} title={sourceUploadStatus === 'uploading' ? 'Wait for the source video to finish saving before rendering.' : sourceUploadStatus === 'failed' ? 'The source video was not saved. Select it again before rendering.' : !sourceAssetId ? 'Add a source video first.' : undefined} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#b4fb60] px-3 text-xs font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-45">
            {isSubmitting || pendingRecord ? <LoaderCircle className="size-3.5 animate-spin" /> : <Film className="size-3.5" />}
            {isSubmitting ? 'Submitting render…' : pendingRecord?.status === 'pending' ? 'Queued…' : pendingRecord ? 'Rendering…' : 'Start source Mini-Run'}
          </button>
        </div>
      </div>
      {(error || historyError || editorial.status === 'error') && <p role="alert" className="border-b border-rose-400/15 bg-rose-400/5 px-5 py-2 text-xs text-rose-200">{error ?? historyError ?? `Editor timeline sync failed: ${editorial.error || 'Unable to confirm the save.'}`}</p>}
      {sourceUploadStatus === 'uploading' && <p role="status" className="border-b border-white/8 px-5 py-2 text-[11px] text-white/55">Saving the replacement source video. Rendering will be available when it finishes.</p>}
      {sourceUploadStatus === 'failed' && <p role="alert" className="border-b border-rose-400/15 bg-rose-400/5 px-5 py-2 text-xs text-rose-200">The replacement source was not saved. Select the video again before rendering.</p>}
      {isSubmitting && <p role="status" aria-live="polite" className="border-b border-white/8 px-5 py-2 text-[11px] text-white/55">Submitting render…</p>}
      {latestRecord && <div role="status" aria-live="polite" className="border-b border-white/8 px-5 py-3 text-[11px] text-white/65">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Latest render: <span className="capitalize text-white/90">{latestRecord.status}</span>{latestRecord.errorMessage ? ` · ${latestRecord.errorMessage}` : ''}</span>
          {pendingRecord && <span className="text-white/40">Status refreshes every 5 seconds</span>}
        </div>
        {pendingRecord && <div
          className="mt-2"
          role="progressbar"
          aria-label="Final render progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pendingProgress ?? undefined}
          aria-valuetext={pendingProgress === null ? 'Progress percentage not reported' : `${pendingProgress}% complete`}
        >
          <div className="h-px overflow-hidden bg-white/20">
            {pendingProgress === null
              ? prefersReducedMotion
                ? <div className="h-full w-1/3 bg-[#b4fb60]" />
                : <motion.div className="h-full w-1/3 bg-[#b4fb60]" initial={{x: '-100%'}} animate={{x: '300%'}} transition={{duration: 1.4, ease: 'linear', repeat: Infinity}} />
              : <div className="h-full bg-[#b4fb60] transition-[width] duration-500" style={{width: `${pendingProgress}%`}} />}
          </div>
          <p className="mt-1 text-[10px] text-white/40">{pendingProgress === null ? 'The renderer has not reported a percentage yet.' : `${pendingProgress}% complete`}</p>
        </div>}
      </div>}

      {/* Creative Bias / Editorial Directives */}
      <div className="border-b border-white/8 bg-white/[0.02] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[#b4fb60]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">Creative Editorial Bias</h3>
          </div>
          <span className="text-[11px] text-white/40">Biases autonomous editorial pacing and graphics</span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {[
            { id: 'balanced', label: 'Balanced (Standard)' },
            { id: 'broll', label: 'More B-Roll Cutaways' },
            { id: 'vox', label: 'Vox & Motion Graphics' },
            { id: 'kinetic', label: 'Fast & Kinetic Pacing' },
            { id: 'custom', label: 'Custom Directive' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCreativeBias(item.id as any)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                creativeBias === item.id
                  ? 'border-[#9df65a]/60 bg-[#9df65a]/15 text-[#c9ff88] shadow-[0_0_12px_rgba(180,251,96,0.2)]'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {creativeBias === 'custom' && (
          <div className="mt-2.5">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Bias heavily towards high-tech neon aesthetics, bold sans typography, and upbeat electronic soundtrack..."
              className="w-full rounded-lg border border-white/15 bg-[#151a17] px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#b4fb60]/60"
            />
          </div>
        )}
      </div>

      {/* AI Revision & Modular Tweak Studio */}
      <div className="border-b border-white/8 bg-[radial-gradient(circle_at_0%_0%,rgba(180,251,96,0.06),transparent_40%)] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#b4fb60]" />
            <h3 className="text-sm font-semibold text-white/90">AI Revision & Modular Tweak Studio</h3>
            {draftState.isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                Modified Manifest
              </span>
            )}
          </div>
          {draftState.isDirty && (
            <button
              type="button"
              onClick={() => void startRender()}
              disabled={isSubmitting || Boolean(pendingRecord)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#b4fb60]/50 bg-[#b4fb60]/20 px-3 py-1.5 text-xs font-semibold text-[#c9ff88] hover:bg-[#b4fb60]/30 transition disabled:opacity-50"
            >
              {isSubmitting ? <LoaderCircle className="size-3 animate-spin" /> : <Film className="size-3" />}
              Re-render to AWS Lambda with Modifications
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-white/55">
          Ask high-tier AI (Gemini 2.5 / 3.8) to modify edit components (change song, SFX, typography, animations, phrasing, or B-roll queries).
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleApplyAiModification()
            }}
            placeholder="e.g. 'Change background song to upbeat electronic', 'Make headline typography bold neon yellow', 'Add whoosh sound effect at 3s'..."
            disabled={isApplyingAi}
            className="flex-1 rounded-lg border border-white/15 bg-[#121614] px-3 py-2 text-xs text-white placeholder-white/35 outline-none focus:border-[#b4fb60]/60"
          />
          <button
            type="button"
            onClick={() => void handleApplyAiModification()}
            disabled={isApplyingAi || !aiInstruction.trim()}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#b4fb60] px-3.5 text-xs font-semibold text-black transition hover:bg-[#c9ff88] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isApplyingAi ? <LoaderCircle className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            {isApplyingAi ? 'Modifying…' : 'Apply AI Edit'}
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-white/40">
          <span>Quick tweaks:</span>
          {[
            'Change song to upbeat synthwave',
            'Make text bold yellow 3D',
            'Add whoosh SFX at 2s',
            'Bias to Vox explainer animations',
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => void handleApplyAiModification(promptText)}
              disabled={isApplyingAi}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-white/60 hover:border-white/20 hover:text-white transition"
            >
              {promptText}
            </button>
          ))}
        </div>

        {aiError && (
          <p role="alert" className="mt-2 rounded-md border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-200">
            {aiError}
          </p>
        )}

        {aiDiffSummary && (
          <div className="mt-3 rounded-lg border border-[#b4fb60]/20 bg-[#b4fb60]/5 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#c9ff88]">{aiDiffSummary.summary}</span>
              {aiDiffSummary.modelUsed && (
                <span className="text-[10px] text-white/40">Model: {aiDiffSummary.modelUsed}</span>
              )}
            </div>
            {aiDiffSummary.changes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {aiDiffSummary.changes.map((c, i) => (
                  <span
                    key={i}
                    className="rounded bg-black/40 px-2 py-0.5 text-[10px] text-white/70 border border-white/10"
                  >
                    {c.field || 'change'}: {String(c.after ?? c.instruction ?? 'updated')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-b border-white/8 px-4 py-3 sm:px-5"><h3 className="text-sm font-medium text-white/90">Feedback & corrections</h3><p className="mt-1 text-xs leading-5 text-white/65">Pause either video, add a frame note, or draw a correction. Notes stay on this device; download your review to share them.</p></div>
      <VideoReviewToolbar />
      <div data-delivery-players data-render-ready={Boolean(finishedRecord)} className="grid gap-3 p-3 sm:p-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white/55"><span>01 / Original footage</span><span>Source</span></div>
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {sourceUrl ? <video key={sourceUrl} ref={comparisonSourceRef} crossOrigin="anonymous" src={sourceUrl} controls playsInline preload="metadata" className="absolute inset-0 size-full object-contain" aria-label="Original footage" /> : <div className="grid h-full place-items-center text-xs text-white/35">Upload a source video to begin</div>}
            {sourceUrl ? <VideoAnnotateButton key={sourceUrl} videoRef={comparisonSourceRef} source="original" /> : null}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#9df65a]/20 bg-black">
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#b4fb60]"><span>02 / Rendered MP4</span><span>{finishedRecord ? 'MP4 ready' : pendingRecord?.status === 'pending' ? 'Queued' : pendingRecord ? 'Rendering' : 'Awaiting render'}</span></div>
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {finishedRecord ? <video key={finishedRecord.id} ref={comparisonRenderRef} crossOrigin="anonymous" src={renderPreviewPath(finishedRecord.id)} controls playsInline preload="metadata" className="absolute inset-0 size-full object-contain" aria-label="Finished MP4" /> : <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(157,246,90,.08),transparent_55%)] px-8 text-center text-xs leading-5 text-white/40">{pendingRecord ? 'The backend is rendering this version. It will appear here when the MP4 is stored.' : 'Your completed render will play here beside the original.'}</div>}
            {finishedRecord ? <VideoAnnotateButton key={finishedRecord.id} videoRef={comparisonRenderRef} source="rendered" renderId={finishedRecord.id} /> : null}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/8 px-4 py-3 sm:px-5">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[.16em] text-white/35">Versions</span>
        {completedRecords.map((record, index) => <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} aria-pressed={finishedRecord?.id === record.id} title={dateLabel(record.createdAt)} className={`rounded-md border px-2.5 py-1 text-[11px] transition ${finishedRecord?.id === record.id ? 'border-[#9df65a]/50 bg-[#9df65a]/12 text-[#c9ff88]' : 'border-white/10 text-white/55 hover:text-white'}`}>V{completedRecords.length - index}</button>)}
        {completedRecords.length === 0 && <span className="text-[11px] text-white/35">No finished versions yet</span>}
        {finishedRecord && <button type="button" onClick={() => void download()} disabled={isDownloading} className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-md border border-white/15 px-2.5 text-[11px] text-white/75 hover:bg-white/5"><ArrowDownToLine className="size-3.5" /> Download MP4</button>}
      </div>
      <div className="border-t border-white/8 px-4 py-3 sm:px-5">
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="flex w-full items-center justify-between text-left text-xs font-medium text-white/75"><span className="inline-flex items-center gap-2"><Type className="size-4 text-[#b4fb60]" /> Text and motion controls</span><span className="text-white/40">{expanded ? 'Hide' : 'Edit'}</span></button>
        {expanded && <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,.75fr)]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><label className="text-[11px] text-white/45" htmlFor="delivery-text-cue">Text layer</label><select id="delivery-text-cue" value={selectedCue?.id ?? ''} onChange={(event) => setSelectedCueId(event.target.value)} className="min-h-9 min-w-40 flex-1 rounded-md border border-white/15 bg-[#151a17] px-2 text-xs text-white">{textCues.length === 0 && <option value="">No text layers</option>}{textCues.map((cue) => <option key={cue.id} value={cue.id}>{cue.text || cue.title}</option>)}</select><button type="button" onClick={addText} disabled={!sourceAssetId || !editorial.timeline} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-white/15 px-2.5 text-xs text-white/75 hover:bg-white/5"><Plus className="size-3.5" /> Add text</button></div>
            <label className="block text-[11px] text-white/50">Text / characters<textarea value={text} onChange={(event) => setText(event.target.value)} disabled={!selectedCue} maxLength={20000} rows={2} className="mt-1 block w-full resize-y rounded-md border border-white/15 bg-[#111512] p-2.5 text-sm text-white outline-none focus:border-[#9df65a]/50" /></label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="text-[11px] text-white/50">Font<select value={treatment.fontFamily} onChange={(event) => setTreatment({...treatment, fontFamily: event.target.value})} className="mt-1 block min-h-9 w-full rounded-md border border-white/15 bg-[#151a17] px-2 text-xs text-white">{fonts.map((font) => <option key={font}>{font}</option>)}</select></label>
              <label className="text-[11px] text-white/50">Animation<select value={treatment.animation} onChange={(event) => setTreatment({...treatment, animation: event.target.value})} className="mt-1 block min-h-9 w-full rounded-md border border-white/15 bg-[#151a17] px-2 text-xs text-white">{animations.map((animation) => <option key={animation}>{animation}</option>)}</select></label>
              <label className="text-[11px] text-white/50">Size <span className="text-white/30">{treatment.fontSizePx}px</span><input type="range" min="18" max="120" value={treatment.fontSizePx} onChange={(event) => setTreatment({...treatment, fontSizePx: Number(event.target.value)})} className="mt-3 w-full accent-[#b4fb60]" /></label>
              <label className="text-[11px] text-white/50">Width <span className="text-white/30">{treatment.maxWidthPct}%</span><input type="range" min="20" max="100" value={treatment.maxWidthPct} onChange={(event) => setTreatment({...treatment, maxWidthPct: Number(event.target.value)})} className="mt-3 w-full accent-[#b4fb60]" /></label>
              <label className="text-[11px] text-white/50">Horizontal <span className="text-white/30">{treatment.xPct}%</span><input type="range" min="0" max="100" value={treatment.xPct} onChange={(event) => setTreatment({...treatment, xPct: Number(event.target.value)})} className="mt-3 w-full accent-[#b4fb60]" /></label>
              <label className="text-[11px] text-white/50">Vertical <span className="text-white/30">{treatment.yPct}%</span><input type="range" min="0" max="100" value={treatment.yPct} onChange={(event) => setTreatment({...treatment, yPct: Number(event.target.value)})} className="mt-3 w-full accent-[#b4fb60]" /></label>
            </div>
            <button type="button" onClick={saveText} disabled={!selectedCue || !text.trim() || editorial.status === 'saving'} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#9df65a]/35 bg-[#9df65a]/10 px-3 text-xs font-semibold text-[#c9ff88] disabled:opacity-40"><Check className="size-3.5" /> Save text treatment</button>
            <span className="ml-2 text-[11px] text-white/40">{editorial.status === 'saving' ? 'Saving…' : editorial.status === 'saved' ? 'Saved to this project' : 'Changes are saved with the project timeline'}</span>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,#1d241c,#080b09)] [container-type:inline-size]">
            {sourceUrl && <video src={sourceUrl} preload="metadata" muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-55" aria-hidden="true" />}
            <div className="pointer-events-none absolute inset-0" aria-label="Text placement preview">
              <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{left: `${treatment.xPct}%`, top: `${treatment.yPct}%`, width: `${treatment.maxWidthPct}%`}}>
                <motion.span
                  key={`${selectedCue?.id ?? 'new'}-${treatment.animation}`}
                  initial={treatment.animation === 'none' ? false : {
                    opacity: treatment.animation === 'typewriter' ? 1 : 0,
                    y: treatment.animation === 'rise' ? 18 : 0,
                    scale: treatment.animation === 'pop' ? 0.7 : 1,
                    clipPath: treatment.animation === 'typewriter' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
                  }}
                  animate={{opacity: 1, y: 0, scale: 1, clipPath: 'inset(0 0 0 0)'}}
                  transition={{duration: treatment.animation === 'typewriter' ? 1.1 : 0.42, ease: 'easeOut'}}
                  className="block break-words text-center font-semibold leading-tight text-white [text-shadow:0_2px_12px_#000]"
                  style={{fontFamily: treatment.fontFamily, fontSize: `clamp(12px, ${treatment.fontSizePx / 4}cqw, 34px)`}}
                >{text || 'Your text'}</motion.span>
              </div>
            </div>
            <span className="absolute left-2 top-2 rounded bg-black/65 px-1.5 py-1 text-[9px] uppercase tracking-wider text-white/65">Placement preview</span>
          </div>
        </div>}
      </div>
    </section>
    </VideoReviewProvider>
  )
}
