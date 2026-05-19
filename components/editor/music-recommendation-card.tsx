'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Pause, Plus } from 'lucide-react'

import { MusicCoverBubble } from '@/components/editor/music-cover-bubble'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { buildRevealVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { MusicRecommendation } from '@/lib/types'

export function MusicRecommendationCard({
  recommendation,
  isPreviewing,
  isStaged,
  onPreviewToggle,
  onAdd,
  viewportRoot,
  revealDelay = 0,
}: {
  recommendation: MusicRecommendation
  isPreviewing: boolean
  isStaged: boolean
  onPreviewToggle: (recommendation: MusicRecommendation) => void
  onAdd: (recommendation: MusicRecommendation) => void
  viewportRoot?: React.RefObject<HTMLDivElement | null>
  revealDelay?: number
}) {
  const reduceMotion = useStableReducedMotion()
  const [isHovered, setIsHovered] = React.useState(false)
  const showExpandedPreview = isHovered || isPreviewing
  const producerLabel =
    recommendation.producer.trim() &&
    recommendation.producer.trim().toLowerCase() !== recommendation.artist.trim().toLowerCase()
      ? recommendation.producer.trim()
      : ''
  const revealVariants = React.useMemo(
    () => buildRevealVariants({ delay: revealDelay, distance: 16, scale: 0.985, blur: 10, duration: 0.3 }),
    [revealDelay],
  )
  const tone = getRecommendationTone(recommendation.groupKey)
  const tempoLabel =
    recommendation.tempoWindow?.length === 2
      ? `${recommendation.tempoWindow[0]}-${recommendation.tempoWindow[1]} BPM`
      : `${recommendation.bpm} BPM`

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      exit={reduceMotion ? undefined : 'exit'}
      viewport={reduceMotion ? undefined : { root: viewportRoot, once: false, amount: 0.35 }}
      variants={reduceMotion ? undefined : revealVariants}
      className={cn(
        'group relative w-full overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,rgba(16,18,24,0.98)_0%,rgba(10,10,14,0.96)_100%)] p-3 shadow-[0_24px_54px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md transition-all duration-300',
        tone.border,
        isPreviewing && tone.previewBorder,
        isPreviewing && "scale-[1.01] shadow-[0_32px_64px_-24px_rgba(0,0,0,0.95)]"
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => onPreviewToggle(recommendation)}
          aria-label={
            isPreviewing ? `Pause preview for ${recommendation.title}` : `Play preview for ${recommendation.title}`
          }
          whileHover={reduceMotion ? undefined : { y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          className={cn(
            'flex h-16 min-w-0 flex-1 items-center overflow-hidden rounded-[22px] bg-black/40 px-4 text-left border border-white/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            isPreviewing ? tone.previewShadow : 'shadow-inner shadow-white/5',
          )}
        >
          <motion.div
            className="relative shrink-0"
            animate={isPreviewing ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <MusicCoverBubble
              src={recommendation.coverArtUrl}
              alt={recommendation.title}
              position={recommendation.coverArtPosition ?? 'center'}
              className={cn(
                'h-11 w-11 rounded-[14px]',
                isPreviewing ? tone.previewBubble : 'shadow-lg',
              )}
            />
            {isPreviewing && (
              <motion.div 
                layoutId={`pulse-${recommendation.id}`}
                className="absolute -inset-1 rounded-[16px] border border-[#7ff2d4]/40"
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>

          <div className="min-w-0 flex-1 pl-4">
            <div className="truncate text-[15px] font-black leading-tight tracking-tight text-white/95">
              {recommendation.title}
            </div>
            <div className="truncate text-[12px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
              {recommendation.artist}
              {producerLabel ? ` | ${producerLabel}` : ''}
            </div>
            {typeof recommendation.matchScore === 'number' ? (
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.04] shadow-inner">
                <motion.div
                  className={cn('h-full rounded-full', tone.bar)}
                  animate={reduceMotion ? undefined : { width: `${Math.max(12, Math.min(100, Math.round(recommendation.matchScore)))}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ width: `${Math.max(12, Math.min(100, Math.round(recommendation.matchScore)))}%` }}
                />
              </div>
            ) : null}
          </div>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => onAdd(recommendation)}
          aria-label={
            isStaged
              ? `Remove ${recommendation.title} from staged music`
              : `Add ${recommendation.title} to staged music`
          }
          whileHover={reduceMotion ? undefined : { scale: 1.05, rotate: 2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={cn(
            'relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[22px] border transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            isStaged ? 'border-[#7ff2d4]/30 bg-[#7ff2d4]/10 text-[#7ff2d4]' : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20',
          )}
        >
          <AnimatePresence initial={false} mode="wait">
            {isStaged ? (
              <motion.span
                key="added"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <Check className="size-5" strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <Plus className="size-5" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {showExpandedPreview ? (
          <motion.div
            key="preview-panel"
            initial={reduceMotion ? false : { opacity: 0, height: 0, y: -4, scale: 0.985 }}
            animate={reduceMotion ? undefined : { opacity: 1, height: 'auto', y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0, y: -4, scale: 0.985 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-[24px] border border-[#7ff2d4]/14 bg-[linear-gradient(180deg,rgba(7,14,12,0.96)_0%,rgba(8,10,14,0.96)_100%)] p-4 shadow-2xl">
              <button
                type="button"
                onClick={() => onPreviewToggle(recommendation)}
                className="flex w-full items-center justify-between gap-2 text-left text-[12px] font-black uppercase tracking-[0.1em] text-white/60"
              >
                <span className="inline-flex items-center gap-2">
                  <Pause className="size-4 text-[#7ff2d4]" />
                  Active Preview
                </span>
                <span className="tabular-nums text-white/30 tracking-widest">{recommendation.durationSec}S SAMPLE</span>
              </button>

              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.04] shadow-inner">
                <motion.div
                  className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-[linear-gradient(90deg,rgba(127,242,212,0.6)_0%,rgba(255,255,255,0.9)_50%,rgba(127,242,212,0.4)_100%)]"
                  animate={reduceMotion ? undefined : { x: ['-35%', '150%'] }}
                  transition={reduceMotion ? undefined : { duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <MetaChip label={recommendation.genre} tone={tone.chipTone} />
                <MetaChip label={tempoLabel} tone="slate" />
              </div>

              {recommendation.fitReasons?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {recommendation.fitReasons.slice(0, 3).map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white/40"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  )
}

export function MusicRecommendationSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,16,0.98)_0%,rgba(8,8,12,0.96)_100%)] p-3 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.88)]">
      <div className="flex h-16 min-w-0 flex-1 items-center overflow-hidden rounded-[22px] bg-black/40 px-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.07]" />
        <div className="min-w-0 flex-1 pl-4">
          <div className="h-4 w-28 rounded-full bg-white/[0.08]" />
          <div className="mt-2 h-3 w-20 rounded-full bg-white/[0.06]" />
        </div>
      </div>
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] border border-white/10 bg-black/40 text-white/20">
        <Plus className="size-6" />
      </div>
    </div>
  )
}

function MetaChip({ label, tone }: { label: string; tone: 'emerald' | 'cyan' | 'amber' | 'rose' | 'slate' | 'ice' }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
      : tone === 'cyan'
        ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
        : tone === 'amber'
          ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
          : tone === 'rose'
            ? 'border-rose-400/20 bg-rose-400/10 text-rose-300'
            : tone === 'ice'
              ? 'border-sky-300/20 bg-sky-300/10 text-sky-300'
              : 'border-white/10 bg-white/[0.04] text-white/40'

  return <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]', toneClass)}>{label}</span>
}

function getRecommendationTone(groupKey?: string | null) {
  switch (groupKey) {
    case 'safe-fit':
      return {
        border: 'border-cyan-400/14',
        previewBorder: 'border-cyan-400/30',
        previewShadow: 'shadow-[0_12px_28px_-20px_rgba(74,222,128,0.25)]',
        previewBubble: 'border-cyan-300/40 shadow-[0_10px_24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(103,232,249,0.2)]',
        chipTone: 'cyan' as const,
        bar: 'bg-gradient-to-r from-cyan-400 to-[#7ff2d4]',
      }
    case 'creative-stretch':
      return {
        border: 'border-amber-400/14',
        previewBorder: 'border-amber-400/30',
        previewShadow: 'shadow-[0_12px_28px_-20px_rgba(251,191,36,0.25)]',
        previewBubble: 'border-amber-300/40 shadow-[0_10px_24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(251,191,36,0.2)]',
        chipTone: 'amber' as const,
        bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
      }
    case 'high-energy-alternative':
      return {
        border: 'border-rose-400/14',
        previewBorder: 'border-rose-400/30',
        previewShadow: 'shadow-[0_12px_28px_-20px_rgba(244,63,94,0.25)]',
        previewBubble: 'border-rose-300/40 shadow-[0_10px_24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(251,113,133,0.2)]',
        chipTone: 'rose' as const,
        bar: 'bg-gradient-to-r from-rose-400 to-pink-500',
      }
    case 'cinematic-alternative':
      return {
        border: 'border-sky-300/14',
        previewBorder: 'border-sky-300/30',
        previewShadow: 'shadow-[0_12px_28px_-20px_rgba(56,189,248,0.25)]',
        previewBubble: 'border-sky-200/40 shadow-[0_10px_24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(125,211,252,0.2)]',
        chipTone: 'ice' as const,
        bar: 'bg-gradient-to-r from-sky-400 to-indigo-500',
      }
    case 'minimal-ambient-alternative':
      return {
        border: 'border-white/10',
        previewBorder: 'border-white/20',
        previewShadow: 'shadow-[0_12px_28px_-20px_rgba(255,255,255,0.15)]',
        previewBubble: 'border-white/20 shadow-[0_10px_24px_rgba(0,0,0,0.5)]',
        chipTone: 'slate' as const,
        bar: 'bg-white/40',
      }
    case 'best-fit':
    default:
      return {
        border: 'border-[#7ff2d4]/14',
        previewBorder: 'border-[#7ff2d4]/30',
        previewShadow: 'shadow-[0_12px_28px_-20px_rgba(127,242,212,0.25)]',
        previewBubble: 'border-[#7ff2d4]/40 shadow-[0_10px_24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(127,242,212,0.2)]',
        chipTone: 'emerald' as const,
        bar: 'bg-gradient-to-r from-[#7ff2d4] to-emerald-500',
      }
  }
}
