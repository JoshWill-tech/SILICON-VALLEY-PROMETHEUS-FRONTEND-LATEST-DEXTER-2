'use client'

import * as React from 'react'
import { gsap } from 'gsap'

import { cn } from '@/lib/utils'

type MinimalTypographicLoaderProps = {
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

const TEXT_SIZE_CLASS_NAMES = {
  sm: 'text-2xl sm:text-3xl',
  md: 'text-4xl sm:text-5xl',
  lg: 'text-5xl sm:text-7xl',
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
  className,
  label = 'Loading...',
  message = 'Preparing the workspace.',
  size = 'lg',
  variant = 'screen',
}: MinimalTypographicLoaderProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const rootRef = React.useRef<HTMLElement | null>(null)
  const textRef = React.useRef<HTMLParagraphElement | null>(null)
  const ariaLabel = message ? `${label} ${message}` : label

  React.useEffect(() => {
    const root = rootRef.current
    const text = textRef.current

    if (!root || !text) return

    const context = gsap.context(() => {
      gsap.set(text, {
        letterSpacing: prefersReducedMotion ? '2px' : '1px',
        opacity: prefersReducedMotion ? 0.64 : 0.52,
      })

      if (prefersReducedMotion) return

      gsap
        .timeline({
          repeat: -1,
          yoyo: true,
          defaults: {
            duration: 3,
            ease: 'sine.inOut',
          },
        })
        .to(text, {
          letterSpacing: '4px',
          opacity: 0.76,
        })
    }, root)

    return () => context.revert()
  }, [prefersReducedMotion])

  return (
    <section
      ref={rootRef}
      className={cn(
        'relative isolate flex w-full items-center justify-center overflow-hidden bg-[#000000]',
        ROOT_VARIANT_CLASS_NAMES[variant],
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <p
        ref={textRef}
        className={cn(
          'select-none text-center font-sans font-medium leading-none text-[#555555]',
          TEXT_SIZE_CLASS_NAMES[size],
        )}
        style={{
          fontFamily: 'var(--font-ui)',
          letterSpacing: '1px',
          opacity: 0.52,
        }}
      >
        Prometheus
      </p>
    </section>
  )
}
