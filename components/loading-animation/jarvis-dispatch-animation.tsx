'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getTaskAnimationNarrative,
  type TaskNarrativeOptions,
} from '@/lib/prometheus-assistant/task-animation-narrative'

export interface JarvisDispatchAnimationProps extends TaskNarrativeOptions {
  prompt?: string | null
  intent?: string | null
  label?: string | null
  sublabel?: string | null
  thoughts?: string[] | null
  className?: string
  aspectRatio?: string
}

const RIBBON_PATH_D =
  'M 45 75 C 80 75, 105 72, 125 54 C 142 38, 148 14, 172 14 C 196 14, 206 42, 192 68 C 178 88, 148 86, 145 70 C 142 54, 172 46, 206 50 C 255 56, 305 45, 360 38'

export function JarvisDispatchAnimation({
  prompt,
  intent,
  label,
  sublabel,
  thoughts,
  className,
  aspectRatio,
}: JarvisDispatchAnimationProps) {
  const reduceMotion = useReducedMotion()
  const pathId = React.useId().replace(/:/g, '')
  const narrative = React.useMemo(
    () => getTaskAnimationNarrative({ prompt, intent, label, sublabel, thoughts }),
    [prompt, intent, label, sublabel, thoughts],
  )

  // Track elapsed dispatch time
  const [elapsedSec, setElapsedSec] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedElapsed = React.useMemo(() => {
    const mins = Math.floor(elapsedSec / 60)
    const secs = elapsedSec % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [elapsedSec])

  // Continuous flowing text along the ribbon path (smooth requestAnimationFrame loop)
  const [offset, setOffset] = React.useState(0)
  React.useEffect(() => {
    if (reduceMotion) {
      setOffset(0)
      return
    }

    let animId: number
    let lastTime = performance.now()
    const speed = 7.5 // % per second

    const step = (now: number) => {
      const deltaSec = (now - lastTime) / 1000
      lastTime = now
      setOffset((prev) => {
        const next = prev - speed * deltaSec
        return next <= -50 ? next + 50 : next
      })
      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [reduceMotion])

  // Repeat ribbon text with elegant separators to create an unbroken continuous loop
  const ribbonContent = React.useMemo(() => {
    const base = narrative.ribbonText
    return `${base}   ✦   ${base}   ✦   ${base}   ✦   ${base}`
  }, [narrative.ribbonText])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${narrative.cardTitle}: ${narrative.cardStep}`}
      data-slot="jarvis-dispatch-animation"
      className={cn(
        'relative flex w-full max-w-[22rem] sm:max-w-[24rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0e121a]/95 via-[#090c12]/98 to-[#05070a]/98 p-3 shadow-2xl backdrop-blur-xl select-none',
        className,
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Upper Area: Looping Ribbon Curve + Audio Waveform Pill */}
      <div className="relative aspect-[16/7.5] w-full overflow-hidden rounded-xl bg-black/40 border border-white/5">
        <svg
          viewBox="0 0 380 100"
          className="absolute inset-0 h-full w-full pointer-events-none select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <path id={pathId} d={RIBBON_PATH_D} fill="none" />
          </defs>

          {/* Subtle dashed trajectory guide line */}
          <path
            d={RIBBON_PATH_D}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeDasharray="3 4"
            strokeWidth="1"
          />

          {/* Flowing kinetic text ribbon following the curved loop */}
          <text className="fill-white/85 text-[10px] font-medium tracking-wide">
            <textPath href={`#${pathId}`} startOffset={`${offset}%`}>
              {ribbonContent}
            </textPath>
          </text>
        </svg>

        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(127,242,212,0.12)_0%,transparent_75%)]"
        />

        {/* Audio Waveform Pill (Left Origin Anchor) */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-2 py-1 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-[2.5px] h-3 px-0.5" aria-hidden="true">
            {[0.1, 0.35, 0.2, 0.45].map((delay, i) => (
              <motion.span
                key={i}
                className="w-[2px] rounded-full bg-[#7ff2d4]"
                animate={reduceMotion ? { height: '8px' } : { height: ['3px', '12px', '5px', '10px', '3px'] }}
                transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut', delay }}
              />
            ))}
          </div>
          <span className="text-[9.5px] font-semibold tracking-wider text-white/80 uppercase">
            Live
          </span>
        </div>
      </div>

      {/* Lower Area: Contextual Status Card Unique to Task */}
      <div className="relative mt-2.5 flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.035] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7ff2d4] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7ff2d4]" />
            </span>
            <span className="text-[10px] font-semibold tracking-wide uppercase text-white/85">
              {narrative.cardTitle}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] tabular-nums text-white/45">
            <Clock3 className="size-2.5 text-white/35" />
            <span>{formattedElapsed}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-[12px] font-semibold leading-tight text-white/95">
            {narrative.cardStep}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/60">
            {narrative.cardSubtext}
          </p>
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          <span className="rounded-md border border-[#7ff2d4]/20 bg-[#7ff2d4]/10 px-1.5 py-0.5 text-[9.5px] font-medium text-[#7ff2d4]">
            {narrative.tag}
          </span>
          {narrative.secondaryTag && (
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9.5px] font-medium text-white/50">
              {narrative.secondaryTag}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
