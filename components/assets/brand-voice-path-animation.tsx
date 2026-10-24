'use client'

import * as React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface BrandVoicePathAnimationProps {
  brandQuery: string
  isAnalyzing?: boolean
  className?: string
  onComplete?: () => void
  /** When false (default) the component is hidden; set to true after the search button is clicked with a URL */
  visible?: boolean
  /** Optional custom extracted insights from the agentic brand resolution engine */
  customInsights?: string[]
}

/**
 * Brand discovery prompts tailored to the submitted source.
 * These describe identity and preferences, without claiming verified findings.
 */
export const WITTY_PUNS_BY_TYPE = {
  youtube: [
    'Getting to know {brand}\'s channel identity and creative preferences...',
    'Exploring the colors and thumbnail style that make {brand} recognizable...',
    'Considering {brand}\'s typography, captions, and visual style...',
    'Getting a feel for {brand}\'s tone of voice and storytelling preferences...',
    'Bringing {brand}\'s brand identity into focus for future videos...',
  ],
  social: [
    'Getting to know {brand}\'s visual identity and style preferences...',
    'Exploring {brand}\'s color palette and the mood behind the feed...',
    'Considering the typography and imagery that express {brand}\'s identity...',
    'Getting a feel for {brand}\'s brand voice and creative preferences...',
    'Bringing {brand}\'s signature style into focus for future content...',
  ],
  domain: [
    'Getting to know {brand}\'s brand identity and creative preferences...',
    'Exploring {brand}\'s color palette and visual direction...',
    'Considering the typography and imagery that give {brand} its character...',
    'Getting a feel for {brand}\'s tone of voice and brand personality...',
    'Bringing {brand}\'s style preferences into focus for future content...',
  ],
  fallback: [
    'Getting to know {brand}\'s brand identity and preferences...',
    'Exploring the colors, typography, and imagery that express {brand}...',
    'Considering {brand}\'s tone of voice and creative direction...',
    'Bringing {brand}\'s preferred visual style into focus...',
  ],
}

/**
 * Extract clean brand name and type from raw query
 */
export function extractBrandInfo(query: string): { brandName: string; category: 'youtube' | 'social' | 'domain' | 'fallback' } {
  const trimmed = query.trim()
  if (!trimmed) {
    return { brandName: 'Your Brand', category: 'fallback' }
  }

  // YouTube
  if (/youtube\.com|youtu\.be/i.test(trimmed)) {
    const handleMatch = trimmed.match(/@([a-zA-Z0-9_.-]+)/)
    if (handleMatch) {
      const clean = handleMatch[1].startsWith('@') ? handleMatch[1].slice(1) : handleMatch[1]
      const formatted = clean.charAt(0).toUpperCase() + clean.slice(1)
      return { brandName: formatted, category: 'youtube' }
    }

    if (/watch\?v=|shorts\/|youtu\.be\/|embed\//i.test(trimmed)) {
      return { brandName: 'YouTube Creator', category: 'youtube' }
    }

    const channelName = trimmed
      .replace(/^(https?:\/\/)?(www\.)?youtube\.com\/(c\/|channel\/|user\/)?/i, '')
      .split('?')[0]
      .split('/')[0]
    const clean = (channelName.startsWith('@') ? channelName.slice(1) : channelName) || 'YouTube Brand'
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1)
    return { brandName: formatted, category: 'youtube' }
  }

  // Instagram / Social handle
  if (trimmed.startsWith('@') || /instagram\.com|tiktok\.com|twitter\.com|x\.com/i.test(trimmed)) {
    const clean = trimmed.replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?(instagram|tiktok|twitter|x)\.com\//i, '').replace(/\/.*$/, '')
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1)
    return { brandName: formatted || 'Creator Brand', category: 'social' }
  }

  // Web Domain
  if (/^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i.test(trimmed)) {
    try {
      const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
      const hostname = new URL(url).hostname.replace(/^www\./, '')
      const name = hostname.split('.')[0] || hostname
      const formatted = name.charAt(0).toUpperCase() + name.slice(1)
      return { brandName: formatted, category: 'domain' }
    } catch {
      const name = trimmed.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0] || trimmed
      const formatted = name.charAt(0).toUpperCase() + name.slice(1)
      return { brandName: formatted, category: 'domain' }
    }
  }

  const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  return { brandName: formatted, category: 'fallback' }
}

export function getRandomWittyPun(query: string, excludeText?: string): string {
  const { brandName, category } = extractBrandInfo(query)
  const pool = WITTY_PUNS_BY_TYPE[category] || WITTY_PUNS_BY_TYPE.fallback
  const messages = pool.map((template) => template.replace(/\{brand\}/g, brandName))
  const filtered = messages.filter((message) => message !== excludeText)
  return filtered[Math.floor(Math.random() * filtered.length)] || messages[0]
}

export function BrandVoicePathAnimation({
  brandQuery,
  isAnalyzing = false,
  className,
  onComplete,
  visible = false,
  customInsights,
}: BrandVoicePathAnimationProps) {
  const reduceMotion = useReducedMotion()
  const textPathRef = React.useRef<SVGTextPathElement | null>(null)
  const [insightIndex, setInsightIndex] = React.useState(0)

  const getTextForCycle = React.useCallback(
    (index: number, exclude?: string) => {
      if (customInsights && customInsights.length > 0) {
        return customInsights[index % customInsights.length]
      }
      return getRandomWittyPun(brandQuery, exclude)
    },
    [brandQuery, customInsights]
  )

  const [currentText, setCurrentText] = React.useState<string>(() => getTextForCycle(0))
  const [cycleCount, setCycleCount] = React.useState(0)

  // Unique SVG IDs to avoid collisions
  const reactId = React.useId().replace(/:/g, '')
  const pathId = `speechLoopPath-${reactId}`
  const gradientId = `edgeFadeGradient-${reactId}`
  const maskId = `edgeFadeMask-${reactId}`

  // Update text when brandQuery or customInsights changes significantly
  React.useEffect(() => {
    setInsightIndex(0)
    setCurrentText(getTextForCycle(0))
  }, [brandQuery, customInsights, getTextForCycle])

  const nextWittyPun = React.useCallback(() => {
    setInsightIndex((i) => {
      const nextIdx = i + 1
      setCurrentText(getTextForCycle(nextIdx, currentText))
      return nextIdx
    })
    setCycleCount((c) => c + 1)
  }, [currentText, getTextForCycle])

  // Stream out of the waveform, then hold the complete loop like the reference.
  React.useEffect(() => {
    if (!visible) return
    const textPath = textPathRef.current
    if (!textPath) return
    const targetOffset = 1.6

    // Ensure the animation begins cleanly from the start point behind the voice pill
    textPath.setAttribute('startOffset', '-75%')

    let animFrameId: number | null = null
    let startTime: number | null = null
    let lastCycle = 0

    function runAnimation(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const tp = textPath!

      const streamDuration = 3400
      const holdDuration = 2600
      const loopDuration = streamDuration + holdDuration
      const cycle = Math.floor(elapsed / loopDuration)
      if (cycle > lastCycle) {
        lastCycle = cycle
        setCurrentText((previous) => getTextForCycle(cycle, previous))
      }
      const cycleTime = elapsed % loopDuration
      const progress = 1 - Math.pow(1 - Math.min(cycleTime / streamDuration, 1), 3)
      const drift = cycleTime < streamDuration
        ? 0
        : Math.sin(((cycleTime - streamDuration) / holdDuration) * Math.PI * 2) * 0.25
      const currentOffset = -75 + progress * (targetOffset + 75) + drift
      tp.setAttribute('startOffset', `${currentOffset.toFixed(2)}%`)

      animFrameId = requestAnimationFrame(runAnimation)
    }

    animFrameId = requestAnimationFrame(runAnimation)

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
    }
  }, [visible, brandQuery, cycleCount, onComplete])

  if (!visible) return null

  return (
    <div
      data-testid="brand-voice-path-stage"
      className={cn(
        'relative w-full max-w-[920px] mx-auto overflow-hidden rounded-[24px] border border-[#55ff9b]/20 bg-[#060b07]/90 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_1px_3px_rgba(85,255,155,0.06)] backdrop-blur-md select-none',
        className
      )}
      style={{ aspectRatio: '920 / 360' }}
    >
      <p className="sr-only" role="status" aria-live="polite">
        {currentText}
      </p>
      {/* Background Ambient Grid Accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(85,255,155,0.08) 0%, transparent 65%)',
        }}
      />

      {/* Voice Waveform Pill positioned over the path origin */}
      <button
        type="button"
        data-testid="voice-pill"
        onClick={nextWittyPun}
        title="Show the next brand discovery message"
        aria-label="Show the next brand discovery message"
        className={cn(
          'group absolute z-20 flex h-[13.333%] w-[10%] cursor-pointer items-center justify-center gap-[clamp(1px,0.24vw,3px)] rounded-full border border-[#55ff9b]/35 bg-[#0f1712] p-0 shadow-[0_6px_20px_rgba(0,0,0,0.6),0_0_15px_rgba(85,255,155,0.18)] transition-all duration-300 hover:scale-105 hover:border-[#55ff9b]/70 hover:shadow-[0_0_25px_rgba(85,255,155,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ff9b]',
          isAnalyzing && 'ring-2 ring-[#55ff9b]/60 border-[#55ff9b]'
        )}
        style={{
          left: '3.1%',
          top: '68.8%',
          transform: 'translateY(-50%)',
        }}
      >
        <span
          className="w-[2px] rounded-full bg-[#55ff9b]/60 transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.05s',
            ['--max-h' as string]: '7px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-[#55ff9b]/60 transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.22s',
            ['--max-h' as string]: '8px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-white transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.12s',
            ['--max-h' as string]: '14px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-[#63ffa4] transition-all group-hover:bg-white"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.35s',
            ['--max-h' as string]: '18px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-white transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.18s',
            ['--max-h' as string]: '11px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-[#55ff9b] transition-all group-hover:bg-white"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.02s',
            ['--max-h' as string]: '20px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-[#55ff9b]/60 transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.40s',
            ['--max-h' as string]: '8px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-white transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.27s',
            ['--max-h' as string]: '13px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-[#63ffa4] transition-all group-hover:bg-white"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.14s',
            ['--max-h' as string]: '16px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-[#55ff9b]/60 transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.31s',
            ['--max-h' as string]: '7px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-white transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.08s',
            ['--max-h' as string]: '18px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-[#63ffa4] transition-all group-hover:bg-white"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.21s',
            ['--max-h' as string]: '12px',
          }}
        />
        <span
          className="w-[2px] rounded-full bg-white transition-all group-hover:bg-[#55ff9b]"
          style={{
            height: '6px',
            animation: 'brandWavePulse 0.85s ease-in-out infinite alternate',
            animationDelay: '0.37s',
            ['--max-h' as string]: '16px',
          }}
        />
      </button>

      {/* SVG Roller-Coaster Text Path matching exact geometry */}
      <svg
        className="block h-full w-full"
        viewBox="0 0 920 360"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          {/* Roller-coaster loop path matching user-provided geometry */}
          <path
            id={pathId}
            d="M 68,248
               C 235,248 462,222 462,115
               C 462,56 418,28 375,28
               C 332,28 288,56 288,115
               C 288,175 368,284 468,284
               C 565,284 685,192 915,196"
            fill="none"
          />

          {/* Horizontal fade mask for the pill exit on the left and soft fade-out on the right */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="black" />
            <stop offset="8.5%" stopColor="black" />
            <stop offset="13%" stopColor="white" />
            <stop offset="78%" stopColor="white" />
            <stop offset="95%" stopColor="#555555" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>

          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="920" height="360">
            <rect x="0" y="0" width="920" height="360" fill={`url(#${gradientId})`} />
          </mask>
        </defs>

        <g mask={`url(#${maskId})`} style={{ willChange: 'transform' }}>
          <text
            className="select-none font-sans font-normal tracking-[-0.015em]"
            style={{
              fontSize: '30px',
              fill: '#bbf7d0',
              filter: 'drop-shadow(0 2px 8px rgba(85,255,155,0.22))',
              willChange: 'transform',
            }}
          >
            <textPath
              ref={textPathRef}
              id={`animatedTextPath-${reactId}`}
              href={`#${pathId}`}
              xlinkHref={`#${pathId}`}
              startOffset="-75%"
            >
              {currentText}
            </textPath>
          </text>
        </g>
      </svg>

      {/* Floating Status Label */}
      <div className="absolute bottom-3 inset-x-4 hidden items-center pointer-events-auto sm:flex">
        <div className="flex items-center gap-2 rounded-full border border-[#55ff9b]/25 bg-black/60 px-3 py-1 text-[11px] text-[#63ffa4] backdrop-blur-md">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55ff9b] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#55ff9b]" />
          </span>
          <span className="font-mono uppercase tracking-wider text-white/50 text-[10px]">
            {isAnalyzing ? 'Applying brand preferences' : 'Brand identity & preferences'}
          </span>
        </div>
      </div>

      {/* Embedded CSS Keyframes for the equalizer bars */}
      <style jsx>{`
        [data-testid='voice-pill']::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: max(100%, 44px);
          height: max(100%, 44px);
          transform: translate(-50%, -50%);
        }
        @keyframes brandWavePulse {
          0% {
            height: 4px;
          }
          100% {
            height: var(--max-h, 16px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid='voice-pill'] span,
          .animate-ping {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
