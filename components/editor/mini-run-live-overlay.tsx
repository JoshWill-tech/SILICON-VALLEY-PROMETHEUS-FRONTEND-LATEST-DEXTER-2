'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors,
  Check,
  X,
  Sparkles,
  Loader2,
  Type,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  SlidersHorizontal,
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
import { useVideoFrameScale } from '@/hooks/use-video-frame-scale'
import {
  REFERENCE_FRAME_HEIGHT,
  REFERENCE_FRAME_WIDTH,
  type ScaledTypographyStyles,
} from '@/lib/editor/video-frame-scaling'

export { REFERENCE_FRAME_HEIGHT, REFERENCE_FRAME_WIDTH }

export const TYPOGRAPHY_PRESETS: Array<{
  id: string
  label: string
  shortLabel?: string
  styling: Partial<DraftTypography>
}> = [
  {
    id: 'editorial_serif',
    label: 'Editorial Serif',
    shortLabel: 'Editorial',
    styling: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 700,
      textColor: '#FFFFFF',
      shadow: '0 4px 15px rgba(0,0,0,0.9), 0 0 25px rgba(250,204,21,0.3)',
      strokeWidth: 0,
      fontSize: 40,
    },
  },
  {
    id: 'bold_grotesque',
    label: 'Bold Grotesque',
    shortLabel: 'Grotesque',
    styling: {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontWeight: 900,
      textColor: '#FACC15',
      shadow: '0 4px 20px rgba(0,0,0,0.95)',
      strokeColor: '#000000',
      strokeWidth: 2,
      fontSize: 42,
    },
  },
  {
    id: 'clean_modern',
    label: 'Clean Modern',
    shortLabel: 'Modern',
    styling: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: 800,
      textColor: '#FFFFFF',
      shadow: '0 2px 10px rgba(0,0,0,0.8)',
      strokeWidth: 0,
      fontSize: 38,
    },
  },
  {
    id: 'luxury_vogue',
    label: 'Luxury Vogue',
    shortLabel: 'Luxury',
    styling: {
      fontFamily: '"Didot", "Bodoni MT", serif',
      fontWeight: 600,
      textColor: '#F8FAFC',
      shadow: '0 2px 12px rgba(0,0,0,0.7), 0 0 15px rgba(255,255,255,0.4)',
      strokeWidth: 0,
      fontSize: 38,
    },
  },
]

export interface MiniRunLiveOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  projectId?: string | null
  sourceAssetId?: string | null
  defaultCollapsed?: boolean
  onHoverChange?: (isHovered: boolean) => void
  hoverPlayEnabled?: boolean
  aspectRatio?: number
  subtitlesOnly?: boolean
}

export function MiniRunLiveOverlay({
  videoRef,
  projectId,
  sourceAssetId,
  defaultCollapsed = true,
  onHoverChange,
  hoverPlayEnabled = true,
  aspectRatio,
  subtitlesOnly = false,
}: MiniRunLiveOverlayProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const chunks = useMiniRunDraftStore((s) => s.chunks)
  const isDirty = useMiniRunDraftStore((s) => s.isDirty)
  const status = useMiniRunDraftStore((s) => s.status)
  const updateWordText = useMiniRunDraftStore((s) => s.updateWordText)
  const toggleWordCut = useMiniRunDraftStore((s) => s.toggleWordCut)
  const updateChunkTypography = useMiniRunDraftStore((s) => s.updateChunkTypography)
  const setGlobalTypography = useMiniRunDraftStore((s) => s.setGlobalTypography)
  const getDraftManifest = useMiniRunDraftStore((s) => s.getDraftManifest)
  const setStatus = useMiniRunDraftStore((s) => s.setStatus)
  const reset = useMiniRunDraftStore((s) => s.reset)
  const sourceUrl = useMiniRunDraftStore((s) => s.sourceUrl)
  const sourceMeta = useMiniRunDraftStore((s) => s.sourceMeta)
  const [renderedOutputUrl, setRenderedOutputUrl] = React.useState<string | null>(null)

  // Canonical 960 reference frame proportional scaling engine
  const { scale, getScaledTypography, referenceFrameHeight } = useVideoFrameScale({
    videoRef,
    containerRef,
    sourceMeta,
    aspectRatio,
  })

  // Sleek Apple Collapsible State
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)

  const [currentTimeMs, setCurrentTimeMs] = React.useState(0)
  const [editingWord, setEditingWord] = React.useState<{
    chunkIndex: number
    wordIndex: number
    text: string
  } | null>(null)
  const [isBaking, setIsBaking] = React.useState(false)
  const [isPlanning, setIsPlanning] = React.useState(false)
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null)

  // Track playback time at 60fps for crisp kinetic subtitle synchronization
  React.useEffect(() => {
    let animId: number
    const syncTime = () => {
      const vid = videoRef.current
      if (vid && !vid.paused) {
        setIsPlaying(true)
        const ms = Math.round(vid.currentTime * 1000)
        setCurrentTimeMs(ms)

        // Non-destructive virtual jump-cut skipping
        if (chunks.length > 0) {
          for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
            const chunk = chunks[cIdx]
            if (ms >= chunk.startMs && ms <= chunk.endMs) {
              for (let wIdx = 0; wIdx < chunk.words.length; wIdx++) {
                const word = chunk.words[wIdx]
                if (word.cut && ms >= word.startMs && ms < word.endMs) {
                  // Find the next non-cut word start or chunk end
                  let targetSec = (word.endMs + 10) / 1000
                  for (let nextW = wIdx + 1; nextW < chunk.words.length; nextW++) {
                    if (!chunk.words[nextW].cut) {
                      targetSec = chunk.words[nextW].startSec || chunk.words[nextW].startMs / 1000
                      break
                    }
                  }
                  if (targetSec > vid.currentTime && targetSec < vid.duration) {
                    vid.currentTime = targetSec
                  }
                  break
                }
              }
              break
            }
          }
        }
      } else {
        setIsPlaying(false)
      }
      animId = requestAnimationFrame(syncTime)
    }

    animId = requestAnimationFrame(syncTime)
    return () => cancelAnimationFrame(animId)
  }, [chunks, videoRef])

  // Also listen to explicit video seek/timeupdate events
  React.useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const onTimeUpdate = () => setCurrentTimeMs(Math.round(vid.currentTime * 1000))
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    vid.addEventListener('timeupdate', onTimeUpdate)
    vid.addEventListener('seeked', onTimeUpdate)
    vid.addEventListener('play', onPlay)
    vid.addEventListener('pause', onPause)
    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate)
      vid.removeEventListener('seeked', onTimeUpdate)
      vid.removeEventListener('play', onPlay)
      vid.removeEventListener('pause', onPause)
    }
  }, [videoRef])

  // Instantaneous playback: ensures the preview plays the moment the page and video load
  React.useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    let triggered = false

    const triggerInstantPlay = () => {
      if (triggered) return
      triggered = true
      if (vid.paused) {
        const promise = vid.play()
        if (promise !== undefined) {
          promise.catch(() => {
            // Autoplay policy fallback: mute and play instantaneously
            vid.muted = true
            vid.play().catch(() => {})
          })
        }
      }
    }

    triggerInstantPlay()
    vid.addEventListener('canplay', triggerInstantPlay, { once: true })
    vid.addEventListener('loadeddata', triggerInstantPlay, { once: true })
    return () => {
      vid.removeEventListener('canplay', triggerInstantPlay)
      vid.removeEventListener('loadeddata', triggerInstantPlay)
    }
  }, [videoRef, sourceUrl])

  // Hover into video: tracks hover state without overriding user pause intent
  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true)
    onHoverChange?.(true)
  }, [onHoverChange])

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false)
    onHoverChange?.(false)
  }, [onHoverChange])

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
      setIsCollapsed(false) // Open controls for user customization
      toast.success('Live preview active! Click any word to edit or cut, or switch font profiles.')
    } catch (err) {
      console.error('[MiniRunLiveOverlay] Failed to load draft plan:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to synthesize draft.')
    } finally {
      setIsPlanning(false)
    }
  }

  // If there are no planned chunks loaded, display an unobtrusive, minimalist Apple glass pill (unless in subtitles-only mode)
  if (chunks.length === 0) {
    if (subtitlesOnly || !projectId) return null
    return (
      <div
        className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center p-3"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLoadDraftPlan()
          }}
          disabled={isPlanning}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-xl transition-all hover:bg-black/80 hover:border-accent-cyan/60 active:scale-95 disabled:opacity-50"
        >
          {isPlanning ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-accent-cyan" />
              <span>Planning Draft...</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 text-accent-cyan" />
              <span>Interactive Draft</span>
            </>
          )}
        </button>
      </div>
    )
  }

  // Find active chunk
  let activeChunk: DraftChunk | null = null
  let activeChunkIdx = -1
  for (let i = 0; i < chunks.length; i++) {
    if (currentTimeMs >= chunks[i].startMs && currentTimeMs <= chunks[i].endMs) {
      activeChunk = chunks[i]
      activeChunkIdx = i
      break
    }
  }

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

      // Poll until completion or terminal failure (up to 450s)
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

      // Fail-closed guard: ensure output is not identical to source video
      const sourceVideo = videoRef.current?.src || ''
      if (sourceVideo && completedOutputUrl === sourceVideo) {
        throw new Error('Cloud render produced raw unedited video. Pipeline rejected.')
      }

      setRenderedOutputUrl(completedOutputUrl)

      // Swap the active video player element to the rendered output MP4
      if (videoRef.current) {
        videoRef.current.src = completedOutputUrl
        videoRef.current.load()
        videoRef.current.play().catch(() => {})
      }

      setStatus('rendered')
      setIsCollapsed(true) // Auto-collapse to showcase clean rendered result
      toast.success('Final edited video rendered and loaded!', { id: toastId })
    } catch (err) {
      console.error('[MiniRunLiveOverlay] Bake failed:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch final render.')
      setStatus('error')
    } finally {
      setIsBaking(false)
    }
  }

  const typography: DraftTypography = activeChunk?.typography || {}
  const scaledStyle = getScaledTypography(typography)
  const positionYPercent = scaledStyle.positionYPercent

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-collapsible="true"
      data-collapsed={isCollapsed}
      data-video-scale={scale.toFixed(4)}
      data-reference-frame={referenceFrameHeight}
    >
      {/* Top Apple Dynamic Island Capsule: Collapsible & Minimalist (suppressed in subtitles-only mode) */}
      {!subtitlesOnly && (
        <div className="pointer-events-auto mx-auto mt-2.5 flex items-center justify-center px-2">
          <motion.div
            layout
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`flex items-center gap-2 rounded-full border border-white/12 bg-black/60 px-3 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-200 ${
              !isHovered && isCollapsed ? 'opacity-70 hover:opacity-100' : 'opacity-100'
            }`}
          >
            {/* Status Indicator */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsCollapsed(!isCollapsed)
              }}
              className="flex items-center gap-2 focus:outline-none text-left"
              aria-expanded={!isCollapsed}
              aria-label="Toggle preview controls collapse"
            >
              <span
                className={`flex h-2 w-2 rounded-full ${
                  status === 'rendered' ? 'bg-emerald-400' : 'bg-accent-cyan'
                } animate-pulse`}
              />
              <span className="text-xs font-medium text-white/90 whitespace-nowrap">
                {status === 'rendered' ? 'Rendered MP4' : 'Live Draft'}
              </span>
              {status !== 'rendered' && isDirty && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  Edited
                </span>
              )}
            </button>

            {/* Expanded Actions: Reset & Bake & Mode Switching */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-1.5 overflow-hidden pl-1 border-l border-white/10"
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
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
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
                          className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-black shadow-md hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
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
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        title="Exit interactive preview mode"
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
                        className="flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-cyan to-blue-500 px-2.5 py-0.5 text-xs font-semibold text-black shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
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

            {/* Collapsible Toggle Chevron */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsCollapsed(!isCollapsed)
              }}
              className="flex items-center justify-center rounded-full p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title={isCollapsed ? 'Expand controls' : 'Collapse controls'}
              aria-label={isCollapsed ? 'Expand controls' : 'Collapse controls'}
            >
              {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
            </button>
          </motion.div>
        </div>
      )}

      {/* Center/Lower: Kinetic Live Typography Subtitles with 960 Reference Frame Proportional Scaling */}
      {status !== 'rendered' && (
        <div
          className="pointer-events-auto absolute inset-x-0 flex justify-center transition-all duration-150"
          style={{
            top: `${positionYPercent}%`,
            transform: 'translateY(-50%)',
            paddingLeft: `${scaledStyle.paddingX}px`,
            paddingRight: `${scaledStyle.paddingX}px`,
          }}
        >
          <AnimatePresence mode="wait">
            {activeChunk && (
              <motion.div
                key={activeChunk.chunkIndex}
                initial={{ opacity: 0, y: Math.max(2, Math.round(4 * scale)), scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -Math.max(2, Math.round(4 * scale)), scale: 0.98 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                className="flex flex-wrap items-center justify-center text-center select-none"
                style={{
                  maxWidth: `${scaledStyle.maxWidthPercent}%`,
                  columnGap: `${scaledStyle.gapX}px`,
                  rowGap: `${scaledStyle.gapY}px`,
                  fontFamily: typography.fontFamily || 'system-ui, sans-serif',
                  fontSize: `${scaledStyle.fontSize}px`,
                  lineHeight: scaledStyle.lineHeight,
                  fontWeight: typography.fontWeight || 800,
                  color: typography.textColor || '#FFFFFF',
                  textShadow: scaledStyle.textShadow,
                  WebkitTextStroke: scaledStyle.strokeWidth
                    ? `${scaledStyle.strokeWidth}px ${typography.strokeColor || '#000000'}`
                    : undefined,
                }}
              >
                {activeChunk.words.map((word: DraftWord, wIdx: number) => {
                  const isWordActive = currentTimeMs >= word.startMs && currentTimeMs <= word.endMs
                  const isCut = Boolean(word.cut)

                  return (
                    <span
                      key={`${activeChunk?.chunkIndex}-${wIdx}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingWord({
                          chunkIndex: activeChunkIdx,
                          wordIndex: wIdx,
                          text: word.text,
                        })
                      }}
                      title="Click to edit text or cut word"
                      style={{
                        padding: `${scaledStyle.wordPaddingY}px ${scaledStyle.wordPaddingX}px`,
                        borderRadius: `${scaledStyle.wordRadius}px`,
                      }}
                      className={`cursor-pointer transition-all duration-75 relative group ${
                        isCut
                          ? 'line-through text-red-400 opacity-40 hover:opacity-80'
                          : isWordActive
                          ? 'scale-110 text-yellow-300 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]'
                          : 'hover:scale-105 hover:bg-white/10'
                      }`}
                    >
                      {word.text}
                    </span>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Word Quick Edit / Cut Minimalist Popover */}
      <AnimatePresence>
        {editingWord && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto absolute inset-x-3 bottom-16 z-40 mx-auto max-w-[280px] rounded-2xl border border-white/20 bg-black/85 p-2.5 shadow-2xl backdrop-blur-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
              <span className="text-[11px] font-semibold text-neutral-300">Edit Word</span>
              <button
                type="button"
                onClick={() => setEditingWord(null)}
                className="text-neutral-400 hover:text-white"
                aria-label="Close word editor"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 mb-2">
              <input
                type="text"
                value={editingWord.text}
                onChange={(e) => setEditingWord({ ...editingWord, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateWordText(editingWord.chunkIndex, editingWord.wordIndex, editingWord.text)
                    setEditingWord(null)
                  } else if (e.key === 'Escape') {
                    setEditingWord(null)
                  }
                }}
                className="flex-1 rounded-lg bg-white/5 border border-white/15 px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-cyan"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  updateWordText(editingWord.chunkIndex, editingWord.wordIndex, editingWord.text)
                  setEditingWord(null)
                }}
                className="flex items-center justify-center rounded-lg bg-accent-cyan px-2 py-1 text-black hover:brightness-110 active:scale-95"
                title="Save changes"
              >
                <Check className="size-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  toggleWordCut(editingWord.chunkIndex, editingWord.wordIndex)
                  setEditingWord(null)
                }}
                className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-red-300 hover:bg-red-500/30 transition-colors w-full justify-center"
              >
                <Scissors className="size-3" />
                <span>Toggle Cut (Jump Skip)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Control Dock: Apple Segmented Pill Track (Non-wrapping, Collapsible, suppressed in subtitles-only mode) */}
      {!subtitlesOnly && (
        <AnimatePresence>
          {!isCollapsed && status !== 'rendered' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto mx-auto mb-3 max-w-[95%]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 rounded-full border border-white/12 bg-black/65 px-2 py-1 shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center gap-1 pl-1 pr-1.5 text-neutral-400">
                  <Type className="size-3 text-accent-cyan" />
                </div>

                {/* Non-wrapping, horizontally scrollable segmented style track */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
                  {TYPOGRAPHY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset.id)
                        setGlobalTypography(preset.styling)
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
                </div>

                {/* Chunk Count Stats */}
                <div className="hidden sm:block pl-1.5 pr-1 border-l border-white/10 text-[10px] text-neutral-400 whitespace-nowrap">
                  {chunks.length} ch
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Bottom spacer for clean margin */}
      <div className="h-1 pointer-events-none" />
    </div>
  )
}
