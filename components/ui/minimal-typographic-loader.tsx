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

export function MinimalTypographicLoader({
  ambient = true,
  className,
  label = 'Loading...',
  message = 'Preparing the workspace.',
  size = 'lg',
  variant = 'screen',
}: MinimalTypographicLoaderProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const rootRef = React.useRef<HTMLElement | null>(null)
  const ariaLabel = message ? `${label} ${message}` : label

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
      {ambient ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(99,74,255,0.12)_0%,rgba(37,28,114,0.08)_28%,rgba(0,0,0,0)_58%),radial-gradient(circle_at_50%_50%,rgba(15,255,166,0.035)_0%,rgba(0,0,0,0)_52%)]"
        />
      ) : null}
      <div
        className={cn(
          'relative aspect-[4/3] select-none overflow-visible',
          LOADER_SIZE_CLASS_NAMES[size],
          prefersReducedMotion && 'opacity-90',
        )}
      >
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
      </div>
      <span className="sr-only">{ariaLabel}</span>
    </section>
  )
}
