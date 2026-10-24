'use client'

import * as React from 'react'
import { AudioWaveform, Mic, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandSearchAutocomplete } from '@/components/assets/brand-search-autocomplete'
import { JarvisAssistantModal } from '@/components/assets/jarvis-assistant-modal'
import type {
  CreatorPlatformRecommendation,
  RelatedCreatorRecommendation,
} from '@/lib/creators/creator-recommendations'

export interface LiquidGLLens {
  destroy: () => void
  updateMetrics?: () => void
  setTint?: (tint: string) => void
  setDraggable?: (draggable: boolean) => void
}

export interface LiquidGLOptions {
  target: string
  snapshot?: string
  resolution?: number
  refraction?: number
  aberration?: number
  bevelDepth?: number
  bevelWidth?: number
  frost?: number
  shadow?: boolean
  specular?: boolean
  reveal?: string
  tilt?: boolean
  tiltFactor?: number
  tiltEase?: number
  draggable?: boolean
  interaction?: string
  interactionStrength?: number
  interactionRadius?: number
  interactionViscosity?: number
  magnify?: number
  tint?: string
  helper?: boolean
  engine?: string
  zIndex?: number
  content?: string
}

declare global {
  interface Window {
    liquidGL?: ((options: LiquidGLOptions) => LiquidGLLens | LiquidGLLens[]) & {
      registerDynamic?: (elements: Element | Element[] | NodeList) => void
      syncWith?: (config?: Record<string, unknown>) => void
    }
  }
}

export const DEFAULT_BRAND_PROMPTS = [
  '@yourbrand',
  'https://yourbrand.com',
  'youtube.com/@yourbrand',
  '@nike',
  'https://acme.co',
  'instagram.com/@yourbrand',
  '@studio.design',
  'https://brandwebsite.com',
]

export interface LiquidGlassSearchProps {
  value?: string
  onChange?: (val: string) => void
  onSubmit?: (val: string) => void
  className?: string
  autoFocus?: boolean
  prompts?: string[]
  onOpenJarvis?: (subject?: string) => void
  onSelectRecommendation?: (brandName: string, queryOrUrl: string) => void
}

export function LiquidGlassSearch({
  value,
  onChange,
  onSubmit,
  className,
  autoFocus = false,
  prompts,
  onOpenJarvis,
  onSelectRecommendation,
}: LiquidGlassSearchProps) {
  const activePrompts = React.useMemo(
    () => (prompts && prompts.length > 0 ? prompts : DEFAULT_BRAND_PROMPTS),
    [prompts],
  )
  const [internalValue, setInternalValue] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const [placeholder, setPlaceholder] = React.useState(activePrompts[0])
  const [isTypingAnimation, setIsTypingAnimation] = React.useState(true)
  const [isJarvisOpen, setIsJarvisOpen] = React.useState(false)
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false)

  const searchBarRef = React.useRef<HTMLDivElement>(null)
  const searchGoRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const restorePointerEvents = React.useCallback(() => {
    if (searchBarRef.current) {
      searchBarRef.current.style.pointerEvents = 'auto'
      searchBarRef.current.style.setProperty('pointer-events', 'auto', 'important')
    }
    if (searchGoRef.current) {
      searchGoRef.current.style.pointerEvents = 'auto'
      searchGoRef.current.style.setProperty('pointer-events', 'auto', 'important')
    }
    if (inputRef.current) {
      inputRef.current.style.pointerEvents = 'auto'
      inputRef.current.style.setProperty('pointer-events', 'auto', 'important')
    }
  }, [])

  const isControlled = value !== undefined
  const query = isControlled ? value : internalValue

  const setQuery = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
      if (next.trim().length >= 2) {
        setIsAutocompleteOpen(true)
      } else {
        setIsAutocompleteOpen(false)
      }
    },
    [isControlled, onChange],
  )

  // Dynamic typing placeholder animation cycling through prompts
  React.useEffect(() => {
    if (query || isFocused) {
      setIsTypingAnimation(false)
      return
    }

    let promptIdx = 0
    let charIdx = 0
    let deleting = false
    let timeoutId: NodeJS.Timeout

    const tick = () => {
      const current = activePrompts[promptIdx]
      if (deleting) {
        charIdx--
        setPlaceholder(current.slice(0, Math.max(0, charIdx)))
        if (charIdx <= 0) {
          deleting = false
          promptIdx = (promptIdx + 1) % activePrompts.length
          timeoutId = setTimeout(tick, 400)
          return
        }
        timeoutId = setTimeout(tick, 25)
      } else {
        charIdx++
        setPlaceholder(current.slice(0, charIdx))
        if (charIdx >= current.length) {
          deleting = true
          timeoutId = setTimeout(tick, 2200)
          return
        }
        timeoutId = setTimeout(tick, 55 + Math.random() * 35)
      }
    }

    setIsTypingAnimation(true)
    timeoutId = setTimeout(tick, 300)

    return () => clearTimeout(timeoutId)
  }, [query, isFocused, activePrompts])

  // Initialize liquidGL shader on target=".glass"
  React.useEffect(() => {
    let isMounted = true
    let lenses: LiquidGLLens | LiquidGLLens[] | null = null

    const initLiquidGL = async () => {
      if (typeof window === 'undefined') return

      if (!window.liquidGL) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[src="/scripts/liquidGL.js"]')
          if (existing) {
            if (window.liquidGL) return resolve()
            existing.addEventListener('load', () => resolve())
            existing.addEventListener('error', reject)
            return
          }
          const script = document.createElement('script')
          script.src = '/scripts/liquidGL.js'
          script.async = true
          script.onload = () => resolve()
          script.onerror = reject
          document.body.appendChild(script)
        }).catch((err) => {
          console.warn('liquidGL load error:', err)
        })
      }

      if (!isMounted || !window.liquidGL) return

      try {
        lenses = window.liquidGL({
          target: '.glass',
          snapshot: 'body',
          resolution: 2,
          refraction: 0.007,
          aberration: 0,
          bevelDepth: 0.084,
          bevelWidth: 0.108,
          frost: 4.2,
          shadow: true,
          specular: true,
          reveal: 'none',
          tilt: false,
          tiltFactor: 5,
          tiltEase: 400,
          draggable: false,
          interaction: 'none',
          interactionStrength: 5,
          interactionRadius: 2.4,
          interactionViscosity: 0.5,
          magnify: 1.3,
          tint: 'rgba(0, 0, 0, 0.02)',
          helper: false,
        })

        // Guarantee pointer events and text input focus are immediately active
        restorePointerEvents()
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame?.(restorePointerEvents)
          setTimeout(restorePointerEvents, 50)
          setTimeout(restorePointerEvents, 250)
        }
      } catch (error) {
        console.warn('liquidGL execution warning:', error)
      }
    }

    const timer = setTimeout(initLiquidGL, 120)

    return () => {
      isMounted = false
      clearTimeout(timer)
      if (lenses) {
        if (Array.isArray(lenses)) {
          lenses.forEach((lens) => lens?.destroy?.())
        } else {
          lenses.destroy?.()
        }
      }
    }
  }, [restorePointerEvents])

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    const targetQuery = query.trim()
    if (!targetQuery) return
    onSubmit?.(targetQuery)
  }

  return (
    <div className={cn('liquid-glass-stage relative flex w-full justify-center py-2', className)}>
      <form
        onSubmit={handleSubmit}
        className="search-wrap relative flex w-full max-w-[560px] items-center gap-3 px-2 sm:px-0"
      >
        <div
          ref={searchBarRef}
          role="search"
          onClick={() => {
            inputRef.current?.focus()
          }}
          style={{ pointerEvents: 'auto' }}
          className={cn(
            'search-bar glass relative flex h-14 flex-1 cursor-text items-center gap-2.5 rounded-full px-2.5 text-white transition-all duration-300 sm:h-16 sm:gap-3 sm:px-3',
            'pointer-events-auto border border-white/14 bg-white/[0.04] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.22)] backdrop-blur-xl',
          )}
        >
          {/* Animated Liquid Bubble / Orb */}
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-black/60 shadow-inner sm:size-12">
            <video
              data-liquid-ignore
              src="/media/search-bubble.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              className="search-bubble h-full w-full object-cover select-none pointer-events-none"
            />
            {/* Fallback gradient if video doesn't play */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_30%,#a855f7,#06b6d4_45%,#000_80%)] opacity-80"
            />
          </div>

          {/* Text Input with Animated Placeholder */}
          <div
            className="input-wrap relative flex min-w-0 flex-1 items-center"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.focus()
            }}
          >
            <input
              ref={inputRef}
              type="text"
              autoFocus={autoFocus}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFocused && !query ? 'Enter brand URL, @handle, or YouTube...' : placeholder}
              aria-label="Enter brand URL, website URL, YouTube link, or Instagram handle"
              autoComplete="off"
              spellCheck="false"
              style={{ pointerEvents: 'auto' }}
              className={cn(
                'search-input relative z-20 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/55 sm:text-[15px]',
                'caret-white/80 select-text cursor-text pointer-events-auto',
                isTypingAnimation && 'placeholder:text-white/75',
              )}
            />
            {/* Simulated blink cursor when idle */}
            {!query && !isFocused && (
              <span
                aria-hidden="true"
                className="input-caret pointer-events-none absolute top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-white/75 sm:h-4.5"
                style={{
                  left: `${Math.min(placeholder.length * 8.5 + 4, 380)}px`,
                  animation: 'liquidGlassBlink 1.1s steps(1) infinite',
                }}
              />
            )}
          </div>

          {/* Action Icons: Mic & Waveform */}
          <div
            className="search-actions relative z-20 flex shrink-0 items-center gap-1"
            style={{ pointerEvents: 'auto' }}
          >
            <button
              type="button"
              aria-label="Voice search"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.focus()
              }}
              style={{ pointerEvents: 'auto' }}
              className="icon-btn flex size-9 cursor-pointer items-center justify-center rounded-full text-white/75 transition hover:bg-white/12 hover:text-white sm:size-10"
            >
              <Mic className="size-4 sm:size-4.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Start audio"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.focus()
              }}
              style={{ pointerEvents: 'auto' }}
              className="icon-btn flex size-9 cursor-pointer items-center justify-center rounded-full text-white/75 transition hover:bg-white/12 hover:text-white sm:size-10"
            >
              <AudioWaveform className="size-4 sm:size-4.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Circular Glass Search Submit Button */}
        <button
          ref={searchGoRef}
          type="submit"
          aria-label="Search"
          style={{ pointerEvents: 'auto' }}
          className={cn(
            'search-go glass relative flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition duration-300 hover:scale-105 hover:text-[#55ff9b] sm:size-16',
            'pointer-events-auto border border-white/14 bg-white/[0.04] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.22)] backdrop-blur-xl',
          )}
        >
          <Search className="size-5 sm:size-5.5" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
