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

  const bestClipId = clips.length > 0
    ? [...clips].sort((a, b) => b.virality_score - a.virality_score)[0]?.id
    : null

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] text-white shadow-2xl',
        className
      )}
      aria-label="SupoClip Viral Matrix Chamber"
    >
      {/* Chamber Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-black/40 px-4 py-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ff0033]/20 text-[#ff0033]">
            <Youtube className="size-4 fill-current" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-semibold uppercase tracking-wider text-white/90">
                SupoClip Matrix
              </span>
              <span className="rounded-full border border-[#ecff49]/30 bg-[#ecff49]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ecff49]">
                Live AI
              </span>
            </div>
            <p className="truncate font-mono text-[10px] text-white/45">
              {sourceUrl ? sourceUrl.replace(/^https?:\/\//, '') : videoId ? `ID: ${videoId}` : 'YouTube Stream'}
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
          <span className="flex items-center gap-1.5 font-medium text-white/80">
            <Sparkles className="size-3 text-[#ecff49]" />
            {isProcessing ? 'Analyzing Moments & Retention Cadence' : 'Matrix Synchronized'}
          </span>
          <span className="font-mono text-[10px] text-white/40">
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
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
            Candidate Cuts ({clips.length})
          </p>
          <span className="text-[10px] text-white/30">Click to focus & inspect</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {clips.map((clip, index) => {
            const isBest = clip.id === bestClipId
            const isCurrent = clip.id === activeClipId

            return (
              <article
                key={clip.id}
                onClick={() => handleOpenFocus(clip, index)}
                className={cn(
                  'group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/10 bg-[#121216] transition-all hover:-translate-y-0.5 hover:border-white/30 hover:shadow-xl',
                  isCurrent && 'ring-2 ring-[#ecff49]'
                )}
              >
                {/* 9:16 Vertical Video / Thumbnail Container */}
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
                  {clip.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clip.thumbnail_url}
                      alt={clip.hook_title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white/20">
                      <Clapperboard className="size-8" />
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35" />

                  {/* Top pick badge */}
                  {isBest && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#ecff49] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow">
                      <Flame className="size-3 fill-current" /> Top pick
                    </span>
                  )}

                  {/* Virality Score Ring */}
                  {clip.virality_score > 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/60 p-0.5 backdrop-blur-sm">
                      <ScoreRing score={clip.virality_score} size={34} />
                    </span>
                  )}

                  {/* Center Play Button on hover */}
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                      <Play className="ml-0.5 size-5 fill-current" />
                    </span>
                  </span>

                  {/* Duration Pill */}
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-white/90">
                    {formatClipDuration(clip.duration)}
                  </span>
                </div>

                {/* Details Footer */}
                <div className="flex flex-1 flex-col p-2.5">
                  <h4 className="line-clamp-2 text-xs font-semibold leading-tight text-white/90 group-hover:text-white">
                    {clip.hook_title}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-white/45">
                    <span className="font-mono tabular-nums">{clip.start_time} - {clip.end_time}</span>
                    <span className="text-[#ecff49]/80">{getHookTypeLabel(clip.hook_type)}</span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 border-white/10 bg-white/[0.04] px-2 text-[11px] text-white hover:bg-white/15"
                      onClick={(e) => handleApplyToEditor(clip, e)}
                    >
                      <Scissors className="size-3 mr-1" />
                      Cut
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-7 p-0 text-white/50 hover:bg-white/10 hover:text-white"
                      onClick={(e) => handleDownload(clip, e)}
                      title="Download clip"
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {/* ClipFocus Dialog (SupoClip Modal Inspection View) */}
      <Dialog open={focusedClip !== null} onOpenChange={(open) => !open && setFocusedClip(null)}>
        <DialogContent className="max-h-[92dvh] max-w-4xl gap-0 overflow-hidden border-white/10 bg-[#0e0e12] p-0 text-white md:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          {focusedClip && (
            <>
              {/* Left Side: 9:16 Video Stage */}
              <div className="relative flex items-center justify-center bg-black p-4">
                <div className="relative aspect-[9/16] w-full max-h-[75dvh] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
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
                    onClick={() => setIsPlayingFocusVideo((prev) => !prev)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/10"
                    aria-label={isPlayingFocusVideo ? 'Pause clip' : 'Play clip'}
                  >
                    <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow-xl">
                      {isPlayingFocusVideo ? (
                        <Pause className="size-6 fill-current" />
                      ) : (
                        <Play className="ml-0.5 size-6 fill-current" />
                      )}
                    </span>
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white/80">
                    <span className="rounded bg-black/60 px-2 py-0.5">{focusedClip.start_time}</span>
                    <span className="rounded bg-black/60 px-2 py-0.5">{focusedClip.end_time}</span>
                  </div>
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
                    <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 pt-3 border-t border-white/[0.06]">
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
                            <span className="font-mono font-medium text-white/90 tabular-nums">
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
                    <Scissors className="size-3.5 mr-1.5" />
                    Open in Editor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/10"
                    onClick={() => handleDownload(focusedClip)}
                  >
                    <Download className="size-3.5 mr-1.5" />
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
