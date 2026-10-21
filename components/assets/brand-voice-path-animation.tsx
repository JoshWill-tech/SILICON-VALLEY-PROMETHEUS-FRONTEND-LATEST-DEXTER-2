'use client'

import * as React from 'react'
import { Sparkles, Play, RefreshCw, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BrandVoicePathAnimationProps {
  brandQuery: string
  isAnalyzing?: boolean
  className?: string
  onComplete?: () => void
}

/**
 * Curated witty, pun-filled lines tailored to brand types & channels.
 * Dynamically interpolated with the brand name.
 */
export const WITTY_PUNS_BY_TYPE = {
  youtube: [
    'Smash that like button on your brand DNA... subscribing to 60fps high-retention vibes...',
    'Buffering 100% pure charisma... our timeline algorithm just fell in love with {brand}\'s pacing...',
    'Demonetizing boring corporate templates... {brand} is strictly 4K creator-tier cinematic heat...',
    'Mining {brand}\'s channel for golden hooks... retention graphs are breaking our physics engine...',
    'The algorithm whispered to Prometheus: {brand} is about to break the internet in post-production...',
    'Zero clickbait detected... just pure unadulterated visual dopamine for {brand}\'s subscribers...',
    'Transcribing video aura... warning: retention rate approaching terminal velocity...',
    'Slicing YouTube metadata with laser precision... each frame seasoned to cinematic perfection...',
  ],
  social: [
    'Translating {brand}\'s grid into kinetic typography... scrolling stops right here...',
    'Your typography has undeniable main character energy... rolling the Hollywood credits now...',
    'Stealing {brand}\'s aesthetic secret sauce... completely legal and with immaculate kerning...',
    'Calculating viral coefficient for {brand}... result: dangerously high engagement detected...',
    'Verified aesthetic only: {brand} just passed the Prometheus aura check with flying colors...',
    'Converting aesthetic tension into 9:16 vertical gold... every pixel is punching above its weight...',
    'Calibrating cuts to {brand}\'s heartbeat... fast, punchy, and impossible to skip...',
  ],
  domain: [
    'Siphoning {brand}\'s chromatic soul... CSS variables have never looked this spicy in motion...',
    'Distilling DNS records into liquid motion... DNS stands for Definitely Neat Style, right?...',
    'Teaching neural nets to speak fluent {brand}... they won\'t stop quoting your landing page...',
    'Analyzing site DNA: 100% visionary founder spirit, 0% comic sans, zero compromise...',
    'Baking {brand} into the video timeline... hot, crispy render fresh out of the GPU oven...',
    'Consulting the brand oracle... definitive verdict: {brand}\'s aesthetic goes certifiably hard...',
    'Injecting 1,000 CCs of kinetic espresso into {brand}\'s video suite...',
    'Decompiling your visual architecture... finding fonts that refuse to be ignored...',
    'Turning {brand}\'s landing page into a Sundance festival selection, one keyframe at a time...',
    'Aesthetic radar locked onto {brand}... spooling up hyperdrive for video outputs...',
    'Brewing bespoke motion alchemy... 99% high-craft precision, 1% unhinged creative genius...',
  ],
  fallback: [
    'Calibrating cinematic pacing... because life is too short for boring transitions...',
    'Syncing color palettes to maximum dopamine... pixels are officially vibrating on frequency...',
    'Rendering the unseen spirit of {brand}... timeline magnets engaged and locked in...',
    'Prometheus neural forge ignited... forging bespoke visual identity with zero templates...',
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
  const filtered = pool.filter((pun) => pun !== excludeText)
  const chosenTemplate = filtered[Math.floor(Math.random() * filtered.length)] || pool[0]
  return chosenTemplate.replace(/\{brand\}/g, brandName)
}

export function BrandVoicePathAnimation({
  brandQuery,
  isAnalyzing = false,
  className,
  onComplete,
}: BrandVoicePathAnimationProps) {
  const textPathRef = React.useRef<SVGTextPathElement | null>(null)
  const [mode, setMode] = React.useState<'stream' | 'continuous'>('stream')
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

  // Animation loop using requestAnimationFrame matching user specifications
  React.useEffect(() => {
    const textPath = textPathRef.current
    if (!textPath) return

    // Target offset that matches the exact framing in the reference image
    const TARGET_OFFSET = 1.6
    let animFrameId: number | null = null
    let startTime: number | null = null
    let lastCycleCompleted = -1

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3)
    }

    function runAnimation(timestamp: number) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      // textPath is guaranteed non-null: checked at effect entry point above
      const tp = textPath!

      if (mode === 'stream') {
        // Stream out of the pill over 3.4s, hold on the exact frame for 2.6s, then repeat
        const streamDuration = 3400
        const holdDuration = 2600
        const totalCycle = streamDuration + holdDuration
        const cycleIndex = Math.floor(elapsed / totalCycle)
        const cycleTime = elapsed % totalCycle

        // Trigger dynamic text swap on each new cycle
        if (cycleIndex !== lastCycleCompleted && cycleIndex > 0) {
          lastCycleCompleted = cycleIndex
          setCurrentText((prev) => getRandomWittyPun(brandQuery, prev))
          onComplete?.()
        }

        if (cycleTime < streamDuration) {
          const progress = easeOutCubic(cycleTime / streamDuration)
          const currentOffset = -75 + progress * (TARGET_OFFSET - -75)
          tp.setAttribute('startOffset', `${currentOffset}%`)
        } else {
          // Subtle breathing drift while holding on the final composition
          const holdTime = cycleTime - streamDuration
          const drift = Math.sin((holdTime / holdDuration) * Math.PI * 2) * 0.25
          tp.setAttribute('startOffset', `${TARGET_OFFSET + drift}%`)
        }
      } else {
        // Continuous flowing marquee along the loop
        const loopDuration = 9000
        const progress = (elapsed % loopDuration) / loopDuration
        const currentOffset = -85 + progress * 185
        tp.setAttribute('startOffset', `${currentOffset}%`)
      }

      animFrameId = requestAnimationFrame(runAnimation)
    }

    animFrameId = requestAnimationFrame(runAnimation)

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
    }
  }, [mode, brandQuery, cycleCount, onComplete])

  return (
    <div
      data-testid="brand-voice-path-stage"
      className={cn(
        'relative w-full max-w-[920px] mx-auto overflow-hidden rounded-[24px] border border-[#55ff9b]/20 bg-[#060b07]/90 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_1px_3px_rgba(85,255,155,0.06)] backdrop-blur-md select-none',
        className
      )}
      style={{ aspectRatio: '920 / 330' }}
    >
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
        title="Click to spin next witty brand thought"
        aria-label="Click to generate dynamic witty brand thought"
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

      {/* Floating Status & Interactive Controls */}
      <div className="absolute bottom-3 inset-x-4 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-full border border-[#55ff9b]/25 bg-black/60 px-3 py-1 text-[11px] text-[#63ffa4] backdrop-blur-md">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55ff9b] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#55ff9b]" />
          </span>
          <span className="font-mono uppercase tracking-wider text-white/50 text-[10px]">
            {isAnalyzing ? 'Calibrating Brand Aura' : 'Voice-to-Text Brand Engine'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMode('stream')}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10.5px] font-medium transition-colors',
              mode === 'stream'
                ? 'bg-[#55ff9b]/20 text-[#63ffa4] border border-[#55ff9b]/40'
                : 'text-white/50 hover:text-white'
            )}
          >
            Stream &amp; Hold
          </button>
          <button
            type="button"
            onClick={() => setMode('continuous')}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10.5px] font-medium transition-colors',
              mode === 'continuous'
                ? 'bg-[#55ff9b]/20 text-[#63ffa4] border border-[#55ff9b]/40'
                : 'text-white/50 hover:text-white'
            )}
          >
            Marquee
          </button>
          <button
            type="button"
            onClick={nextWittyPun}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] text-white/60 hover:text-white transition-colors"
            title="Spin next witty brand quip"
          >
            <RefreshCw className="size-3" />
            <span>Next</span>
          </button>
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
      `}</style>
    </div>
  )
}
