'use client'

import * as React from 'react'
import { motion, useDragControls } from 'framer-motion'
import {
  ArrowUpRight,
  CircleDot,
  FastForward,
  Film,
  Gauge,
  MoveHorizontal,
  Pause,
  Play,
  Plus,
  RotateCw,
  SlidersHorizontal,
  Timer,
  Wand2,
  ZoomIn,
} from 'lucide-react'

import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { cn } from '@/lib/utils'

type PreviewMediaKind = 'video' | 'image'
type MotionEffectId = 'pan' | 'zoom' | 'rotate' | 'fade' | 'blur' | 'speed'

type MotionEffect = {
  id: MotionEffectId
  label: string
  icon: React.ComponentType<{ className?: string }>
  min: number
  max: number
  unit: string
}

type MotionValues = Record<MotionEffectId, number>

export interface MotionPropertyCanvasProps {
  projectTitle: string
  previewUrl: string
  previewKind: PreviewMediaKind
  hasPreviewMedia: boolean
  sourceLabel?: string | null
  objectFit: 'cover' | 'contain'
  mediaTransformStyle?: React.CSSProperties
  currentTimeLabel: string
  durationLabel: string
  currentTimeSec?: number
  durationSec?: number
  previewPlaying: boolean
  previewMuted?: boolean
  videoRef?: React.Ref<HTMLVideoElement>
  onTogglePlayback: () => void
  onPickSource: () => void
  onSeek?: (timeSec: number) => void
  onVideoLoadedMetadata?: React.ReactEventHandler<HTMLVideoElement>
  onVideoLoadedData?: React.ReactEventHandler<HTMLVideoElement>
  onVideoCanPlay?: React.ReactEventHandler<HTMLVideoElement>
  onVideoTimeUpdate?: React.ReactEventHandler<HTMLVideoElement>
  onVideoEnded?: React.ReactEventHandler<HTMLVideoElement>
  onVideoPlay?: React.ReactEventHandler<HTMLVideoElement>
  onVideoPause?: React.ReactEventHandler<HTMLVideoElement>
  onVideoError?: React.ReactEventHandler<HTMLVideoElement>
  onImageLoaded?: React.ReactEventHandler<HTMLImageElement>
  onApplyPrompt?: (prompt: string) => void
}

const GRAND_CRU_STYLE = {
  fontFamily: 'var(--font-grand-cru), "New York", serif',
} satisfies React.CSSProperties

const BELLAVOIR_STYLE = {
  fontFamily: 'var(--font-bellavoir-serif), "New York", serif',
} satisfies React.CSSProperties

const MOTION_EFFECTS: MotionEffect[] = [
  { id: 'pan', label: 'Pan', icon: MoveHorizontal, min: -80, max: 80, unit: 'px' },
  { id: 'zoom', label: 'Zoom', icon: ZoomIn, min: 80, max: 140, unit: '%' },
  { id: 'rotate', label: 'Rotate', icon: RotateCw, min: -18, max: 18, unit: 'deg' },
  { id: 'fade', label: 'Fade', icon: CircleDot, min: 0, max: 100, unit: '%' },
  { id: 'blur', label: 'Blur', icon: SlidersHorizontal, min: 0, max: 24, unit: 'px' },
  { id: 'speed', label: 'Speed', icon: FastForward, min: 25, max: 200, unit: '%' },
]

const DEFAULT_MOTION_VALUES: MotionValues = {
  pan: 18,
  zoom: 108,
  rotate: 0,
  fade: 86,
  blur: 0,
  speed: 100,
}

function useMotionMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

function formatTimelineTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value))
}

function MotionValueRow({
  effect,
  value,
  active,
  onSelect,
  onChange,
}: {
  effect: MotionEffect
  value: number
  active: boolean
  onSelect: () => void
  onChange: (value: number) => void
}) {
  const Icon = effect.icon

  return (
    <div
      className={cn(
        'rounded-[16px] border px-3 py-2.5 transition-colors',
        active ? 'border-[#267dff]/42 bg-[#267dff]/12' : 'border-white/8 bg-white/[0.025]',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-[12px] border border-white/8 bg-black/26 text-white/72">
            <Icon className="size-3.5" />
          </span>
          <span className="truncate text-sm font-medium text-white/82">{effect.label}</span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-white/56">
          {value}
          {effect.unit}
        </span>
      </button>
      <input
        type="range"
        min={effect.min}
        max={effect.max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1.5 w-full accent-[#267dff]"
        aria-label={`${effect.label} value`}
      />
    </div>
  )
}

export function MotionPropertyCanvas({
  projectTitle,
  previewUrl,
  previewKind,
  hasPreviewMedia,
  sourceLabel,
  objectFit,
  mediaTransformStyle,
  currentTimeLabel,
  durationLabel,
  currentTimeSec = 0,
  durationSec = 0,
  previewPlaying,
  previewMuted = true,
  videoRef,
  onTogglePlayback,
  onPickSource,
  onSeek,
  onVideoLoadedMetadata,
  onVideoLoadedData,
  onVideoCanPlay,
  onVideoTimeUpdate,
  onVideoEnded,
  onVideoPlay,
  onVideoPause,
  onVideoError,
  onImageLoaded,
  onApplyPrompt,
}: MotionPropertyCanvasProps) {
  const reduceMotion = useStableReducedMotion()
  const isCompact = useMotionMediaQuery('(max-width: 1024px)')
  const dragControls = useDragControls()
  const timelineRef = React.useRef<HTMLButtonElement | null>(null)
  const [sheetExpanded, setSheetExpanded] = React.useState(false)
  const [localPlayheadPercent, setLocalPlayheadPercent] = React.useState(18)
  const [selectedRange, setSelectedRange] = React.useState({ start: 18, end: 64 })
  const [keyframes, setKeyframes] = React.useState([18, 34, 52, 64])
  const [activeEffect, setActiveEffect] = React.useState<MotionEffectId>('pan')
  const [values, setValues] = React.useState<MotionValues>(DEFAULT_MOTION_VALUES)
  const [promptDraft, setPromptDraft] = React.useState(
    'Add a restrained push-in across the selected range, then settle before the cut.',
  )

  const resolvedDurationSec = durationSec > 0 ? durationSec : 60
  const livePlayheadPercent =
    durationSec > 0 ? clampPercent((currentTimeSec / resolvedDurationSec) * 100) : localPlayheadPercent
  const livePlayheadTime =
    durationSec > 0 ? currentTimeLabel : formatTimelineTime((livePlayheadPercent / 100) * resolvedDurationSec)
  const selectedStartTime = formatTimelineTime((selectedRange.start / 100) * resolvedDurationSec)
  const selectedEndTime = formatTimelineTime((selectedRange.end / 100) * resolvedDurationSec)

  const jumpToPercent = React.useCallback(
    (percent: number) => {
      const nextPercent = clampPercent(percent)
      setLocalPlayheadPercent(nextPercent)
      onSeek?.((nextPercent / 100) * resolvedDurationSec)
    },
    [onSeek, resolvedDurationSec],
  )

  const handleTimelineClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const nextPercent = ((event.clientX - rect.left) / rect.width) * 100
      jumpToPercent(nextPercent)
    },
    [jumpToPercent],
  )

  const addKeyframe = React.useCallback(() => {
    setKeyframes((current) => {
      const next = Math.round(livePlayheadPercent)
      if (current.some((item) => Math.abs(item - next) < 1)) return current
      return [...current, next].sort((a, b) => a - b).slice(-8)
    })
  }, [livePlayheadPercent])

  const applyPrompt = React.useCallback(() => {
    const prompt = promptDraft.trim()
    if (!prompt) return
    onApplyPrompt?.(
      `Motion timeline request for ${projectTitle}: ${prompt} Range ${selectedStartTime}-${selectedEndTime}. Pan ${values.pan}px. Zoom ${values.zoom}%. Rotate ${values.rotate}deg. Fade ${values.fade}%. Blur ${values.blur}px. Speed ${values.speed}%.`,
    )
  }, [onApplyPrompt, projectTitle, promptDraft, selectedEndTime, selectedStartTime, values])

  return (
    <motion.div
      drag={isCompact ? 'y' : false}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.06}
      onDragEnd={(_, info) => {
        if (!isCompact) return
        if (info.offset.y < -36) setSheetExpanded(true)
        if (info.offset.y > 36) setSheetExpanded(false)
      }}
      className={cn(
        'relative z-50 flex min-h-0 w-full flex-col overflow-hidden border-white/10 bg-[#07080b] text-white shadow-[0_28px_80px_-46px_rgba(0,0,0,0.96)]',
        'max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-[70] max-lg:rounded-t-[28px] max-lg:border-x max-lg:border-t',
        sheetExpanded ? 'max-lg:h-[85dvh]' : 'max-lg:h-[40dvh]',
        'lg:ml-auto lg:h-full lg:min-h-0 lg:w-[360px] lg:self-end lg:border-l',
      )}
      initial={reduceMotion ? false : { opacity: 0, x: isCompact ? 0 : 22, y: isCompact ? 28 : 0 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="shrink-0 border-b border-white/8 px-4 pb-3 pt-3">
        <button
          type="button"
          onPointerDown={(event) => {
            if (isCompact) dragControls.start(event)
          }}
          onClick={() => {
            if (isCompact) setSheetExpanded((current) => !current)
          }}
          aria-label={sheetExpanded ? 'Collapse motion timeline' : 'Expand motion timeline'}
          className="mx-auto mb-3 hidden h-7 w-20 cursor-ns-resize items-center justify-center max-lg:flex"
        >
          <span className="h-1.5 w-12 rounded-full bg-white/24" />
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#267dff]/20 bg-[#267dff]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#bcd6ff]">
              <CircleDot className="size-3" />
              Motion Timeline
            </div>
            <h2 className="mt-2 truncate text-[1.35rem] leading-none text-white" style={GRAND_CRU_STYLE}>
              {projectTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={addKeyframe}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/72 transition-colors hover:text-white"
            aria-label="Add keyframe"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="premium-scroll-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black">
          <div className="relative aspect-video bg-[#030406]">
            <div className="absolute left-2 top-2 z-20 inline-flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] text-white/72 backdrop-blur-md">
              <Film className="size-3 text-[#9ff6e3]" />
              <span className="truncate">{sourceLabel ?? 'Source video'}</span>
            </div>
            {hasPreviewMedia ? (
              previewKind === 'image' ? (
                <div className="absolute inset-0 overflow-hidden" style={mediaTransformStyle}>
                  <img
                    src={previewUrl}
                    alt={projectTitle}
                    className="block h-full w-full bg-black"
                    onLoad={onImageLoaded}
                    style={{ objectFit }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 overflow-hidden" style={mediaTransformStyle}>
                  <video
                    key={previewUrl}
                    ref={videoRef}
                    src={previewUrl}
                    className="block h-full w-full bg-black"
                    muted={previewMuted}
                    playsInline
                    controls={false}
                    preload="auto"
                    onLoadedMetadata={onVideoLoadedMetadata}
                    onLoadedData={onVideoLoadedData}
                    onCanPlay={onVideoCanPlay}
                    onTimeUpdate={onVideoTimeUpdate}
                    onEnded={onVideoEnded}
                    onPlay={onVideoPlay}
                    onPause={onVideoPause}
                    onError={onVideoError}
                    style={{ objectFit }}
                  />
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={onPickSource}
                className="absolute inset-0 grid place-items-center text-white/70 transition-colors hover:text-white"
              >
                <span className="grid size-14 place-items-center rounded-[20px] border border-white/12 bg-white/[0.04]">
                  <Plus className="size-5" />
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-white/8 bg-black/72 px-3 py-2">
            <button
              type="button"
              onClick={onTogglePlayback}
              disabled={previewKind !== 'video' || !previewUrl}
              className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/76 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/24"
            >
              {previewPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
            </button>
            <div className="text-[11px] tabular-nums text-white/54">
              {currentTimeLabel} / {durationLabel}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.025] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/38">
              <Timer className="size-3.5 text-[#267dff]" />
              Timeline
            </div>
            <div className="rounded-full border border-white/8 bg-black/30 px-2 py-1 text-[10px] tabular-nums text-white/52">
              {selectedStartTime} - {selectedEndTime}
            </div>
          </div>

          <button
            ref={timelineRef}
            type="button"
            onClick={handleTimelineClick}
            className="relative mt-4 h-20 w-full rounded-[14px] border border-white/8 bg-[#0b0c11] px-3 text-left"
            aria-label="Jump in motion timeline"
          >
            <div className="absolute inset-x-3 top-4 h-8">
              {Array.from({ length: 11 }).map((_, index) => {
                const left = index * 10
                return (
                  <span
                    key={left}
                    className="absolute top-0 h-4 w-px bg-white/16"
                    style={{ left: `${left}%` }}
                  />
                )
              })}
              <span className="absolute inset-x-0 top-4 h-1.5 rounded-full bg-white/[0.08]" />
              <span
                className="absolute top-4 h-1.5 rounded-full bg-[#267dff]"
                style={{ left: `${selectedRange.start}%`, width: `${selectedRange.end - selectedRange.start}%` }}
              />
              <span
                className="absolute top-2 h-5 w-1.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.45)]"
                style={{ left: `${selectedRange.start}%`, transform: 'translateX(-50%)' }}
              />
              <span
                className="absolute top-2 h-5 w-1.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.45)]"
                style={{ left: `${selectedRange.end}%`, transform: 'translateX(-50%)' }}
              />
              {keyframes.map((item) => (
                <span
                  key={item}
                  className="absolute top-[1.95rem] size-2 rounded-full border border-[#267dff] bg-white"
                  style={{ left: `${item}%`, transform: 'translateX(-50%)' }}
                />
              ))}
              <span
                className="absolute -top-1 h-11 border-l border-dashed border-white/82"
                style={{ left: `${livePlayheadPercent}%` }}
              >
                <span className="absolute -left-8 -top-6 min-w-16 rounded-full border border-white/10 bg-black px-2 py-1 text-center text-[10px] tabular-nums text-white/80">
                  {livePlayheadTime}
                </span>
              </span>
            </div>
            <div className="absolute inset-x-3 bottom-2 flex justify-between text-[9px] uppercase tracking-[0.18em] text-white/28">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </button>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/34">Range In</span>
              <input
                type="range"
                min={0}
                max={Math.max(0, selectedRange.end - 4)}
                value={selectedRange.start}
                onChange={(event) =>
                  setSelectedRange((current) => ({
                    ...current,
                    start: Math.min(Number(event.target.value), current.end - 4),
                  }))
                }
                className="mt-2 h-1.5 w-full accent-white"
              />
            </label>
            <label className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/34">Range Out</span>
              <input
                type="range"
                min={Math.min(100, selectedRange.start + 4)}
                max={100}
                value={selectedRange.end}
                onChange={(event) =>
                  setSelectedRange((current) => ({
                    ...current,
                    end: Math.max(Number(event.target.value), current.start + 4),
                  }))
                }
                className="mt-2 h-1.5 w-full accent-white"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.025] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/38">
              <Gauge className="size-3.5 text-[#9ff6e3]" />
              Effects
            </div>
            <div className="text-[11px] text-white/36">Selected: {MOTION_EFFECTS.find((item) => item.id === activeEffect)?.label}</div>
          </div>

          <div className="mt-3 space-y-2">
            {MOTION_EFFECTS.map((effect) => (
              <MotionValueRow
                key={effect.id}
                effect={effect}
                value={values[effect.id]}
                active={activeEffect === effect.id}
                onSelect={() => setActiveEffect(effect.id)}
                onChange={(value) => setValues((current) => ({ ...current, [effect.id]: value }))}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.025] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/38">
              <Wand2 className="size-3.5 text-[#9ff6e3]" />
              Motion note
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <textarea
              value={promptDraft}
              onChange={(event) => setPromptDraft(event.target.value)}
              rows={3}
              className="min-h-[5rem] resize-none rounded-[16px] border border-white/8 bg-white/[0.035] px-3 py-2 text-sm leading-5 text-white/86 outline-none transition-colors placeholder:text-white/30 focus:border-[#267dff]/34"
              placeholder="Describe the motion change..."
              style={BELLAVOIR_STYLE}
            />
            <button
              type="button"
              onClick={applyPrompt}
              disabled={!promptDraft.trim()}
              className="grid w-11 place-items-center rounded-[16px] border border-white/12 bg-white text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:border-white/6 disabled:bg-white/[0.05] disabled:text-white/22"
              aria-label="Send motion note to chat"
            >
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
