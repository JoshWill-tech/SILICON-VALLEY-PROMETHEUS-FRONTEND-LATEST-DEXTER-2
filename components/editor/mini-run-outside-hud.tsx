'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Loader2,
  Type,
  RotateCcw,
  Download,
  Scissors,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  Wand2,
} from 'lucide-react'
import {
  useMiniRunDraftStore,
  type DraftChunk,
  type DraftWord,
  type DraftTypography,
} from '@/lib/editor/mini-run-draft-store'
import { dispatchMiniRunFromProject, planMiniRunFromProject } from '@/lib/api/mini-run-console'
import { miniRun } from '@/lib/api/mini-run'
import { toast } from 'sonner'
import { TYPOGRAPHY_PRESETS } from '@/components/editor/mini-run-live-overlay'

export interface MiniRunOutsideHudProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  projectId?: string | null
  sourceAssetId?: string | null
  currentTimeMs?: number
  className?: string
}

export function MiniRunOutsideHud({
  videoRef,
  projectId,
  sourceAssetId,
  currentTimeMs: externalTimeMs,
  className,
}: MiniRunOutsideHudProps) {
  const chunks = useMiniRunDraftStore((s) => s.chunks)
  const isDirty = useMiniRunDraftStore((s) => s.isDirty)
  const status = useMiniRunDraftStore((s) => s.status)
  const updateWordText = useMiniRunDraftStore((s) => s.updateWordText)
  const toggleWordCut = useMiniRunDraftStore((s) => s.toggleWordCut)
  const setGlobalTypography = useMiniRunDraftStore((s) => s.setGlobalTypography)
  const getDraftManifest = useMiniRunDraftStore((s) => s.getDraftManifest)
  const setStatus = useMiniRunDraftStore((s) => s.setStatus)
  const reset = useMiniRunDraftStore((s) => s.reset)
  const sourceUrl = useMiniRunDraftStore((s) => s.sourceUrl)

  const [renderedOutputUrl, setRenderedOutputUrl] = React.useState<string | null>(null)
  const [isBaking, setIsBaking] = React.useState(false)
  const [isPlanning, setIsPlanning] = React.useState(false)
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null)

  // Morphing / Expansion Hover States
  const [hoveredCard, setHoveredCard] = React.useState<'status' | 'typography' | 'chunks' | null>(null)

  // Track playback time if not passed from parent
  const [localTimeMs, setLocalTimeMs] = React.useState(0)
  React.useEffect(() => {
    if (externalTimeMs !== undefined) return
    let animId: number
    const sync = () => {
      const vid = videoRef.current
      if (vid && !vid.paused) {
        setLocalTimeMs(Math.round(vid.currentTime * 1000))
      }
      animId = requestAnimationFrame(sync)
    }
    animId = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(animId)
  }, [externalTimeMs, videoRef])

  const currentTime = externalTimeMs !== undefined ? externalTimeMs : localTimeMs

  // Find active chunk
  let activeChunkIdx = -1
  let activeChunk: DraftChunk | null = null
  for (let i = 0; i < chunks.length; i++) {
    if (currentTime >= chunks[i].startMs && currentTime <= chunks[i].endMs) {
      activeChunk = chunks[i]
      activeChunkIdx = i
      break
    }
  }

  // Handle Synthesis / Planning
  const handleLoadDraftPlan = async () => {
    if (!projectId) {
      toast.error('Project ID is required.')
      return
    }

    try {
      setIsPlanning(true)
      toast.info('Synthesizing zero-lag editable draft (3-5s)...')
      const videoSrc = videoRef.current?.currentSrc || videoRef.current?.src || undefined
      const result = await planMiniRunFromProject({
        projectId,
        sourceAssetId: sourceAssetId || '',
        sourceUrl: videoSrc,
      })
      useMiniRunDraftStore.getState().setPlan(result.manifest, (result.source?.url as string) || videoSrc || undefined)
      toast.success('Live preview active! Select typography presets or click words to edit.')
    } catch (err) {
      console.error('[MiniRunOutsideHud] Failed to load draft plan:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to synthesize draft.')
    } finally {
      setIsPlanning(false)
    }
  }

  // Handle Cloud Video Baking
  const handleBakeFinal = async () => {
    if (!projectId) {
      toast.error('Project ID is required to bake final video.')
      return
    }

    try {
      setIsBaking(true)
      setStatus('rendering')
      const draftManifest = getDraftManifest()

      toast.info('Dispatching cloud render with draft manifest...')
      const result = await dispatchMiniRunFromProject({
        projectId,
        sourceAssetId: sourceAssetId || '',
        draftManifest,
      })

      const toastId = toast.loading(`Cloud render started (Job ID: ${result.jobId.slice(0, 8)})...`)

      const maxAttempts = 180
      let attempt = 0
      let completedOutputUrl: string | null = null

      while (attempt < maxAttempts) {
        attempt++
        await new Promise((resolve) => setTimeout(resolve, 2500))

        try {
          const pollStatus = await miniRun.getRenderStatus(result.jobId)
          const state = (pollStatus.state || pollStatus.status || '').toLowerCase()
          const progress = pollStatus.progressPercent ? ` (${pollStatus.progressPercent}%)` : ''

          toast.loading(`Rendering cloud video${progress}...`, { id: toastId })

          if (state === 'completed' || state === 'success' || state === 'finished') {
            completedOutputUrl = pollStatus.outputUrl || `/api/mini-run/job/${encodeURIComponent(result.jobId)}/output`
            break
          } else if (state === 'failed' || state === 'error') {
            const reason = pollStatus.failedReason || pollStatus.error || 'Cloud render failed.'
            throw new Error(reason)
          }
        } catch (pollErr) {
          if (attempt > 3 && (pollErr as Error)?.message?.includes('failed')) {
            throw pollErr
          }
        }
      }

      if (!completedOutputUrl) {
        throw new Error('Cloud render timed out before output was ready.')
      }

      const sourceVideo = videoRef.current?.src || ''
      if (sourceVideo && completedOutputUrl === sourceVideo) {
        throw new Error('Cloud render produced raw unedited video. Pipeline rejected.')
      }

      setRenderedOutputUrl(completedOutputUrl)

      if (videoRef.current) {
        videoRef.current.src = completedOutputUrl
        videoRef.current.load()
        videoRef.current.play().catch(() => {})
      }

      setStatus('rendered')
      toast.success('Final edited video rendered and loaded!', { id: toastId })
    } catch (err) {
      console.error('[MiniRunOutsideHud] Bake failed:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch final render.')
      setStatus('error')
    } finally {
      setIsBaking(false)
    }
  }

  // Navigate to chunk by index
  const jumpToChunk = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= chunks.length) return
    const chunk = chunks[targetIdx]
    const vid = videoRef.current
    if (vid) {
      vid.currentTime = chunk.startMs / 1000
    }
  }

  // If no draft plan is loaded yet, show the initial synthesize pill
  if (chunks.length === 0) {
    if (!projectId) return null
    return (
      <div className={className || 'pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col gap-2.5 items-start'}>
        <motion.button
          layout
          onClick={handleLoadDraftPlan}
          disabled={isPlanning}
          className="pointer-events-auto group flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-3.5 py-2 text-xs font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all hover:bg-black hover:border-accent-cyan/80 hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] active:scale-95 disabled:opacity-50"
          title="Synthesize interactive draft with subtitle styling"
        >
          {isPlanning ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-accent-cyan" />
              <span className="whitespace-nowrap">Planning Draft...</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 text-accent-cyan group-hover:rotate-12 transition-transform" />
              <span className="whitespace-nowrap font-medium">Interactive Draft</span>
            </>
          )}
        </motion.button>
      </div>
    )
  }

  return (
    <div
      className={
        className ||
        'pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col gap-2.5 items-start select-none'
      }
      data-outside-hud="true"
    >
      {/* 1. Status & Bake Morphing Capsule */}
      <motion.div
        layout
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onMouseEnter={() => setHoveredCard('status')}
        onMouseLeave={() => setHoveredCard(null)}
        className="pointer-events-auto relative overflow-hidden rounded-full border border-white/12 bg-black/75 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors hover:border-white/25 hover:bg-black/90"
      >
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              status === 'rendered'
                ? 'bg-emerald-400'
                : status === 'rendering'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-accent-cyan'
            } shadow-[0_0_8px_currentColor]`}
          />
          <span className="text-xs font-semibold text-white/95 whitespace-nowrap">
            {status === 'rendered' ? 'Rendered MP4' : 'Live Draft'}
          </span>
          {status !== 'rendered' && isDirty && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-amber-300 border border-amber-500/30 whitespace-nowrap">
              Edited
            </span>
          )}

          {/* Morphing Actions Tray on Hover */}
          <AnimatePresence>
            {hoveredCard === 'status' && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-center gap-1.5 overflow-hidden pl-1.5 border-l border-white/15"
              >
                {status === 'rendered' ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (sourceUrl && videoRef.current) {
                          videoRef.current.src = sourceUrl
                          videoRef.current.load()
                        }
                        setStatus('planned')
                      }}
                      className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                      title="Switch back to live editable draft"
                    >
                      <RotateCcw className="size-3" />
                      <span>Re-edit</span>
                    </button>
                    {(renderedOutputUrl || videoRef.current?.src) && (
                      <a
                        href={`${renderedOutputUrl || videoRef.current?.src}${
                          String(renderedOutputUrl || videoRef.current?.src).includes('?') ? '&' : '?'
                        }download=1`}
                        download="prometheus_short.mp4"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-black shadow-md hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
                      >
                        <Download className="size-3" />
                        <span>Download</span>
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        reset()
                      }}
                      className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                      title="Reset draft to original manifest"
                    >
                      <RotateCcw className="size-3" />
                      <span>Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBakeFinal()
                      }}
                      disabled={isBaking}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent-cyan to-blue-500 px-3 py-1 text-xs font-semibold text-black shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {isBaking ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          <span>Rendering...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3 fill-current" />
                          <span>Bake Video</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 2. Typography & Style Morphing Capsule */}
      {status !== 'rendered' && (
        <motion.div
          layout
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onMouseEnter={() => setHoveredCard('typography')}
          onMouseLeave={() => setHoveredCard(null)}
          className="pointer-events-auto relative overflow-hidden rounded-full border border-white/12 bg-black/75 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors hover:border-white/25 hover:bg-black/90"
        >
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-accent-cyan">
              <Type className="size-3.5" />
              <span className="text-xs font-semibold text-white/95 whitespace-nowrap">
                {selectedPreset
                  ? TYPOGRAPHY_PRESETS.find((p) => p.id === selectedPreset)?.shortLabel || 'Style'
                  : 'Style'}
              </span>
            </div>

            {/* Morphs on Hover to Reveal All 4 Typography Presets */}
            <AnimatePresence>
              {hoveredCard === 'typography' && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex items-center gap-1 overflow-hidden pl-1.5 border-l border-white/15"
                >
                  {TYPOGRAPHY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPreset(preset.id)
                        setGlobalTypography(preset.styling, preset.layersTemplate)
                        toast.success(`Applied ${preset.label}!`)
                      }}
                      title={preset.label}
                      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                        selectedPreset === preset.id
                          ? 'bg-accent-cyan text-black font-semibold shadow-sm'
                          : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {preset.shortLabel || preset.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* 3. Chunks & Quick Navigation Morphing Capsule */}
      <motion.div
        layout
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onMouseEnter={() => setHoveredCard('chunks')}
        onMouseLeave={() => setHoveredCard(null)}
        className="pointer-events-auto relative overflow-hidden rounded-full border border-white/12 bg-black/75 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors hover:border-white/25 hover:bg-black/90"
      >
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Layers className="size-3.5 text-accent-cyan" />
            <span className="text-xs font-semibold text-white/95 whitespace-nowrap">
              {chunks.length} ch
            </span>
          </div>

          {/* Quick chunk navigation arrows */}
          <div className="flex items-center gap-0.5 pl-1 border-l border-white/15">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const targetIdx = activeChunkIdx > 0 ? activeChunkIdx - 1 : 0
                jumpToChunk(targetIdx)
              }}
              disabled={activeChunkIdx <= 0}
              className="flex items-center justify-center rounded-full p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
              title="Previous subtitle chunk"
              aria-label="Previous subtitle chunk"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const targetIdx = activeChunkIdx < chunks.length - 1 ? activeChunkIdx + 1 : chunks.length - 1
                jumpToChunk(targetIdx)
              }}
              disabled={activeChunkIdx >= chunks.length - 1}
              className="flex items-center justify-center rounded-full p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
              title="Next subtitle chunk"
              aria-label="Next subtitle chunk"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          {/* Morphs on Hover to Reveal Chunk Telemetry */}
          <AnimatePresence>
            {hoveredCard === 'chunks' && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-center gap-2 overflow-hidden pl-1.5 border-l border-white/15 text-[11px] text-neutral-300"
              >
                <span className="whitespace-nowrap font-medium text-white/90">
                  {activeChunkIdx >= 0 ? `Chunk ${activeChunkIdx + 1}/${chunks.length}` : 'Scrubbing'}
                </span>
                {activeChunk && (
                  <span className="whitespace-nowrap text-white/60">
                    {(activeChunk.startMs / 1000).toFixed(1)}s - {(activeChunk.endMs / 1000).toFixed(1)}s
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
