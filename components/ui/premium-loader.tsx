'use client'

import * as React from 'react'
import { gsap } from 'gsap'

import { cn } from '@/lib/utils'

type PremiumLoaderProps = {
  className?: string
  factClassName?: string
  label?: string
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'screen' | 'panel' | 'inline'
}

const SIZE_CLASS_NAMES = {
  sm: 'h-12 w-24',
  md: 'h-16 w-32',
  lg: 'h-20 w-40',
} as const

const INFINITY_PATH =
  'M24 50 C24 22 55 20 78 43 C88 53 96 58 100 58 C104 58 112 53 122 43 C145 20 176 22 176 50 C176 78 145 80 122 57 C112 47 104 42 100 42 C96 42 88 47 78 57 C55 80 24 78 24 50'

export function PremiumLoader({
  className,
  label = 'Loading...',
  message,
  size = 'md',
  variant = 'panel',
}: PremiumLoaderProps) {
  const uniqueId = React.useId().replace(/:/g, '')
  const gradientId = `${uniqueId}-neon-gradient`
  const bloomFilterId = `${uniqueId}-bloom`

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const trackRef = React.useRef<SVGPathElement | null>(null)
  const revealRef = React.useRef<SVGPathElement | null>(null)
  const trailBloomRef = React.useRef<SVGPathElement | null>(null)
  const trailRef = React.useRef<SVGPathElement | null>(null)
  const cometRef = React.useRef<SVGCircleElement | null>(null)
  const cometCoreRef = React.useRef<SVGCircleElement | null>(null)
  const glowRef = React.useRef<HTMLDivElement | null>(null)
  const haloRef = React.useRef<HTMLDivElement | null>(null)
  const textRef = React.useRef<HTMLParagraphElement | null>(null)
  const stopARef = React.useRef<SVGStopElement | null>(null)
  const stopBRef = React.useRef<SVGStopElement | null>(null)
  const stopCRef = React.useRef<SVGStopElement | null>(null)

  React.useLayoutEffect(() => {
    const svg = svgRef.current
    const track = trackRef.current
    const reveal = revealRef.current
    const trailBloom = trailBloomRef.current
    const trail = trailRef.current
    const comet = cometRef.current
    const cometCore = cometCoreRef.current
    const glow = glowRef.current
    const halo = haloRef.current
    const text = textRef.current

    if (!svg || !track || !reveal || !trailBloom || !trail || !comet || !cometCore || !glow || !halo || !text) return

    const pathLength = track.getTotalLength()
    const dash = pathLength * 0.17
    const gap = pathLength - dash
    const bloomDash = pathLength * 0.3
    const bloomGap = pathLength - bloomDash
    const state = { progress: 0 }

    gsap.set(rootRef.current, { autoAlpha: 0 })
    gsap.set(svg, { autoAlpha: 0, scale: 0.985, transformOrigin: '50% 50%' })
    gsap.set(text, { autoAlpha: 0, y: 3 })
    gsap.set([glow, halo], { autoAlpha: 0, scale: 0.82, transformOrigin: '50% 50%' })
    gsap.set(reveal, { strokeDasharray: pathLength, strokeDashoffset: pathLength })
    gsap.set(trail, { strokeDasharray: `${dash} ${gap}`, strokeDashoffset: 0, autoAlpha: 0 })
    gsap.set(trailBloom, { strokeDasharray: `${bloomDash} ${bloomGap}`, strokeDashoffset: pathLength * 0.04, autoAlpha: 0 })
    gsap.set([comet, cometCore], { autoAlpha: 0, transformOrigin: '50% 50%' })

    const paintComet = () => {
      const point = track.getPointAtLength((state.progress % 1) * pathLength)
      gsap.set([comet, cometCore], { attr: { cx: point.x, cy: point.y } })
    }

    paintComet()

    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      intro
        .to(rootRef.current, { autoAlpha: 1, duration: 0.38, ease: 'power1.out' }, 0)
        .to([glow, halo], { autoAlpha: 1, scale: 1, duration: 0.95 }, 0.08)
        .to(svg, { autoAlpha: 1, scale: 1, duration: 0.62 }, 0.1)
        .to(reveal, { strokeDashoffset: 0, duration: 1.08 }, 0.18)
        .to(text, { autoAlpha: 1, y: 0, duration: 0.58, ease: 'power1.out' }, 0.82)
        .to([trailBloom, trail, comet, cometCore], { autoAlpha: 1, duration: 0.34 }, 1.0)
        .to(reveal, { autoAlpha: 0.28, duration: 0.5 }, 1.16)

      const chase = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' }, delay: 1.2 })
      chase
        .to(state, {
          progress: 0.5,
          duration: 1.22,
          onUpdate: paintComet,
        })
        .to(state, {
          progress: 1,
          duration: 1.22,
          onUpdate: paintComet,
        })
        .set(state, { progress: 0 })

      gsap.to(trail, {
        strokeDashoffset: -pathLength,
        duration: 2.44,
        ease: 'power2.inOut',
        repeat: -1,
        delay: 1.2,
      })
      gsap.to(trailBloom, {
        strokeDashoffset: -pathLength + pathLength * 0.04,
        duration: 2.44,
        ease: 'power2.inOut',
        repeat: -1,
        delay: 1.2,
      })
      gsap.to([comet, cometCore], {
        scale: 1.18,
        opacity: 0.78,
        duration: 0.68,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.18,
      })
      gsap.to(glow, {
        autoAlpha: 0.72,
        scale: 1.18,
        duration: 1.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.42,
      })
      gsap.to(halo, {
        autoAlpha: 0.42,
        scaleX: 1.12,
        duration: 1.85,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.58,
      })
      gsap.to(text, {
        opacity: 0.7,
        duration: 1.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.06,
      })
      gsap.to(stopARef.current, {
        attr: { 'stop-color': '#8b5cf6' },
        duration: 1.28,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.15,
      })
      gsap.to(stopBRef.current, {
        attr: { 'stop-color': '#00f0ff' },
        duration: 1.36,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.2,
      })
      gsap.to(stopCRef.current, {
        attr: { 'stop-color': '#0080ff' },
        duration: 1.44,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.25,
      })

      return () => {
        intro.kill()
        chase.kill()
      }
    }, rootRef)

    return () => context.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden text-center text-white',
        variant === 'screen' && 'min-h-screen bg-[#030303] px-6',
        variant === 'panel' && 'rounded-[28px] border border-white/8 bg-[#030303] px-6 py-10 shadow-[0_34px_90px_-58px_rgba(0,0,0,0.95)]',
        variant === 'inline' && 'bg-transparent px-4 py-5',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={message ? `${label} ${message}` : label}
    >
      <div aria-hidden className="relative isolate">
        <div
          ref={glowRef}
          className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0080ff]/25 blur-3xl"
        />
        <div
          ref={haloRef}
          className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8b5cf6]/18 blur-2xl"
        />
        <svg
          ref={svgRef}
          viewBox="0 0 200 100"
          className={cn('relative z-10 overflow-visible', SIZE_CLASS_NAMES[size])}
          fill="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="6%" y1="18%" x2="94%" y2="82%">
              <stop ref={stopARef} offset="0%" stopColor="#00f0ff" />
              <stop ref={stopBRef} offset="46%" stopColor="#0080ff" />
              <stop ref={stopCRef} offset="78%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <filter id={bloomFilterId} x="-55%" y="-95%" width="210%" height="290%">
              <feGaussianBlur stdDeviation="3.8" result="softGlow" />
              <feColorMatrix
                in="softGlow"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0.66 0 0 0 0 1 0 0 0 0.82 0"
                result="blueGlow"
              />
              <feMerge>
                <feMergeNode in="blueGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            ref={trackRef}
            d={INFINITY_PATH}
            pathLength={1}
            stroke="rgba(148,163,184,0.12)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            ref={revealRef}
            d={INFINITY_PATH}
            stroke={`url(#${gradientId})`}
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${bloomFilterId})`}
          />
          <path
            ref={trailBloomRef}
            d={INFINITY_PATH}
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${bloomFilterId})`}
            opacity="0.42"
          />
          <path
            ref={trailRef}
            d={INFINITY_PATH}
            stroke={`url(#${gradientId})`}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${bloomFilterId})`}
          />
          <circle ref={cometRef} r="4.4" fill="#00f0ff" opacity="0.42" filter={`url(#${bloomFilterId})`} />
          <circle ref={cometCoreRef} r="1.8" fill="#ffffff" />
        </svg>
      </div>

      <p
        ref={textRef}
        className="relative mt-7 text-[11px] font-light uppercase tracking-[0.18em] text-[#4b5563]"
      >
        {label}
      </p>
      {message ? <span className="sr-only">{message}</span> : null}
    </div>
  )
}

export function PremiumLoadingScreen(props: Omit<PremiumLoaderProps, 'variant'>) {
  return <PremiumLoader {...props} variant="screen" />
}
