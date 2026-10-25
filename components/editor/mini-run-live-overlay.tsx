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
  type DraftTypographyLayer,
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
  layersTemplate?: {
    secondary?: Partial<DraftTypographyLayer>
    hero?: Partial<DraftTypographyLayer>
  }
}> = [
  {
    id: 'didone_luxury',
    label: 'Because Your Brain (Didone)',
    shortLabel: 'Didone',
    styling: {
      fontFamily: "'Playfair Display', 'Bodoni Moda', serif",
      fontWeight: 800,
      textColor: '#F5E6C4',
      shadow: '0 4px 20px rgba(0,0,0,0.9), 0 0 16px rgba(245,230,196,0.45)',
      strokeWidth: 0,
      fontSize: 42,
    },
    layersTemplate: {
      secondary: {
        fontFamily: "'Playfair Display', serif",
        fontWeight: 600,
        fontStyle: 'italic',
        fontSizePx: 68,
        color: '#FFFFFF',
      },
      hero: {
        fontFamily: "'Playfair Display', 'Bodoni Moda', serif",
        fontWeight: 800,
        fontStyle: 'italic',
        fontSizePx: 130,
        color: '#F5E6C4',
      },
    },
  },
  {
    id: 'editorial_migra',
    label: 'High-Fashion Migra',
    shortLabel: 'Migra',
    styling: {
      fontFamily: "var(--font-migra), 'Playfair Display', serif",
      fontWeight: 800,
      textColor: '#FFFFFF',
      shadow: '0 4px 18px rgba(0,0,0,0.85)',
      strokeWidth: 0,
      fontSize: 40,
    },
    layersTemplate: {
      secondary: {
        fontFamily: "var(--font-migra), serif",
        fontWeight: 400,
        fontStyle: 'normal',
        fontSizePx: 64,
        color: '#FFFFFF',
      },
      hero: {
        fontFamily: "var(--font-migra), serif",
        fontWeight: 800,
        fontStyle: 'italic',
        fontSizePx: 124,
        color: '#FEE199',
      },
    },
  },
  {
    id: 'expressive_zt_otez',
    label: 'Expressive ZT Otez',
    shortLabel: 'ZT Otez',
    styling: {
      fontFamily: "var(--font-zt-otez), var(--font-elegist), serif",
      fontWeight: 700,
      textColor: '#FFFFFF',
      shadow: '0 4px 15px rgba(0,0,0,0.9), 0 0 20px rgba(250,204,21,0.3)',
      strokeWidth: 0,
      fontSize: 40,
    },
    layersTemplate: {
      secondary: {
        fontFamily: "var(--font-elegist), serif",
        fontWeight: 600,
        fontStyle: 'normal',
        fontSizePx: 60,
        color: '#E2E8F0',
      },
      hero: {
        fontFamily: "var(--font-zt-otez), serif",
        fontWeight: 800,
        fontStyle: 'italic',
        fontSizePx: 120,
        color: '#FACC15',
      },
    },
  },
  {
    id: 'bold_grotesque',
    label: 'Bold Grotesque',
    shortLabel: 'Grotesque',
    styling: {
      fontFamily: "'Montserrat', 'Bebas Neue', 'Impact', sans-serif",
      fontWeight: 900,
      textColor: '#FACC15',
      shadow: '0 4px 20px rgba(0,0,0,0.95)',
      strokeColor: '#000000',
      strokeWidth: 2,
      fontSize: 42,
    },
    layersTemplate: {
      secondary: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 800,
        fontStyle: 'normal',
        fontSizePx: 64,
        color: '#FFFFFF',
      },
      hero: {
        fontFamily: "'Montserrat', 'Bebas Neue', sans-serif",
        fontWeight: 900,
        fontStyle: 'normal',
        fontSizePx: 126,
        color: '#FACC15',
      },
    },
  },
  {
    id: 'cinematic_cinzel',
    label: 'Old-Money Cinzel',
    shortLabel: 'Cinzel',
    styling: {
      fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
      fontWeight: 700,
      textColor: '#F8FAFC',
      shadow: '0 2px 14px rgba(0,0,0,0.85), 0 0 15px rgba(255,255,255,0.3)',
      strokeWidth: 0,
      fontSize: 38,
    },
    layersTemplate: {
      secondary: {
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 600,
        fontStyle: 'italic',
        fontSizePx: 64,
        color: '#E2E8F0',
      },
      hero: {
        fontFamily: "'Cinzel', serif",
        fontWeight: 800,
        fontStyle: 'normal',
        fontSizePx: 118,
        color: '#FFFFFF',
      },
    },
  },
]

export function resolveFontFamily(family?: string): string {
  if (!family) return "'Playfair Display', Georgia, serif"
  const clean = family.trim().replace(/^['"]|['"]$/g, '')
  const lower = clean.toLowerCase()

  if (lower.includes('playfair')) return "'Playfair Display', Georgia, serif"
  if (lower.includes('bodoni')) return "'Bodoni Moda', 'Didot', 'Bodoni MT', serif"
  if (lower.includes('migra')) return "var(--font-migra), 'Playfair Display', serif"
  if (lower.includes('vogue')) return "var(--font-vogue-display), 'Didot', serif"
  if (lower.includes('zt otez') || lower.includes('ztotez')) return "var(--font-zt-otez), serif"
  if (lower.includes('black delights')) return "var(--font-black-delights), cursive, serif"
  if (lower.includes('elegist')) return "var(--font-elegist), serif"
  if (lower.includes('montserrat')) return "'Montserrat', -apple-system, sans-serif"
  if (lower.includes('cinzel')) return "'Cinzel', 'Times New Roman', serif"
  if (lower.includes('cormorant')) return "'Cormorant Garamond', Georgia, serif"
  if (lower.includes('bebas') || lower.includes('anton') || lower.includes('impact')) return "'Bebas Neue', 'Impact', sans-serif"
  if (lower.includes('italiana')) return "'Italiana', serif"
  if (lower.includes('lora')) return "'Lora', serif"
  if (lower.includes('oswald')) return "'Oswald', sans-serif"
  if (lower.includes('abril')) return "'Abril Fatface', serif"
  if (lower.includes('alex brush') || lower.includes('great vibes') || lower.includes('pinyon')) return "'Alex Brush', cursive"

  return `"${clean}", system-ui, sans-serif`
}

export interface MiniRunLiveOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  projectId?: string | null
  sourceAssetId?: string | null
  defaultCollapsed?: boolean
  onHoverChange?: (isHovered: boolean) => void
  hoverPlayEnabled?: boolean
  aspectRatio?: number
  subtitlesOnly?: boolean
  active?: boolean
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
  active = true,
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
    if (!active) return
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
  }, [chunks, videoRef, active])

  // Also listen to explicit video seek/timeupdate events
  React.useEffect(() => {
    if (!active) return
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
  }, [videoRef, active])

  // Instantaneous playback: ensures the preview plays the moment the page and video load
  React.useEffect(() => {
    if (subtitlesOnly) return
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

  // Keep this hook above the empty-draft returns: plans can load or reset while mounted.
  // Pre-warm all font combinations declared in chunks to eliminate font swap latency.
  React.useEffect(() => {
    if (chunks.length === 0 || typeof document === 'undefined' || !document.fonts) return
    const families = new Set<string>()
    chunks.forEach((c) => {
      if (c.layers) {
        c.layers.forEach((l) => {
          if (l.fontFamily) families.add(l.fontFamily)
          if (l.accentFont) families.add(l.accentFont)
        })
      }
      if (c.typography?.fontFamily) families.add(c.typography.fontFamily)
    })
    TYPOGRAPHY_PRESETS.forEach((p) => {
      if (p.styling.fontFamily) families.add(p.styling.fontFamily)
      if (p.layersTemplate?.secondary?.fontFamily) families.add(p.layersTemplate.secondary.fontFamily)
      if (p.layersTemplate?.hero?.fontFamily) families.add(p.layersTemplate.hero.fontFamily)
    })

    families.forEach((fam) => {
      const resolved = resolveFontFamily(fam)
      try {
        void document.fonts.load(`48px ${resolved}`)
        void document.fonts.load(`italic 48px ${resolved}`)
        void document.fonts.load(`800 48px ${resolved}`)
      } catch {}
    })
  }, [chunks])

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
  const scaledStyle = getScaledTypography(
    typography,
    activeChunk?.placement,
    activeChunk?.layers
  )
  const positionYPercent = scaledStyle.positionYPercent
  const positionXPercent = scaledStyle.positionXPercent ?? 50
  const anchor = scaledStyle.anchor || 'center'

  if (!active) return null

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
          className="pointer-events-auto absolute flex justify-center transition-[top,left,transform] duration-150 ease-out"
          style={{
            top: `${positionYPercent}%`,
            left: `${positionXPercent}%`,
            transform: `translate(${anchor === 'left' ? '0%' : anchor === 'right' ? '-100%' : '-50%'}, -50%)`,
            width: '100%',
            maxWidth: `${scaledStyle.maxWidthPercent}%`,
            paddingLeft: `${scaledStyle.paddingX}px`,
            paddingRight: `${scaledStyle.paddingX}px`,
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {activeChunk && (
              <motion.div
                key={activeChunk.chunkIndex}
                initial={{ opacity: 0, y: Math.max(2, Math.round(4 * scale)), scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -Math.max(2, Math.round(4 * scale)), scale: 0.98 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                className="w-full flex flex-col items-center justify-center text-center select-none"
              >
                {activeChunk.layers && activeChunk.layers.length > 0 ? (
                  <div className="flex flex-col items-center justify-center text-center gap-1 w-full">
                    {activeChunk.layers.map((layer, lIdx) => {
                      const scaledLayer = scaledStyle.layers?.[lIdx]
                      const isHero = Boolean(layer.isHero)
                      const layerFontSize =
                        scaledLayer?.fontSize ??
                        (isHero ? Math.round(scaledStyle.fontSize * 1.5) : scaledStyle.fontSize)
                      const layerFontFamily = resolveFontFamily(layer.fontFamily)
                      const layerColor = layer.color || (isHero ? '#F5E6C4' : '#FFFFFF')

                      const layerWords: DraftWord[] =
                        layer.words && layer.words.length > 0
                          ? layer.words
                          : layer.text.split(' ').map((t, idx, arr) => ({
                              text: t,
                              startMs:
                                activeChunk.startMs +
                                Math.round((idx / Math.max(1, arr.length)) * (activeChunk.endMs - activeChunk.startMs)),
                              endMs: activeChunk.endMs,
                              cut: false,
                            }))

                      return (
                        <div
                          key={`layer-${lIdx}`}
                          className="flex flex-wrap items-baseline justify-center text-center select-none"
                          style={{
                            fontFamily: layerFontFamily,
                            fontSize: `${layerFontSize}px`,
                            lineHeight: layer.lineHeight || (isHero ? 1.0 : 1.15),
                            fontWeight: layer.fontWeight || (isHero ? 800 : 600),
                            fontStyle: layer.fontStyle || (isHero ? 'italic' : 'normal'),
                            color: layerColor,
                            textShadow:
                              scaledLayer?.textShadow ||
                              (isHero
                                ? '0 2px 14px rgba(0,0,0,0.9), 0 0 16px rgba(245,230,196,0.45)'
                                : scaledStyle.textShadow),
                            letterSpacing:
                              typeof layer.letterSpacingEm === 'number'
                                ? `${layer.letterSpacingEm}em`
                                : undefined,
                            textTransform: layer.casing === 'uppercase' ? 'uppercase' : undefined,
                            columnGap: `${scaledStyle.gapX}px`,
                            rowGap: `${scaledStyle.gapY}px`,
                          }}
                        >
                          {layerWords.map((word, wIdx) => {
                            const isWordActive = currentTimeMs >= word.startMs && currentTimeMs <= word.endMs
                            const isCut = Boolean(word.cut)

                            return (
                              <span
                                key={`lw-${lIdx}-${wIdx}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const overallWIdx = activeChunk.words.findIndex(
                                    (cw) => cw.startMs === word.startMs && cw.text === word.text
                                  )
                                  setEditingWord({
                                    chunkIndex: activeChunkIdx,
                                    wordIndex: overallWIdx >= 0 ? overallWIdx : wIdx,
                                    text: word.text,
                                  })
                                }}
                                title="Click to edit text or cut word"
                                style={{
                                  padding: `${scaledStyle.wordPaddingY}px ${scaledStyle.wordPaddingX}px`,
                                  borderRadius: `${scaledStyle.wordRadius}px`,
                                }}
                                className={`cursor-pointer transition-[transform,color,opacity] duration-75 relative group ${
                                  isCut
                                    ? 'line-through text-red-400 opacity-40 hover:opacity-80'
                                    : isWordActive
                                    ? isHero
                                      ? 'scale-110 text-[#F5E6C4] drop-shadow-[0_0_16px_rgba(245,230,196,0.95)]'
                                      : 'scale-110 text-yellow-300 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]'
                                    : 'hover:scale-105 hover:bg-white/10'
                                }`}
                              >
                                {word.text}
                              </span>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div
                    className="flex flex-wrap items-center justify-center text-center select-none"
                    style={{
                      maxWidth: `${scaledStyle.maxWidthPercent}%`,
                      columnGap: `${scaledStyle.gapX}px`,
                      rowGap: `${scaledStyle.gapY}px`,
                      fontFamily: resolveFontFamily(typography.fontFamily),
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
                          className={`cursor-pointer transition-[transform,color,opacity] duration-75 relative group ${
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
                  </div>
                )}
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
