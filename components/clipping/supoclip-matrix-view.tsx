'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AudioLines,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Download,
  Flame,
  Maximize2,
  Minimize2,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  X,
  Youtube,
  ExternalLink,
} from 'lucide-react'
import {
  type WallClip,
  formatClipDuration,
  getHookTypeLabel,
} from '@/lib/media/youtube-clip-service'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/**
 * Circular SVG Virality Score Ring modeled after SupoClip's ScoreRing.
 */
export function ScoreRing({
  score,
  size = 36,
  strokeWidth = 3,
  className,
}: {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  const ringColor =
    score >= 90
      ? '#ecff49' // High virality yellow-green
      : score >= 80
      ? '#68f0d7' // Good cyan
      : '#f59e0b' // Moderate amber

  return (
    <div
      className={cn('relative inline-flex items-center justify-center font-mono', className)}
      style={{ width: size, height: size }}
      aria-label={`Virality score ${score}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute text-center font-bold tracking-tighter"
        style={{ fontSize: Math.max(9, Math.round(size * 0.32)), color: ringColor }}
      >
        {score}
      </span>
    </div>
  )
}

/**
 * LiquidGL Card Component
 * Emulates high-end liquid glass optics:
 * - Refraction (0.045): subtle dual-layer inner refraction bevels
 * - Aberration (0.6): chromatic iridescent gradient border edge
 * - Bevel Depth (0.119) & Width (0.122): tactile specular light-catching top/inner bevel
 * - Frost (0.4): backdrop-blur-2xl with deep obsidian glass tint
 * - Interactive Tilt (tiltFactor: 5, tiltEase: 400ms): 3D perspective rotation tracking pointer
 * - Specular Sheen (specular: true): dynamic light flare tracking the cursor
 */
function LiquidGLCard({
  clip,
  index,
  isCurrent,
  isBest,
  onClick,
  onCut,
  onDownload,
}: {
  clip: WallClip
  index: number
  isCurrent: boolean
  isBest: boolean
  onClick: () => void
  onCut: (e: React.MouseEvent) => void
  onDownload: (e: React.MouseEvent) => void
}) {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })
  const [glare, setGlare] = React.useState({ x: 50, y: 50, opacity: 0 })

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

    // tiltFactor: 5 -> max +/- 5 deg
    const tiltX = (py - 0.5) * -10
    const tiltY = (px - 0.5) * 10

    setTilt({ x: tiltX, y: tiltY })
    setGlare({ x: px * 100, y: py * 100, opacity: 0.65 })
  }

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 })
    setGlare({ x: 50, y: 50, opacity: 0 })
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl transition-all',
        isCurrent ? 'ring-2 ring-[#ecff49] shadow-[0_0_30px_rgba(236,255,73,0.35)]' : ''
      )}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`,
        transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 400ms ease',
        background: 'rgba(10, 10, 14, 0.68)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
        boxShadow: isCurrent
          ? 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.9), 0 20px 45px -10px rgba(0, 0, 0, 0.8)'
          : 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.32), inset 1px 0 2px 0 rgba(255, 255, 255, 0.08), inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.8), 0 16px 40px -12px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Chromatic Aberration Iridescent Edge Sheen (aberration: 0.6) */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-2xl transition-opacity duration-500"
        style={{
          opacity: isCurrent ? 0.95 : 0.45,
          background: isCurrent
            ? 'linear-gradient(135deg, rgba(236,255,73,0.85) 0%, rgba(104,240,215,0.7) 45%, rgba(244,63,94,0.6) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(104,240,215,0.2) 30%, rgba(236,255,73,0.18) 65%, rgba(244,63,94,0.25) 100%)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* Dynamic Specular Light Glare (specular: true) */}
      <div
        className="pointer-events-none absolute inset-0 z-30 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle 180px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 75%)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* 9:16 Vertical Video / Thumbnail Chamber */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-black/80">
        {clip.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clip.thumbnail_url}
            alt={clip.hook_title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white/20">
            <Clapperboard className="size-8 animate-pulse text-[#ecff49]/40" />
          </div>
        )}

        {/* Liquid Refraction Vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/45" />

        {/* Top Pick Pill */}
        {isBest && (
          <div className="absolute left-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-[#ecff49] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-black shadow-lg">
            <Flame className="size-3 fill-current" /> Top pick
          </div>
        )}

        {/* Score Ring Glass Dock */}
        {clip.virality_score > 0 && (
          <div className="absolute right-2.5 top-2.5 z-20 rounded-full border border-white/20 bg-black/60 p-0.5 shadow-xl backdrop-blur-md">
            <ScoreRing score={clip.virality_score} size={36} />
          </div>
        )}

        {/* Play Action Hover Glass Pill */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex size-12 items-center justify-center rounded-full border border-white/40 bg-white/90 text-black shadow-2xl transition-transform duration-300 group-hover:scale-105">
            <Play className="ml-0.5 size-5 fill-current" />
          </div>
        </div>

        {/* 9:16 Framing Bounding Indicator (Micro Watermark) */}
        {clip.cropRect && (
          <div
            className="pointer-events-none absolute inset-y-0 border-x border-[#ecff49]/30 bg-[#ecff49]/[0.03] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              left: `${clip.cropRect.left}%`,
              width: `${clip.cropRect.width}%`,
            }}
          />
        )}

        {/* Duration Pill */}
        <div className="absolute bottom-2.5 right-2.5 z-20 rounded-md border border-white/10 bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-white/90 shadow backdrop-blur-sm">
          {formatClipDuration(clip.duration)}
        </div>
      </div>

      {/* Details Glass Deck */}
      <div className="relative z-10 flex flex-1 flex-col p-3">
        <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-white/90 transition-colors group-hover:text-white">
          {clip.hook_title}
        </h4>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/50">
          <span className="font-mono tabular-nums text-white/70">
            {clip.start_time} - {clip.end_time}
          </span>
          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 font-medium text-[#ecff49]/90">
            {getHookTypeLabel(clip.hook_type)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 border-white/15 bg-white/[0.06] px-2 text-[11px] font-medium text-white transition hover:border-[#ecff49]/40 hover:bg-[#ecff49]/15 hover:text-[#ecff49]"
            onClick={onCut}
          >
            <Scissors className="mr-1 size-3" />
            Cut
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="size-7 p-0 text-white/50 transition hover:bg-white/15 hover:text-white"
            onClick={onDownload}
            title="Download clip window"
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * LiquidGL Skeleton Loader
 * Displays 4 shimmering frosted glass cards while the pipeline ingests and analyzes.
 */
function LiquidGLSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c11]/60 p-0 shadow-xl backdrop-blur-2xl"
          style={{
            boxShadow:
              'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* 9:16 Aspect Shimmer Box */}
          <div className="relative aspect-[9/16] w-full overflow-hidden bg-white/[0.03]">
            <motion.div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
              animate={{ translateX: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut', delay: i * 0.2 }}
            />
            <div className="absolute right-2.5 top-2.5 size-9 rounded-full border border-white/10 bg-white/[0.04]" />
            <div className="absolute bottom-2.5 right-2.5 h-4 w-10 rounded bg-white/[0.06]" />
          </div>
          {/* Deck Shimmer */}
          <div className="space-y-2 p-3">
            <div className="h-3.5 w-4/5 rounded bg-white/[0.06]" />
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-1/3 rounded bg-white/[0.04]" />
              <div className="h-2.5 w-1/4 rounded bg-white/[0.04]" />
            </div>
            <div className="mt-2 h-7 w-full rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  )
}

const STEPS = [
  { label: 'Fetching video', icon: Download },
  { label: 'Transcribing', icon: AudioLines },
  { label: 'Finding moments', icon: Sparkles },
  { label: 'Rendering clips', icon: Clapperboard },
]

export interface SupoClipMatrixViewProps {
  videoId?: string | null
  sourceUrl?: string | null
  clips: WallClip[]
  activeClipId?: string | null
  isProcessing?: boolean
  processingStep?: number
  onSelectClip?: (clip: WallClip) => void
  onClose?: () => void
  className?: string
}

export function SupoClipMatrixView({
  videoId,
  sourceUrl,
  clips,
  activeClipId,
  isProcessing = false,
  processingStep = 3,
  onSelectClip,
  onClose,
  className,
}: SupoClipMatrixViewProps) {
  const [focusedClip, setFocusedClip] = React.useState<WallClip | null>(null)
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0)
  const [isPlayingFocusVideo, setIsPlayingFocusVideo] = React.useState(false)
  const [filterMode, setFilterMode] = React.useState<'all' | 'top' | 'short'>('all')

  const processedClips = React.useMemo(() => {
    let result = [...clips]
    if (filterMode === 'top') {
      result = result.filter((c) => c.virality_score >= 90)
    } else if (filterMode === 'short') {
      result = result.filter((c) => c.duration <= 45)
    }
    return result
  }, [clips, filterMode])

  const handleOpenFocus = (clip: WallClip, index: number) => {
    setFocusedClip(clip)
    setFocusedIndex(index)
    setIsPlayingFocusVideo(false)
  }

  const handleNavigateFocus = (delta: number) => {
    if (clips.length === 0) return
    const nextIndex = (focusedIndex + delta + clips.length) % clips.length
    setFocusedIndex(nextIndex)
    setFocusedClip(clips[nextIndex] ?? null)
    setIsPlayingFocusVideo(false)
  }

  const handleDownload = (clip: WallClip, e?: React.MouseEvent) => {
    e?.stopPropagation()
    toast.success(`Exporting ${clip.hook_title}`, {
      description: `Clip window (${clip.start_time} - ${clip.end_time}) ready for download.`,
    })
  }

  const handleApplyToEditor = (clip: WallClip, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onSelectClip?.(clip)
    toast.success(`Active cut focused: ${clip.hook_title}`, {
      description: `Transport aligned to ${clip.start_time} with vertical 9:16 framing.`,
    })
  }

  const bestClipId =
    clips.length > 0
      ? [...clips].sort((a, b) => b.virality_score - a.virality_score)[0]?.id
      : null

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07070a]/85 text-white shadow-2xl backdrop-blur-2xl',
        className
      )}
      style={{
        boxShadow:
          'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.8), 0 25px 60px -15px rgba(0, 0, 0, 0.9)',
      }}
      aria-label="SupoClip Viral Matrix Chamber"
    >
      {/* Chamber Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-black/45 px-4 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ff0033]/20 text-[#ff0033] shadow-inner">
            <Youtube className="size-4 fill-current" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-semibold uppercase tracking-wider text-white/95">
                SupoClip Matrix
              </span>
              <span className="rounded-full border border-[#ecff49]/40 bg-[#ecff49]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ecff49]">
                Live AI
              </span>
            </div>
            <p className="truncate font-mono text-[10px] text-white/45">
              {sourceUrl
                ? sourceUrl.replace(/^https?:\/\//, '')
                : videoId
                ? `ID: ${videoId}`
                : 'YouTube Stream'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {sourceUrl && (
            <a
              href={sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
              title="Open YouTube video in new tab"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Close SupoClip Matrix"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Processing Banner (SupoClip Step Pipeline) */}
      <div className="border-b border-white/[0.06] bg-white/[0.02] p-3.5">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 font-medium text-white/85">
            <Sparkles className="size-3 text-[#ecff49]" />
            {isProcessing ? 'Analyzing Moments & Retention Cadence...' : 'Matrix Synchronized'}
          </span>
          <span className="font-mono text-[10px] text-white/45">
            {clips.length} Short-Form Cut{clips.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Animated sheen progress track */}
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-[#2c7df7] via-[#ecff49] to-[#68f0d7]"
            initial={{ width: '15%' }}
            animate={{ width: isProcessing ? '75%' : '100%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        {/* 4 Step Badges */}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {STEPS.map((step, idx) => {
            const isDone = processingStep > idx || !isProcessing
            const isActive = processingStep === idx && isProcessing
            const Icon = step.icon

            return (
              <div
                key={step.label}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border px-1.5 py-1 text-center transition-colors',
                  isDone
                    ? 'border-white/10 bg-white/[0.04] text-white/80'
                    : isActive
                    ? 'border-[#ecff49]/40 bg-[#ecff49]/10 text-[#ecff49]'
                    : 'border-white/5 bg-transparent text-white/30'
                )}
              >
                <Icon className="size-3" />
                <span className="truncate text-[9px] font-medium leading-none">{step.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Clips Wall Scrollable Area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-medium transition',
                filterMode === 'all'
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              )}
            >
              All ({clips.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('top')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition',
                filterMode === 'top'
                  ? 'bg-[#ecff49]/20 text-[#ecff49]'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              )}
            >
              <Flame className="size-3" /> Top 90%+
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('short')}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-medium transition',
                filterMode === 'short'
                  ? 'bg-[#68f0d7]/20 text-[#68f0d7]'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              )}
            >
              &le; 45s
            </button>
          </div>
          <span className="text-[10px] text-white/30">Click to focus</span>
        </div>

        {isProcessing && clips.length === 0 ? (
          <LiquidGLSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            {processedClips.map((clip, index) => {
              const isBest = clip.id === bestClipId
              const isCurrent = clip.id === activeClipId

              return (
                <LiquidGLCard
                  key={clip.id}
                  clip={clip}
                  index={index}
                  isCurrent={isCurrent}
                  isBest={isBest}
                  onClick={() => handleOpenFocus(clip, index)}
                  onCut={(e) => handleApplyToEditor(clip, e)}
                  onDownload={(e) => handleDownload(clip, e)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* ClipFocus Dialog (SupoClip Modal Inspection View) */}
      <Dialog open={focusedClip !== null} onOpenChange={(open) => !open && setFocusedClip(null)}>
        <DialogContent className="max-h-[92dvh] max-w-4xl gap-0 overflow-hidden border-white/10 bg-[#0e0e12]/95 p-0 text-white backdrop-blur-2xl md:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          {focusedClip && (
            <>
              {/* Left Side: 9:16 Video Stage */}
              <div className="relative flex items-center justify-center bg-black p-4">
                <div className="relative aspect-[9/16] w-full max-h-[75dvh] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                  {isPlayingFocusVideo && (videoId || focusedClip.id.replace(/^supoclip-/, '').split('-')[0]) ? (
                    <div className="relative h-full w-full">
                      {(() => {
                        const targetYtId =
                          videoId ||
                          focusedClip.id.replace(/^supoclip-/, '').split('-')[0]
                        const parts = focusedClip.start_time.split(':').map(Number)
                        const startSec = (parts[0] || 0) * 60 + (parts[1] || 0)
                        const endSec = startSec + focusedClip.duration
                        return (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${targetYtId}?start=${startSec}&end=${endSec}&autoplay=1&controls=1&modestbranding=1&rel=0`}
                            title={focusedClip.hook_title}
                            className="h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )
                      })()}
                      <button
                        type="button"
                        onClick={() => setIsPlayingFocusVideo(false)}
                        className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white/70 shadow-md backdrop-blur-sm transition hover:bg-black hover:text-white"
                        title="Back to poster"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {focusedClip.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={focusedClip.thumbnail_url}
                          alt={focusedClip.hook_title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                      <button
                        type="button"
                        onClick={() => setIsPlayingFocusVideo(true)}
                        className="group absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/10"
                        aria-label="Play YouTube clip segment"
                      >
                        <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow-xl transition-transform group-hover:scale-110">
                          <Play className="ml-0.5 size-6 fill-current" />
                        </span>
                      </button>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-xs text-white/80">
                        <span className="rounded bg-black/60 px-2 py-0.5">{focusedClip.start_time}</span>
                        <span className="rounded bg-black/60 px-2 py-0.5">{focusedClip.end_time}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side: Score Breakdown & Details */}
              <div className="flex min-h-0 flex-col overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3 pr-12 text-xs text-white/50">
                  <span className="font-mono">
                    Clip {focusedIndex + 1} of {clips.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-white/60 hover:bg-white/10 hover:text-white"
                      onClick={() => handleNavigateFocus(-1)}
                      aria-label="Previous clip"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-white/60 hover:bg-white/10 hover:text-white"
                      onClick={() => handleNavigateFocus(1)}
                      aria-label="Next clip"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <DialogTitle className="font-display text-xl font-bold leading-tight text-white">
                      {focusedClip.hook_title}
                    </DialogTitle>
                    <DialogDescription className="mt-1 font-mono text-xs text-white/50">
                      {focusedClip.start_time} – {focusedClip.end_time} · {formatClipDuration(focusedClip.duration)} duration
                    </DialogDescription>
                  </div>

                  {/* SupoClip Virality Score Card */}
                  <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-4">
                      <ScoreRing score={focusedClip.virality_score} size={54} strokeWidth={4} />
                      <div>
                        <p className="text-sm font-semibold text-white">Virality Score</p>
                        <p className="text-xs text-white/50">
                          {getHookTypeLabel(focusedClip.hook_type)} · {Math.round(focusedClip.relevance_score * 100)}% thematic retention
                        </p>
                      </div>
                    </div>

                    {/* 4-Metric Breakdown */}
                    <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-white/[0.06] pt-3">
                      {[
                        { label: 'Hook', value: focusedClip.hook_score, icon: MessageSquare },
                        { label: 'Engagement', value: focusedClip.engagement_score, icon: TrendingUp },
                        { label: 'Value', value: focusedClip.value_score, icon: Star },
                        { label: 'Shareability', value: focusedClip.shareability_score, icon: Share2 },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-white/50">
                              <Icon className="size-3" />
                              {label}
                            </span>
                            <span className="font-mono font-medium tabular-nums text-white/90">
                              {value}/25
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[#ecff49] transition-[width] duration-500"
                              style={{ width: `${(value / 25) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Transcript Preview */}
                  {focusedClip.text && (
                    <section className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        Spoken Transcript Excerpt
                      </p>
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs leading-relaxed text-white/80">
                        &ldquo;{focusedClip.text}&rdquo;
                      </div>
                    </section>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-white/[0.08] bg-black/30 px-6 py-3.5">
                  <Button
                    size="sm"
                    className="bg-[#ecff49] text-black hover:bg-[#d8ea38]"
                    onClick={() => {
                      handleApplyToEditor(focusedClip)
                      setFocusedClip(null)
                    }}
                  >
                    <Scissors className="mr-1.5 size-3.5" />
                    Open in Editor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/10"
                    onClick={() => handleDownload(focusedClip)}
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-white/40 hover:text-white"
                    onClick={() => setFocusedClip(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  )
}
