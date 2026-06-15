'use client'

import * as React from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

import { cn } from '@/lib/utils'
import type { PreviewFitMode, PreviewFramePreset } from '@/lib/types'

export const logarithmicRatioStops: Array<{
  detail: string
  detent: number
  label: string
  preset: PreviewFramePreset
}> = [
  { preset: 'source', label: 'Source', detail: 'Native', detent: 0 },
  { preset: '16:9', label: '16:9', detail: 'Wide', detent: 1.12 },
  { preset: '9:16', label: '9:16', detail: 'Vertical', detent: 2.86 },
  { preset: '1:1', label: '1:1', detail: 'Square', detent: 4.28 },
]

export const magneticDetents = logarithmicRatioStops.map((stop) => stop.detent)

export interface LiquidFrameSelectorProps {
  fitMode: PreviewFitMode
  hasSourceAsset: boolean
  onFitModeChange: (mode: PreviewFitMode) => void
  onPickSource: () => void
  onPresetChange: (preset: PreviewFramePreset) => void
  value: PreviewFramePreset
}

export function LiquidFrameSelector({
  fitMode,
  hasSourceAsset,
  onFitModeChange,
  onPickSource,
  onPresetChange,
  value,
}: LiquidFrameSelectorProps) {
  return (
    <section
      className="liquid-frame-selector relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.026] p-4 shadow-[0_30px_76px_-52px_rgba(0,0,0,0.95)]"
      aria-label="Refractive Gel Thumb-Track Selector"
    >
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id="liquid-frame-refractive-gel"
            x="-36%"
            y="-46%"
            width="172%"
            height="192%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="7.5" result="soft-gel" />
            <feColorMatrix
              in="soft-gel"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="viscous-edge"
            />
            <feOffset in="viscous-edge" dx="0.8" dy="-0.3" result="fringe-a" />
            <feOffset in="viscous-edge" dx="-0.8" dy="0.3" result="fringe-b" />
            <feBlend in="fringe-a" in2="fringe-b" mode="screen" result="chromatic-fringe" />
            <feBlend in="SourceGraphic" in2="chromatic-fringe" mode="normal" />
          </filter>
        </defs>
      </svg>

      <div className="liquid-frame-selector__grain" aria-hidden="true" />
      <div className="liquid-frame-selector__vignette" aria-hidden="true" />

      <div
        className="liquid-frame-selector__track relative grid grid-cols-4 gap-1 rounded-full p-1.5"
        aria-label="Frame aspect selector"
        role="radiogroup"
      >
        {logarithmicRatioStops.map((stop, index) => (
          <MagneticRatioButton
            key={stop.preset}
            active={value === stop.preset}
            detail={stop.detail}
            index={index}
            label={stop.label}
            onClick={() => onPresetChange(stop.preset)}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="liquid-frame-selector__fit relative grid grid-cols-2 gap-1 rounded-full border border-white/8 bg-black/34 p-1">
          <motion.span
            layout
            className={cn('liquid-frame-selector__fit-thumb', fitMode === 'fit' && 'is-fit')}
            aria-hidden="true"
            transition={{ type: 'spring', mass: 1.08, stiffness: 210, damping: 25 }}
          />
          {(['fill', 'fit'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onFitModeChange(mode)}
              className={cn(
                'relative z-10 min-h-9 rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-[color,filter,transform] duration-200 active:scale-[0.97]',
                fitMode === mode ? 'text-white' : 'text-white/38 hover:text-white/72',
              )}
              aria-pressed={fitMode === mode}
            >
              {mode}
            </button>
          ))}
        </div>

        {!hasSourceAsset ? (
          <button
            type="button"
            onClick={onPickSource}
            className="liquid-frame-selector__import min-h-10 rounded-full border border-white/10 bg-white/[0.045] px-3 text-[11px] font-semibold text-white/68 transition-[border-color,background-color,color,transform] hover:border-white/18 hover:bg-white/[0.075] hover:text-white active:scale-[0.97]"
          >
            Import
          </button>
        ) : null}
      </div>
    </section>
  )
}

function MagneticRatioButton({
  active,
  detail,
  index,
  label,
  onClick,
}: {
  active: boolean
  detail: string
  index: number
  label: string
  onClick: () => void
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 190, damping: 22, mass: 0.82 })
  const springY = useSpring(y, { stiffness: 190, damping: 22, mass: 0.82 })

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        x.set((event.clientX - rect.left - rect.width / 2) * 0.11)
        y.set((event.clientY - rect.top - rect.height / 2) * 0.14)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
      whileTap={{ scale: 0.965 }}
      style={{
        x: springX,
        y: springY,
        ['--liquid-frame-detent' as string]: magneticDetents[index],
      }}
      className={cn(
        'liquid-frame-selector__button relative min-h-[5.1rem] overflow-visible rounded-full px-2 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9ff6e3]/36',
        active ? 'text-white' : 'text-white/42 hover:text-white/72',
      )}
    >
      {active ? (
        <motion.span
          layoutId="liquid-frame-selector-thumb"
          className="liquid-frame-selector__thumb"
          transition={{ type: 'spring', mass: 1.16, stiffness: 170, damping: 22 }}
          aria-hidden="true"
        />
      ) : null}
      <span className="relative z-10 flex h-full min-h-[3.5rem] flex-col items-center justify-center gap-1">
        <span className="liquid-frame-selector__ratio text-[13px] font-semibold leading-none tracking-[-0.01em]">
          {label}
        </span>
        <span className="liquid-frame-selector__detail text-[9px] font-semibold uppercase tracking-[0.18em]">
          {detail}
        </span>
      </span>
    </motion.button>
  )
}
