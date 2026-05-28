'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  Camera,
  CircleDot,
  Film,
  Gauge,
  Move3D,
  Pause,
  Play,
  Plus,
  SlidersHorizontal,
  Timer,
  Type,
  Wand2,
} from 'lucide-react'

import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { cn } from '@/lib/utils'

type PreviewMediaKind = 'video' | 'image'
type MotionLane = 'motion' | 'typography' | 'camera' | 'timing'

type MotionCanvasNode = {
  id: MotionLane | 'source'
  label: string
  eyebrow: string
  prompt: string
  x: number
  y: number
  accent: string
  icon: React.ComponentType<{ className?: string }>
}

type MotionCanvasState = {
  intensity: number
  duration: number
  typographyScale: number
  cameraDrift: number
}

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
  previewPlaying: boolean
  previewMuted?: boolean
  videoRef?: React.Ref<HTMLVideoElement>
  onTogglePlayback: () => void
  onPickSource: () => void
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

const LANE_COPY: Record<MotionLane, { label: string; descriptor: string; prompt: string }> = {
  motion: {
    label: 'Motion',
    descriptor: 'Ease, velocity, and accent behavior',
    prompt: 'Add a restrained kinetic accent on the strongest beat, with a soft settle instead of a hard snap.',
  },
  typography: {
    label: 'Typography',
    descriptor: 'Title weight, entry timing, and caption rhythm',
    prompt: 'Set the title as quiet editorial serif type with a short drift-in and no oversized caption treatment.',
  },
  camera: {
    label: 'Camera',
    descriptor: 'Crop drift, push-ins, and reframing',
    prompt: 'Use a subtle push-in on the subject and keep the frame centered through the emotional turn.',
  },
  timing: {
    label: 'Timing',
    descriptor: 'Hold length, cue offsets, and beat alignment',
    prompt: 'Delay the motion cue by a fraction so the overlay lands after the cut, not before it.',
  },
}

const CANVAS_NODES: MotionCanvasNode[] = [
  {
    id: 'source',
    label: 'Frame Under Survey',
    eyebrow: 'Source',
    prompt: 'The current frame acts as the source node for all downstream motion properties.',
    x: 28,
    y: 48,
    accent: '#9ff6e3',
    icon: Film,
  },
  {
    id: 'motion',
    label: 'Motion Cue',
    eyebrow: 'Animate',
    prompt: LANE_COPY.motion.prompt,
    x: 47,
    y: 26,
    accent: '#8fb7ff',
    icon: Move3D,
  },
  {
    id: 'typography',
    label: 'Type Layer',
    eyebrow: 'Titles',
    prompt: LANE_COPY.typography.prompt,
    x: 73,
    y: 40,
    accent: '#f7c873',
    icon: Type,
  },
  {
    id: 'camera',
    label: 'Camera Pass',
    eyebrow: 'Reframe',
    prompt: LANE_COPY.camera.prompt,
    x: 62,
    y: 70,
    accent: '#ff8f9d',
    icon: Camera,
  },
  {
    id: 'timing',
    label: 'Timing Gate',
    eyebrow: 'Rhythm',
    prompt: LANE_COPY.timing.prompt,
    x: 34,
    y: 72,
    accent: '#b99cff',
    icon: Timer,
  },
]

function MotionCanvasNodeButton({
  node,
  active,
  onSelect,
  reduceMotion,
}: {
  node: MotionCanvasNode
  active: boolean
  onSelect: () => void
  reduceMotion: boolean
}) {
  const Icon = node.icon

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={cn(
        'group absolute z-20 w-[min(15rem,38vw)] rounded-[18px] border bg-[rgba(12,13,18,0.86)] p-3 text-left shadow-[0_24px_44px_-30px_rgba(0,0,0,0.94),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition-colors',
        active ? 'border-white/28 bg-white/[0.075]' : 'border-white/10 hover:border-white/18',
      )}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        translate: '-50% -50%',
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96, filter: 'blur(8px)' }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      whileHover={reduceMotion ? undefined : { y: -3, scale: 1.015 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[18px] opacity-0 blur-xl transition-opacity group-hover:opacity-60"
        style={{ background: node.accent }}
      />
      <span className="relative flex items-start gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-[13px] border border-white/10 bg-black/36 text-white"
          style={{ boxShadow: active ? `0 0 28px -14px ${node.accent}` : undefined }}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] uppercase tracking-[0.2em] text-white/35">{node.eyebrow}</span>
          <span className="mt-1 block truncate text-sm font-semibold text-white/88">{node.label}</span>
          <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-white/44" style={BELLAVOIR_STYLE}>
            {node.prompt}
          </span>
        </span>
      </span>
    </motion.button>
  )
}

function PropertySlider({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block rounded-[15px] border border-white/8 bg-white/[0.025] px-3 py-2.5">
      <span className="flex items-center justify-between text-[11px] text-white/46">
        <span>{label}</span>
        <span className="tabular-nums text-white/72">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1.5 w-full accent-[#9ff6e3]"
      />
    </label>
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
  previewPlaying,
  previewMuted = true,
  videoRef,
  onTogglePlayback,
  onPickSource,
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
  const [activeLane, setActiveLane] = React.useState<MotionLane>('motion')
  const [selectedNodeId, setSelectedNodeId] = React.useState<MotionCanvasNode['id']>('motion')
  const [promptDraft, setPromptDraft] = React.useState(LANE_COPY.motion.prompt)
  const [state, setState] = React.useState<MotionCanvasState>({
    intensity: 42,
    duration: 18,
    typographyScale: 64,
    cameraDrift: 12,
  })

  const selectedNode = CANVAS_NODES.find((node) => node.id === selectedNodeId) ?? CANVAS_NODES[1]!
  const activeCopy = LANE_COPY[activeLane]

  React.useEffect(() => {
    setPromptDraft(LANE_COPY[activeLane].prompt)
    setSelectedNodeId(activeLane)
  }, [activeLane])

  const applyPrompt = React.useCallback(() => {
    const prompt = promptDraft.trim()
    if (!prompt) return
    onApplyPrompt?.(
      `${activeCopy.label} request for ${projectTitle}: ${prompt} Motion intensity ${state.intensity}. Typography scale ${state.typographyScale}. Camera drift ${state.cameraDrift}. Cue duration ${state.duration} frames.`,
    )
  }, [activeCopy.label, onApplyPrompt, projectTitle, promptDraft, state.cameraDrift, state.duration, state.intensity, state.typographyScale])

  return (
    <div className="relative flex h-full min-h-[clamp(42rem,calc(100dvh-8.5rem),68rem)] w-full flex-col overflow-hidden border-y border-white/10 bg-[#040506] shadow-[0_28px_80px_-56px_rgba(0,0,0,0.95)]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-32"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.28) 0.75px, rgba(255,255,255,0) 1px)',
          backgroundSize: '19px 19px',
          maskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
        }}
        animate={reduceMotion ? undefined : { backgroundPosition: ['0px 0px', '38px 19px'] }}
        transition={reduceMotion ? undefined : { duration: 18, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(159,246,227,0.13)_0%,rgba(159,246,227,0)_32%),radial-gradient(circle_at_84%_16%,rgba(185,156,255,0.13)_0%,rgba(185,156,255,0)_36%),linear-gradient(180deg,rgba(16,18,25,0.72)_0%,rgba(5,6,8,0.96)_76%)]"
        animate={reduceMotion ? undefined : { opacity: [0.88, 1, 0.88], scale: [1, 1.018, 1] }}
        transition={reduceMotion ? undefined : { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-x-[12%] top-[16%] h-[34%] rotate-[-5deg] bg-[linear-gradient(90deg,rgba(159,246,227,0)_0%,rgba(159,246,227,0.09)_24%,rgba(143,183,255,0.08)_52%,rgba(255,255,255,0)_100%)] blur-2xl"
        animate={reduceMotion ? undefined : { x: ['-8%', '8%', '-8%'], opacity: [0.34, 0.62, 0.34] }}
        transition={reduceMotion ? undefined : { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9ff6e3]/18 bg-[#9ff6e3]/[0.055] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#d6fff8]/66">
            <CircleDot className="size-3" />
            Motion Lab
          </div>
          <h2 className="mt-2 truncate text-[1.4rem] leading-none text-white" style={GRAND_CRU_STYLE}>
            {projectTitle}
          </h2>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-[11px] text-white/54 sm:flex">
          <Gauge className="size-3.5 text-[#9ff6e3]" />
          <span>{activeCopy.descriptor}</span>
        </div>
      </div>

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[5.25rem_minmax(0,1fr)_20rem]">
        <nav className="relative flex gap-2 border-b border-white/8 p-3 lg:flex-col lg:border-b-0 lg:border-r">
          {(Object.keys(LANE_COPY) as MotionLane[]).map((lane) => {
            const Icon = lane === 'motion' ? Move3D : lane === 'typography' ? Type : lane === 'camera' ? Camera : Timer
            const active = activeLane === lane
            return (
              <button
                key={lane}
                type="button"
                onClick={() => setActiveLane(lane)}
                className={cn(
                  'group grid size-12 shrink-0 place-items-center rounded-[18px] border transition-colors',
                  active
                    ? 'border-[#9ff6e3]/32 bg-[#9ff6e3]/10 text-white shadow-[0_0_28px_-18px_rgba(159,246,227,0.7)]'
                    : 'border-white/8 bg-white/[0.025] text-white/42 hover:border-white/15 hover:text-white/76',
                )}
                aria-label={LANE_COPY[lane].label}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </nav>

        <div className="relative min-h-[30rem] overflow-hidden">
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" aria-hidden>
            <defs>
              <linearGradient id="motion-canvas-thread" x1="0" x2="1">
                <stop offset="0%" stopColor="rgba(159,246,227,0.08)" />
                <stop offset="48%" stopColor="rgba(255,255,255,0.36)" />
                <stop offset="100%" stopColor="rgba(185,156,255,0.1)" />
              </linearGradient>
            </defs>
            {CANVAS_NODES.filter((node) => node.id !== 'source').map((node) => (
              <motion.path
                key={node.id}
                d={`M 28 48 C 42 48, ${node.x - 16} ${node.y}, ${node.x} ${node.y}`}
                stroke={selectedNodeId === node.id ? node.accent : 'url(#motion-canvas-thread)'}
                strokeWidth={selectedNodeId === node.id ? 0.34 : 0.18}
                strokeDasharray="1.4 2.4"
                initial={reduceMotion ? false : { pathLength: 0.08 }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        pathLength: selectedNodeId === node.id ? [0.18, 1, 0.18] : [0.12, 0.62, 0.12],
                        strokeDashoffset: [0, -18],
                        opacity: selectedNodeId === node.id ? [0.62, 1, 0.62] : [0.18, 0.46, 0.18],
                      }
                }
                transition={reduceMotion ? undefined : { duration: selectedNodeId === node.id ? 2.8 : 5.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              />
            ))}
          </svg>

          <div className="absolute left-[28%] top-[48%] z-30 w-[min(22rem,54vw)] -translate-x-1/2 -translate-y-1/2">
            <div className="relative overflow-hidden rounded-[22px] border border-white/14 bg-black shadow-[0_26px_58px_-36px_rgba(0,0,0,0.96)]">
              <div className="absolute left-3 top-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] text-white/76 backdrop-blur-md">
                <Film className="size-3 text-[#9ff6e3]" />
                <span className="truncate">{sourceLabel ?? 'Source video'}</span>
              </div>

              <div className="relative aspect-video bg-[#030406]">
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
                    <span className="grid size-16 place-items-center rounded-[22px] border border-white/12 bg-white/[0.04]">
                      <Plus className="size-5" />
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-white/8 bg-black/70 px-3 py-2">
                <button
                  type="button"
                  onClick={onTogglePlayback}
                  disabled={previewKind !== 'video' || !previewUrl}
                  className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/76 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/24"
                >
                  {previewPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
                </button>
                <div className="text-[11px] tabular-nums text-white/52">
                  {currentTimeLabel} / {durationLabel}
                </div>
                <div className="ml-auto rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/34">
                  Survey
                </div>
              </div>
            </div>
          </div>

          {CANVAS_NODES.filter((node) => node.id !== 'source').map((node) => (
            <MotionCanvasNodeButton
              key={node.id}
              node={node}
              active={selectedNodeId === node.id}
              reduceMotion={reduceMotion}
              onSelect={() => {
                setSelectedNodeId(node.id)
                if (node.id !== 'source') {
                  setActiveLane(node.id)
                  setPromptDraft(LANE_COPY[node.id].prompt)
                }
              }}
            />
          ))}

          <div className="absolute bottom-4 left-4 right-4 z-40 rounded-[22px] border border-white/10 bg-black/52 p-3 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/38">
                <Wand2 className="size-3 text-[#9ff6e3]" />
                Prompt node
              </div>
              <div className="hidden text-[11px] text-white/34 sm:block">{selectedNode.label}</div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <textarea
                value={promptDraft}
                onChange={(event) => setPromptDraft(event.target.value)}
                rows={2}
                className="min-h-[4rem] resize-none rounded-[16px] border border-white/8 bg-white/[0.035] px-3 py-2 text-sm leading-5 text-white/86 outline-none transition-colors placeholder:text-white/30 focus:border-[#9ff6e3]/28"
                placeholder="Describe the motion, typography, camera, or timing change..."
                style={BELLAVOIR_STYLE}
              />
              <button
                type="button"
                onClick={applyPrompt}
                disabled={!promptDraft.trim()}
                className="grid w-11 place-items-center rounded-[16px] border border-white/12 bg-white text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:border-white/6 disabled:bg-white/[0.05] disabled:text-white/22"
              >
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <aside className="relative min-h-0 border-t border-white/8 bg-black/24 p-3 lg:border-l lg:border-t-0">
          <div className="rounded-[22px] border border-white/8 bg-white/[0.025] p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/35">
              <SlidersHorizontal className="size-3.5 text-[#9ff6e3]" />
              Properties
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLane}
                initial={reduceMotion ? false : { opacity: 0, y: 8, filter: 'blur(6px)' }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6, filter: 'blur(5px)' }}
                transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="mt-3 space-y-3"
              >
                <div className="rounded-[18px] border border-white/8 bg-black/24 p-3">
                  <div className="text-lg leading-none text-white" style={GRAND_CRU_STYLE}>
                    {activeCopy.label}
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-white/48" style={BELLAVOIR_STYLE}>
                    {activeCopy.descriptor}
                  </p>
                </div>
                <PropertySlider
                  label="Motion intensity"
                  value={state.intensity}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(value) => setState((current) => ({ ...current, intensity: value }))}
                />
                <PropertySlider
                  label="Cue duration"
                  value={state.duration}
                  min={4}
                  max={48}
                  suffix="f"
                  onChange={(value) => setState((current) => ({ ...current, duration: value }))}
                />
                <PropertySlider
                  label="Type scale"
                  value={state.typographyScale}
                  min={20}
                  max={120}
                  suffix="%"
                  onChange={(value) => setState((current) => ({ ...current, typographyScale: value }))}
                />
                <PropertySlider
                  label="Camera drift"
                  value={state.cameraDrift}
                  min={0}
                  max={40}
                  suffix="px"
                  onChange={(value) => setState((current) => ({ ...current, cameraDrift: value }))}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {['Ease out', 'Soft hold', 'Serif type', 'Beat sync'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPromptDraft((current) => `${current.replace(/\s+$/g, '')} ${item.toLowerCase()}.`)}
                className="rounded-[14px] border border-white/8 bg-white/[0.025] px-3 py-2 text-left text-[11px] text-white/52 transition-colors hover:border-white/14 hover:text-white/80"
              >
                {item}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
