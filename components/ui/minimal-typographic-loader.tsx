'use client'

import * as React from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

type MinimalTypographicLoaderProps = {
  ambient?: boolean
  className?: string
  label?: string
  message?: string
  size?: 'sm' | 'md' | 'lg'
  standalone?: boolean
  variant?: 'screen' | 'panel' | 'inline'
}

const ROOT_VARIANT_CLASS_NAMES = {
  screen: 'min-h-dvh px-6 py-12',
  panel: 'min-h-[clamp(14rem,34vh,26rem)] px-6 py-8',
  inline: 'min-h-[clamp(9rem,24vh,15rem)] px-4 py-5',
} as const

const LOADER_SIZE_CLASS_NAMES = {
  sm: 'w-[min(18rem,86vw)]',
  md: 'w-[min(28rem,88vw)]',
  lg: 'w-[min(40rem,92vw)]',
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

function StandaloneInfinityMark({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const rawId = React.useId()
  const idBase = React.useMemo(() => rawId.replace(/:/g, ''), [rawId])
  const trailGradientId = `${idBase}-trail`
  const activeGradientId = `${idBase}-active`
  const glowFilterId = `${idBase}-glow`
  const path =
    'M54 60 C54 34 83 34 110 60 C137 86 166 86 166 60 C166 34 137 34 110 60 C83 86 54 86 54 60'

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 120"
      className="h-full w-full overflow-visible"
      fill="none"
    >
      <defs>
        <linearGradient id={trailGradientId} x1="42" y1="60" x2="178" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7ff2d4" stopOpacity="0.08" />
          <stop offset="0.44" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="0.72" stopColor="#83a6ff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#7ff2d4" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id={activeGradientId} x1="48" y1="60" x2="172" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7ff2d4" stopOpacity="0" />
          <stop offset="0.32" stopColor="#96fff0" stopOpacity="0.95" />
          <stop offset="0.52" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.74" stopColor="#8fa7ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#8fa7ff" stopOpacity="0" />
        </linearGradient>
        <filter id={glowFilterId} x="-35%" y="-70%" width="170%" height="240%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.35 0 0 0 0 0.92 0 0 0 0 1 0 0 0 0.86 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        stroke={`url(#${trailGradientId})`}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.78"
      />
      <path
        d={path}
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.16"
      />
      <path
        d={path}
        stroke={`url(#${activeGradientId})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="46 238"
        strokeDashoffset="0"
        filter={`url(#${glowFilterId})`}
      >
        {!prefersReducedMotion ? (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-284"
            dur="1.42s"
            repeatCount="indefinite"
          />
        ) : null}
      </path>
      <path
        d={path}
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="16 268"
        strokeDashoffset="0"
        opacity="0.72"
      >
        {!prefersReducedMotion ? (
          <animate
            attributeName="stroke-dashoffset"
            from="-22"
            to="-306"
            dur="1.42s"
            repeatCount="indefinite"
          />
        ) : null}
      </path>
    </svg>
  )
}

export function MinimalTypographicLoader({
  ambient = true,
  className,
  label = 'Loading...',
  message = 'Preparing the workspace.',
  size = 'lg',
  standalone = false,
  variant = 'screen',
}: MinimalTypographicLoaderProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const rootRef = React.useRef<HTMLElement | null>(null)
  const ariaLabel = message ? `${label} ${message}` : label
  const showAmbient = ambient && !standalone

  return (
    <section
      ref={rootRef}
      className={cn(
        'pointer-events-none relative flex w-full items-center justify-center overflow-visible bg-transparent',
        ROOT_VARIANT_CLASS_NAMES[variant],
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {showAmbient ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(99,74,255,0.12)_0%,rgba(37,28,114,0.08)_28%,rgba(0,0,0,0)_58%),radial-gradient(circle_at_50%_50%,rgba(15,255,166,0.035)_0%,rgba(0,0,0,0)_52%)]"
        />
      ) : null}
      <div
        className={cn(
          'relative select-none overflow-visible',
          standalone ? 'aspect-[11/6]' : 'aspect-[4/3]',
          LOADER_SIZE_CLASS_NAMES[size],
          prefersReducedMotion && 'opacity-90',
        )}
      >
        {standalone ? (
          <StandaloneInfinityMark prefersReducedMotion={prefersReducedMotion} />
        ) : (
          <Image
            src="/loaders/prometheus-infinity-loader.gif"
            alt=""
            width={800}
            height={600}
            unoptimized
            priority={variant === 'screen'}
            className={cn(
              'h-full w-full object-contain mix-blend-screen',
              ambient
                ? '[mask-image:radial-gradient(ellipse_at_center,black_0%,black_48%,rgba(0,0,0,0.72)_62%,transparent_82%)]'
                : '[mask-image:radial-gradient(ellipse_at_center,black_0%,black_36%,rgba(0,0,0,0.62)_50%,transparent_70%)]',
            )}
          />
        )}
      </div>
      <span className="sr-only">{ariaLabel}</span>
    </section>
  )
}
