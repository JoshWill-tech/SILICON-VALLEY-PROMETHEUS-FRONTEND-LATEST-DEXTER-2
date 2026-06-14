'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type MinimalTypographicLoaderProps = {
  ambient?: boolean
  className?: string
  label?: string
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'screen' | 'panel' | 'inline'
}

const ROOT_VARIANT_CLASS_NAMES = {
  screen: 'min-h-dvh px-6 py-12',
  panel: 'min-h-[clamp(14rem,34vh,26rem)] px-6 py-8',
  inline: 'min-h-[clamp(9rem,24vh,15rem)] px-4 py-5',
} as const

const LOADER_SIZE_CLASS_NAMES = {
  sm: 'w-[min(10rem,58vw)]',
  md: 'w-[min(16rem,64vw)]',
  lg: 'w-[min(22rem,72vw)]',
} as const

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined

  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', callback)

  return () => query.removeEventListener('change', callback)
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined' || !window.matchMedia) return true

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getReducedMotionServerSnapshot() {
  return true
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  )
}

function PrometheusInfinityMark({
  reducedMotion,
}: {
  reducedMotion: boolean
}) {
  const path =
    'M36 60 C36 34 68 24 96 50 C109 62 119 74 136 74 C164 74 188 42 204 60 C188 78 164 46 136 46 C119 46 109 58 96 70 C68 96 36 86 36 60 Z'

  return (
    <svg
      aria-hidden="true"
      className={cn('prometheus-infinity-mark', reducedMotion && 'is-reduced-motion')}
      viewBox="0 0 240 120"
      fill="none"
    >
      <defs>
        <linearGradient id="prometheus-infinity-stroke" x1="35" y1="54" x2="206" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22f5d4" stopOpacity="0.2" />
          <stop offset="0.45" stopColor="#f8ffff" />
          <stop offset="0.72" stopColor="#7bd7ff" />
          <stop offset="1" stopColor="#7768ff" stopOpacity="0.5" />
        </linearGradient>
        <filter id="prometheus-infinity-glow" x="-20%" y="-60%" width="140%" height="220%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="0 0 0 0 0.24 0 0 0 0 0.82 0 0 0 0 1 0 0 0 0.88 0"
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="prometheus-infinity-core" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(122 67) rotate(90) scale(28 46)">
          <stop stopColor="#efffff" stopOpacity="0.34" />
          <stop offset="0.35" stopColor="#4ed9ff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className="prometheus-infinity-mark__bloom" cx="122" cy="68" rx="62" ry="34" fill="url(#prometheus-infinity-core)" />
      <path className="prometheus-infinity-mark__ghost" d={path} />
      <path
        className="prometheus-infinity-mark__trail"
        d={path}
        pathLength={1}
        stroke="url(#prometheus-infinity-stroke)"
        filter="url(#prometheus-infinity-glow)"
      />
      <path className="prometheus-infinity-mark__hotline" d={path} pathLength={1} />
    </svg>
  )
}

export function MinimalTypographicLoader({
  ambient = true,
  className,
  label = 'Loading...',
  message = 'Preparing the workspace.',
  size = 'lg',
  variant = 'screen',
}: MinimalTypographicLoaderProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const ariaLabel = message ? `${label} ${message}` : label

  return (
    <section
      className={cn(
        'pointer-events-none relative flex w-full items-center justify-center overflow-visible bg-transparent',
        ROOT_VARIANT_CLASS_NAMES[variant],
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {ambient ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(82,186,255,0.085)_0%,rgba(71,30,236,0.045)_30%,rgba(0,0,0,0)_62%)]"
        />
      ) : null}
      <div
        className={cn(
          'relative aspect-[2/1] select-none overflow-visible',
          LOADER_SIZE_CLASS_NAMES[size],
          prefersReducedMotion && 'opacity-90',
        )}
      >
        <PrometheusInfinityMark reducedMotion={prefersReducedMotion} />
      </div>
      <span className="sr-only">{ariaLabel}</span>
    </section>
  )
}
