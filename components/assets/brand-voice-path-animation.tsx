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
    const channelName = handleMatch
      ? handleMatch[1]
      : trimmed.replace(/^(https?:\/\/)?(www\.)?youtube\.com\/(c\/|channel\/|user\/)?/i, '')
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
}: BrandVoicePathAnimationProps) {
  const reduceMotion = useReducedMotion()
  const textPathRef = React.useRef<SVGTextPathElement | null>(null)
  const [currentText, setCurrentText] = React.useState<string>(() => getRandomWittyPun(brandQuery))
  const [cycleCount, setCycleCount] = React.useState(0)

  // Unique SVG IDs to avoid collisions
  const reactId = React.useId().replace(/:/g, '')
  const pathId = `speechLoopPath-${reactId}`
  const gradientId = `edgeFadeGradient-${reactId}`
  const maskId = `edgeFadeMask-${reactId}`

  // Update text when brandQuery changes significantly
  React.useEffect(() => {
    setCurrentText(getRandomWittyPun(brandQuery))
  }, [brandQuery])

  const nextWittyPun = React.useCallback(() => {
    setCurrentText((prev) => getRandomWittyPun(brandQuery, prev))
    setCycleCount((c) => c + 1)
  }, [brandQuery])

  // Advance the copy as each complete message leaves the path.
  React.useEffect(() => {
    if (!visible || reduceMotion) return
    const textPath = textPathRef.current
    if (!textPath) return

    let animFrameId: number | null = null
    let startTime: number | null = null
    let lastCycle = 0

    function runAnimation(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const tp = textPath!

      // Continuous flowing marquee along the loop
      const loopDuration = 9000
      const cycle = Math.floor(elapsed / loopDuration)
      if (cycle > lastCycle) {
        lastCycle = cycle
        setCurrentText((previous) => getRandomWittyPun(brandQuery, previous))
      }
      const progress = (elapsed % loopDuration) / loopDuration
      const currentOffset = -85 + progress * 185
      tp.setAttribute('startOffset', `${currentOffset}%`)

      animFrameId = requestAnimationFrame(runAnimation)
    }

    animFrameId = requestAnimationFrame(runAnimation)

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
    }
  }, [visible, brandQuery, cycleCount, onComplete, reduceMotion])

  if (!visible) return null

  return (
    <div
      data-testid="brand-voice-path-stage"
      className={cn(
        'relative w-full max-w-[920px] mx-auto overflow-hidden rounded-[24px] border border-[#55ff9b]/20 bg-[#060b07]/90 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_1px_3px_rgba(85,255,155,0.06)] backdrop-blur-md select-none',
        className
      )}
      style={{ aspectRatio: '920 / 330' }}
    >
      <p className={reduceMotion ? 'absolute inset-x-6 top-1/3 text-center text-sm text-[#bbf7d0] sm:text-lg' : 'sr-only'} role="status" aria-live="polite">
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
          'group absolute z-20 flex h-[48px] w-[96px] cursor-pointer items-center justify-center gap-[3px] rounded-full border border-[#55ff9b]/35 bg-[#0f1712] px-4 shadow-[0_6px_20px_rgba(0,0,0,0.6),0_0_15px_rgba(85,255,155,0.18)] transition-all duration-300 hover:scale-105 hover:border-[#55ff9b]/70 hover:shadow-[0_0_25px_rgba(85,255,155,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ff9b]',
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
        className={cn('block h-full w-full', reduceMotion && 'invisible')}
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

          <mask id={maskId}>
            <rect x="0" y="0" width="920" height="360" fill={`url(#${gradientId})`} />
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          <text
            className="select-none font-sans font-normal tracking-[-0.015em]"
            style={{
              fontSize: '30px',
              fill: '#bbf7d0',
              filter: 'drop-shadow(0 2px 8px rgba(85,255,155,0.22))',
            }}
          >
            <textPath
              ref={textPathRef}
              id="animatedTextPath"
              href={`#${pathId}`}
              startOffset="0%"
            >
              {currentText}
            </textPath>
          </text>
        </g>
      </svg>

      {/* Floating Status Label */}
      <div className="absolute bottom-3 inset-x-4 flex items-center pointer-events-auto">
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
