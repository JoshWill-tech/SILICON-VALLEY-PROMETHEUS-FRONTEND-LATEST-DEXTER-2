'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExternalLink,
  Globe,
  Instagram,
  Sparkles,
  Users,
  Video,
  Waveform,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getCreatorRecommendations,
  type CreatorPlatformRecommendation,
  type RelatedCreatorRecommendation,
} from '@/lib/creators/creator-recommendations'

export interface BrandSearchAutocompleteProps {
  query: string
  isOpen: boolean
  onClose: () => void
  onSelectPlatform: (platform: CreatorPlatformRecommendation) => void
  onSelectRelated: (creator: RelatedCreatorRecommendation) => void
  onOpenJarvis: (creatorQuery: string) => void
  className?: string
}

export function BrandSearchAutocomplete({
  query,
  isOpen,
  onClose,
  onSelectPlatform,
  onSelectRelated,
  onOpenJarvis,
  className,
}: BrandSearchAutocompleteProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0)

  const recommendations = React.useMemo(() => {
    return getCreatorRecommendations(query)
  }, [query])

  const totalOptions = recommendations.platformOptions.length + recommendations.relatedCreators.length

  // Reset highlight index when query changes
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Click outside listener
  React.useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen, onClose])

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen || totalOptions === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % totalOptions)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + totalOptions) % totalOptions)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedIndex < recommendations.platformOptions.length) {
          onSelectPlatform(recommendations.platformOptions[selectedIndex])
        } else {
          const relIdx = selectedIndex - recommendations.platformOptions.length
          if (recommendations.relatedCreators[relIdx]) {
            onSelectRelated(recommendations.relatedCreators[relIdx])
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, totalOptions, selectedIndex, recommendations, onSelectPlatform, onSelectRelated, onClose])

  if (!isOpen || !query.trim() || totalOptions === 0) {
    return null
  }

  const getPlatformIcon = (platform: CreatorPlatformRecommendation['platform']) => {
    switch (platform) {
      case 'youtube':
        return <Video className="size-3.5 text-rose-400" aria-hidden="true" />
      case 'instagram':
        return <Instagram className="size-3.5 text-pink-400" aria-hidden="true" />
      case 'website':
        return <Globe className="size-3.5 text-emerald-400" aria-hidden="true" />
      default:
        return <ExternalLink className="size-3.5 text-cyan-400" aria-hidden="true" />
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        role="listbox"
        aria-label="Creator and platform recommendations"
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'absolute left-0 right-0 top-full z-50 mt-2 flex flex-col overflow-hidden rounded-2xl',
          'border border-white/14 bg-[#030604]/95 p-3 text-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(85,255,155,0.08)] backdrop-blur-2xl',
          className
        )}
      >
        {/* Header: Matched query & Jarvis Assist prompt */}
        <div className="mb-2 flex items-center justify-between border-b border-white/10 px-2 pb-2">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/50">
            <Sparkles className="size-3 text-[#63ffa4]" />
            <span>Recommended on the go</span>
            {recommendations.matchedCreator ? (
              <span className="font-semibold text-white">· {recommendations.matchedCreator}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenJarvis(recommendations.matchedCreator || query)}
            className="flex items-center gap-1.5 rounded-full border border-[#55ff9b]/35 bg-[#55ff9b]/10 px-2.5 py-1 text-[11px] font-semibold text-[#63ffa4] transition hover:bg-[#55ff9b]/20"
            title="Ask Jarvis to calibrate video outputs"
          >
            <Waveform className="size-3 animate-pulse" />
            <span>Ask Jarvis</span>
          </button>
        </div>

        {/* Section 1: Platform Choices (YouTube, Instagram, Website) */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">
            Platform Archetypes
          </div>
          {recommendations.platformOptions.map((opt, idx) => {
            const isHighlighted = selectedIndex === idx
            return (
              <button
                key={`${opt.platform}-${opt.handleOrUrl}`}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                onClick={() => onSelectPlatform(opt)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  'group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all',
                  isHighlighted
                    ? 'border border-[#55ff9b]/40 bg-[#55ff9b]/[0.12] shadow-[0_0_20px_rgba(85,255,155,0.1)]'
                    : 'border border-transparent bg-white/[0.02] hover:bg-white/[0.05]'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/50 transition-colors',
                      isHighlighted && 'border-[#55ff9b]/40 text-[#63ffa4]'
                    )}
                  >
                    {getPlatformIcon(opt.platform)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold text-white group-hover:text-[#63ffa4]">
                        {opt.title}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.2 text-[9px] font-mono text-white/60">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-white/55">
                      {opt.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2 text-right">
                  <span className="inline-block rounded-md border border-[#55ff9b]/30 bg-[#55ff9b]/10 px-2 py-0.5 text-[10px] font-medium text-[#63ffa4] opacity-0 transition-opacity group-hover:opacity-100">
                    Apply Spirit →
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Section 2: Related Channels & Creators Recommended on the Go */}
        {recommendations.relatedCreators.length > 0 ? (
          <div className="mt-2.5 border-t border-white/10 pt-2">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">
              <Users className="size-3" />
              <span>Inspiration Network · Related Creators</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {recommendations.relatedCreators.map((rel, relIdx) => {
                const itemIdx = recommendations.platformOptions.length + relIdx
                const isHighlighted = selectedIndex === itemIdx
                return (
                  <button
                    key={rel.id}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() => onSelectRelated(rel)}
                    onMouseEnter={() => setSelectedIndex(itemIdx)}
                    className={cn(
                      'group flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all',
                      isHighlighted
                        ? 'border-[#55ff9b]/40 bg-[#55ff9b]/[0.10]'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                    )}
                  >
                    {rel.avatar ? (
                      <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rel.avatar}
                          alt={rel.name}
                          className="size-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                        {rel.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-white group-hover:text-[#63ffa4]">
                        {rel.name}
                      </div>
                      <div className="truncate text-[9px] text-white/45">
                        {rel.relation}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Footer tip */}
        <div className="mt-2.5 flex items-center justify-between border-t border-white/5 px-2 pt-2 text-[10px] text-white/40">
          <span>Navigate with ↑ / ↓ · Enter to select</span>
          <span className="font-mono text-[9px] text-[#63ffa4]/70">Prometheus Intelligence Engine</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
