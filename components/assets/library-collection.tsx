'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Check, Film, LibraryBig, Play, Sparkles, X, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

import { LIBRARY_CREATOR_CARDS } from '@/components/assets/cinematic-library'
import { LiquidGlassSearch } from '@/components/assets/liquid-glass-search'
import { BrandVoicePathAnimation } from '@/components/assets/brand-voice-path-animation'
import { BRAND_DNA_STORAGE_KEY } from '@/components/assets/brand-dna-studio'
import { readLocalStorageJSON, writeLocalStorageJSON } from '@/lib/storage'
import { saveJarvisMemory } from '@/lib/voice-companion/memory'
import { getCreatorRecommendations } from '@/lib/creators/creator-recommendations'
import { CREATOR_VIDEO_CATALOG } from '@/lib/creators/video-catalog'

export const ACTIVE_BRAND_STORAGE_KEY = 'prometheus.active-brand.v1'

export type ActiveBrandRecord = {
  brandName: string
  rawInput: string
  type: string
  url: string
  appliedAt: string
  avatarUrl?: string
  videos?: Array<{
    videoId: string
    title: string
    thumbnailUrl: string
    url: string
  }>
  styleDNA?: {
    tone?: string
    typography?: string
    colorAccent?: string
    aestheticDescription?: string
    pacing?: string
    insights?: string[]
  }
}

function parseBrandInput(raw: string): ActiveBrandRecord | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Starts with @ (Instagram or YouTube handle)
  if (trimmed.startsWith('@')) {
    const cleanHandle = trimmed.slice(1).trim()
    const brandName = cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1)
    return {
      brandName,
      rawInput: trimmed,
      type: 'Instagram / Social Handle',
      url: `https://instagram.com/${cleanHandle}`,
      appliedAt: new Date().toISOString(),
    }
  }

  // YouTube URL or channel
  if (/youtube\.com|youtu\.be/i.test(trimmed)) {
    const handleMatch = trimmed.match(/@([a-zA-Z0-9_.-]+)/)
    if (handleMatch) {
      const clean = handleMatch[1].startsWith('@') ? handleMatch[1].slice(1) : handleMatch[1]
      const brandName = clean.charAt(0).toUpperCase() + clean.slice(1)
      return {
        brandName,
        rawInput: trimmed,
        type: 'YouTube Channel',
        url: `https://www.youtube.com/@${clean}`,
        appliedAt: new Date().toISOString(),
      }
    }

    if (/watch\?v=|shorts\/|youtu\.be\/|embed\//i.test(trimmed)) {
      return {
        brandName: 'YouTube Creator',
        rawInput: trimmed,
        type: 'YouTube Video',
        url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
        appliedAt: new Date().toISOString(),
      }
    }

    const channelName = trimmed
      .replace(/^(https?:\/\/)?(www\.)?youtube\.com\/(c\/|channel\/|user\/)?/i, '')
      .split('?')[0]
      .split('/')[0]
    const brandName = (channelName.startsWith('@') ? channelName.slice(1) : channelName) || 'YouTube Brand'
    return {
      brandName: brandName.charAt(0).toUpperCase() + brandName.slice(1),
      rawInput: trimmed,
      type: 'YouTube Channel',
      url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      appliedAt: new Date().toISOString(),
    }
  }

  // Instagram URL
  if (/instagram\.com/i.test(trimmed)) {
    const handleMatch = trimmed.match(/instagram\.com\/([a-zA-Z0-9_.-]+)/i)
    const handle = handleMatch ? handleMatch[1] : trimmed
    return {
      brandName: handle.charAt(0).toUpperCase() + handle.slice(1),
      rawInput: trimmed,
      type: 'Instagram Brand',
      url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      appliedAt: new Date().toISOString(),
    }
  }

  // Web URL or domain name (e.g. yourbrand.com, acme.co)
  if (/^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i.test(trimmed)) {
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '')
      const name = hostname.split('.')[0] || hostname
      return {
        brandName: name.charAt(0).toUpperCase() + name.slice(1),
        rawInput: trimmed,
        type: 'Brand Website URL',
        url,
        appliedAt: new Date().toISOString(),
      }
    } catch {
      return {
        brandName: trimmed.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0] || trimmed,
        rawInput: trimmed,
        type: 'Brand URL',
        url,
        appliedAt: new Date().toISOString(),
      }
    }
  }

  // Fallback brand specification
  return {
    brandName: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
    rawInput: trimmed,
    type: 'Brand Specification',
    url: '',
    appliedAt: new Date().toISOString(),
  }
}

const CREATOR_IMAGE_POSITIONS = ['62% 24%', '50% 16%', '50% 18%', '50% 18%', '50% 18%', '50% 18%', '50% 16%']

export function LibraryCollection({ onSelect }: { onSelect: (showcaseId: string) => void }) {
  const reduceMotion = useReducedMotion() ?? false
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeBrand, setActiveBrand] = React.useState<ActiveBrandRecord | null>(null)
  const [isApplyingBrand, setIsApplyingBrand] = React.useState(false)
  const [submittedBrandQuery, setSubmittedBrandQuery] = React.useState('')

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setSubmittedBrandQuery('')
  }

  React.useEffect(() => {
    const saved = readLocalStorageJSON<ActiveBrandRecord>(ACTIVE_BRAND_STORAGE_KEY)
    if (saved) setActiveBrand(saved)
  }, [])

  const applyBrandSpecification = React.useCallback((spec: ActiveBrandRecord) => {
    // 1. Sync to Jarvis Persistent Memory for video output styling
    try {
      saveJarvisMemory(
        {
          brandProfile: {
            brandName: spec.brandName,
            tone: spec.styleDNA?.tone || `Aligned with ${spec.type}: ${spec.rawInput}`,
            preferredCaptionStyle: 'clean_bold',
            pacing: 'cinematic_deliberate',
            visualGuidelines: spec.styleDNA?.aestheticDescription || `Brand Identity: ${spec.rawInput} (${spec.type}). Apply brand typography, pacing, color accents, and aesthetic spirit across all generated video outputs and AI edits.`,
          },
        },
        'global_creator',
      )
    } catch {
      // safe fallback
    }

    // 2. Persist to active brand state and Brand DNA storage
    writeLocalStorageJSON(ACTIVE_BRAND_STORAGE_KEY, spec)
    try {
      const existingDna = readLocalStorageJSON<Record<string, unknown>>(BRAND_DNA_STORAGE_KEY)
      writeLocalStorageJSON(BRAND_DNA_STORAGE_KEY, {
        ...(existingDna ?? {}),
        id: `brand-${spec.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        brandName: spec.brandName,
        url: spec.url || `https://${spec.rawInput.replace(/^@/, '')}`,
        tagline: `Brand spirit from ${spec.rawInput}`,
        valueProposition: spec.styleDNA?.aestheticDescription || `Custom brand identity reflecting ${spec.rawInput} in video outputs.`,
        avatarUrl: spec.avatarUrl,
        videos: spec.videos,
      })
    } catch {
      // safe fallback
    }

    setActiveBrand(spec)

    toast.success(`Brand identity applied: "${spec.brandName}"`, {
      description: spec.videos?.length
        ? `Ingested ${spec.videos.length} reference videos. Outputs calibrated to ${spec.brandName}'s visual spirit.`
        : `Video outputs will reflect the spirit and specifications of ${spec.rawInput}.`,
    })
  }, [])

  const visibleCreators = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return LIBRARY_CREATOR_CARDS.map((creator, index) => ({ creator, index }))
    }
    const q = searchQuery.toLowerCase().trim()
    const cleanQ = q.replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\.[a-z]{2,}(\/.*)?$/, '').replace(/[-_.]/g, ' ')
    return LIBRARY_CREATOR_CARDS.map((creator, index) => ({ creator, index })).filter(
      ({ creator }) => {
        const creatorName = creator.name.toLowerCase()
        const creatorDesig = creator.designation.toLowerCase()
        const collapsedName = creatorName.replace(/\s+/g, '')
        const collapsedQ = cleanQ.replace(/\s+/g, '')
        return (
          creatorName.includes(q) ||
          creatorDesig.includes(q) ||
          (collapsedQ.length >= 3 && collapsedName.includes(collapsedQ))
        )
      },
    )
  }, [searchQuery])

  const handleSearchSubmit = (submittedQuery?: string) => {
    const q = (submittedQuery ?? searchQuery).trim()
    if (!q) return

    const lower = q.toLowerCase()
    const cleanLower = lower.replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\.[a-z]{2,}(\/.*)?$/, '').replace(/[-_.]/g, ' ')
    const match = LIBRARY_CREATOR_CARDS.findIndex((c) => {
      const name = c.name.toLowerCase()
      const desig = c.designation.toLowerCase()
      const collapsed = name.replace(/\s+/g, '')
      const collapsedQ = cleanLower.replace(/\s+/g, '')
      return (
        name.includes(lower) ||
        desig.includes(lower) ||
        (collapsedQ.length >= 3 && collapsed.includes(collapsedQ))
      )
    })

    if (match !== -1) {
      onSelect(`uploads_${match}`)
      return
    }

    // Custom brand URL, Instagram handle, or YouTube channel — show animation then apply
    setSubmittedBrandQuery(q)
    setIsApplyingBrand(true)
    const spec = parseBrandInput(q)
    if (spec) {
      applyBrandSpecification(spec)
    }

    // Call backend to resolve detailed brand identity (YouTube oEmbed channel name, website title, etc.)
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      const endpoint = window.location?.origin ? `${window.location.origin}/api/brand/resolve` : '/api/brand/resolve'
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.brand?.brandName) {
            const resolvedSpec: ActiveBrandRecord = {
              brandName: data.brand.brandName,
              rawInput: q,
              type: data.brand.type,
              url: data.brand.url || (spec?.url ?? ''),
              appliedAt: new Date().toISOString(),
              avatarUrl: data.brand.avatarUrl,
              videos: data.brand.videos,
              styleDNA: data.brand.styleDNA,
            }
            applyBrandSpecification(resolvedSpec)
            setSubmittedBrandQuery(data.brand.brandName)
          }
        })
        .catch(() => {
          // Graceful fallback already applied
        })
        .finally(() => {
          setIsApplyingBrand(false)
        })
    } else {
      setIsApplyingBrand(false)
    }
  }

  return (
    <section data-creator-library className="relative min-h-full snap-start snap-normal overflow-hidden bg-black text-white" aria-labelledby="creator-library-title">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'linear-gradient(rgba(52,255,137,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(52,255,137,0.026) 1px, transparent 1px), radial-gradient(circle, rgba(72,255,151,0.16) 0.7px, transparent 0.8px)',
          backgroundSize: '72px 72px, 72px 72px, 5px 5px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#3cff8f]/35" />

      <div className="relative mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-[#55ff9b]/15 pb-5">
          <div className="flex items-start gap-3">
            <div data-library-symbol className="grid size-9 shrink-0 place-items-center border border-[#55ff9b]/25 bg-[#07120b] text-[#63ffa4]">
              <LibraryBig className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p data-library-accent className="text-[10px] uppercase tracking-[0.28em] text-[#63ffa4]/64">Prometheus archive</p>
              <h1 id="creator-library-title" className="mt-1 text-2xl font-semibold text-white sm:text-[2rem]">
                Creator library
              </h1>
            </div>
          </div>

          <div className="text-right">
            <div data-library-accent className="font-mono text-lg text-[#63ffa4]">{String(LIBRARY_CREATOR_CARDS.length).padStart(2, '0')}</div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-white/38">Active archives</div>
          </div>
        </header>

        {/* Liquid Glass Search Bar with liquidGL shader effect */}
        <div className="my-6 flex w-full justify-center sm:my-8">
          <LiquidGlassSearch
            value={searchQuery}
            onChange={handleSearchChange}
            onSubmit={handleSearchSubmit}
          />
        </div>

        {/* Active Brand Indicator */}
        {activeBrand ? (
          <div className="mx-auto -mt-3 mb-6 flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[#55ff9b]/25 bg-[#55ff9b]/[0.07] px-3.5 py-1 text-xs text-[#63ffa4] shadow-[0_4px_16px_rgba(85,255,155,0.08)] backdrop-blur-md">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55ff9b] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#55ff9b]" />
              </span>
              <span className="text-white/50">Active Brand Spirit:</span>
              <span className="font-semibold text-white">{activeBrand.brandName}</span>
              <span className="font-mono text-[11px] text-[#63ffa4]/80">({activeBrand.rawInput})</span>
              <span className="text-[10px] uppercase tracking-wider text-white/40">• In video outputs</span>
              <button
                type="button"
                onClick={() => {
                  writeLocalStorageJSON(ACTIVE_BRAND_STORAGE_KEY, null)
                  setActiveBrand(null)
                  toast.info('Active brand reset to default')
                }}
                className="ml-1 inline-flex size-4 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                aria-label="Clear active brand"
                title="Clear active brand"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        ) : null}

        {visibleCreators.length === 0 ? (
          activeBrand?.videos && activeBrand.videos.length > 0 ? (
            <div className="my-8 flex w-full flex-col items-center">
              {/* Animated Voice-to-Text Path with real extracted insights */}
              {submittedBrandQuery ? (
                <div className="mb-8 w-full max-w-[920px]">
                  <BrandVoicePathAnimation
                    key={submittedBrandQuery}
                    brandQuery={submittedBrandQuery}
                    isAnalyzing={isApplyingBrand}
                    customInsights={activeBrand.styleDNA?.insights}
                    visible
                  />
                </div>
              ) : null}

              {/* Ingested Creator Spotlight Header */}
              <div className="mb-8 w-full max-w-[1100px] rounded-2xl border border-[#55ff9b]/30 bg-[#030503]/90 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                    {activeBrand.avatarUrl ? (
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-[#55ff9b]/70 shadow-[0_0_25px_rgba(85,255,155,0.35)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeBrand.avatarUrl}
                          alt={activeBrand.brandName}
                          className="size-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid size-20 shrink-0 place-items-center rounded-full border-2 border-[#55ff9b]/60 bg-[#55ff9b]/15 text-[#63ffa4] shadow-[0_0_20px_rgba(85,255,155,0.25)]">
                        <Sparkles className="size-8" aria-hidden="true" />
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          {activeBrand.brandName}
                        </h3>
                        <span className="rounded-full border border-[#55ff9b]/40 bg-[#55ff9b]/10 px-2.5 py-0.5 font-mono text-[11px] text-[#63ffa4]">
                          Active Spirit
                        </span>
                      </div>
                      <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-white/70 leading-relaxed">
                        {activeBrand.styleDNA?.aestheticDescription ||
                          `Ingested channel archives from ${activeBrand.rawInput}. Video pacing, color grade, and typography calibrated to creator DNA.`}
                      </p>

                      {/* Style DNA tags */}
                      {activeBrand.styleDNA ? (
                        <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px]">
                          {activeBrand.styleDNA.tone ? (
                            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/80">
                              <span className="text-white/40">Tone:</span> {activeBrand.styleDNA.tone}
                            </span>
                          ) : null}
                          {activeBrand.styleDNA.typography ? (
                            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/80">
                              <span className="text-white/40">Type:</span> {activeBrand.styleDNA.typography}
                            </span>
                          ) : null}
                          {activeBrand.styleDNA.pacing ? (
                            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/80">
                              <span className="text-white/40">Pacing:</span> {activeBrand.styleDNA.pacing}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-center sm:items-end gap-2.5 shrink-0">
                    <span className="rounded-full border border-[#55ff9b]/30 bg-[#55ff9b]/[0.08] px-3 py-1 font-mono text-xs text-[#63ffa4]">
                      {activeBrand.videos.length} Verified Archetypes
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      Clear search
                    </button>
                  </div>
                </div>
              </div>

              {/* Instantaneous Video Archetype / Thumbnail Collection */}
              <div className="w-full max-w-[1100px]">
                <div className="mb-4 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
                    <Film className="size-4 text-[#63ffa4]" />
                    <span>Instantaneous Video Ingestion Collection</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/40">
                    Click to select reference video
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activeBrand.videos.map((video, idx) => (
                    <div
                      key={video.videoId || idx}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#080d09] shadow-lg transition-all duration-300 hover:border-[#55ff9b]/60 hover:shadow-[0_10px_30px_rgba(85,255,155,0.15)] hover:scale-[1.02]"
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-mono text-[#63ffa4] backdrop-blur-md">
                          <Play className="size-2.5 fill-[#63ffa4]" />
                          <span>Video #{idx + 1}</span>
                        </div>
                      </div>

                      {/* Video Title & Actions */}
                      <div className="flex flex-1 flex-col justify-between p-3.5">
                        <h4
                          className="line-clamp-2 text-xs font-medium text-white/90 group-hover:text-white"
                          title={video.title}
                        >
                          {video.title}
                        </h4>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(`custom_ref_${video.videoId}`)
                              toast.success(`Selected "${video.title}" as active style reference!`)
                            }}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#55ff9b]/40 bg-[#55ff9b]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#63ffa4] transition hover:bg-[#55ff9b]/30"
                          >
                            <Check className="size-3" />
                            <span>Use Style</span>
                          </button>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/40 transition hover:bg-white/10 hover:text-white"
                            title="Open on YouTube"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="my-10 flex flex-col items-center justify-center rounded-2xl border border-[#55ff9b]/25 bg-[#030503]/85 p-6 sm:p-8 text-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              {/* Animated Voice-to-Text Path when getting requisite brand info */}
              {submittedBrandQuery ? (
                <div className="w-full max-w-[920px] mb-6">
                  <BrandVoicePathAnimation key={submittedBrandQuery} brandQuery={submittedBrandQuery} isAnalyzing={isApplyingBrand} visible />
                </div>
              ) : null}

              <div className="grid size-12 place-items-center rounded-full border border-[#55ff9b]/35 bg-[#55ff9b]/10 text-[#63ffa4]">
                <Sparkles className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white sm:text-lg">
                Set Brand Spirit for Video Outputs
              </h3>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-white/60 sm:text-sm">
                Reflect <span className="font-mono text-[#63ffa4]">{searchQuery}</span> across your video outputs.
                Prometheus will calibrate video pacing, typography, color accents, and AI generation to match this brand identity.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsApplyingBrand(true)
                    const spec = parseBrandInput(searchQuery)
                    if (spec) applyBrandSpecification(spec)
                    setTimeout(() => {
                      setIsApplyingBrand(false)
                    }, 600)
                  }}
                  disabled={isApplyingBrand}
                  className="flex items-center gap-2 rounded-full border border-[#55ff9b]/60 bg-[#55ff9b]/20 px-5 py-2.5 text-xs font-semibold text-[#63ffa4] shadow-[0_0_20px_rgba(85,255,155,0.2)] transition hover:bg-[#55ff9b]/30 hover:scale-[1.02] disabled:opacity-60"
                >
                  <Check className="size-3.5" />
                  {isApplyingBrand ? 'Calibrating Brand Spirit...' : `Apply "${searchQuery}" to Video Suite`}
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  Clear search
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
            {visibleCreators.map(({ creator, index }) => (
              <motion.button
                data-creator-card
                key={creator.id}
                type="button"
                onClick={() => onSelect(`uploads_${index}`)}
                className="group relative aspect-[3/4] min-w-0 overflow-hidden rounded-[4px] border border-white/10 bg-[#030503] text-left shadow-[0_20px_45px_-30px_rgba(0,0,0,1)] outline-none transition-colors hover:border-[#55ff9b]/55 focus-visible:border-[#55ff9b] focus-visible:ring-2 focus-visible:ring-[#55ff9b]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                initial={false}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.55, delay: index * 0.045, ease: [0.22, 1, 0.36, 1] }
                }
                whileHover={reduceMotion ? undefined : { y: -4 }}
                aria-label={`Open ${creator.name} archive`}
              >
                <Image
                  src={index === 0 ? '/library/alex-hormozi/hero.jpg' : creator.image}
                  alt=""
                  fill
                  loading="eager"
                  sizes="(max-width: 639px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, (max-width: 1279px) 20vw, 190px"
                  className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.035] ${index === 0 ? 'grayscale-[0.82] brightness-[0.7] contrast-125 group-hover:grayscale-[0.64] group-hover:brightness-[0.78]' : 'grayscale-[0.22] group-hover:grayscale-0'}`}
                  style={{ objectPosition: CREATOR_IMAGE_POSITIONS[index] ?? '50% 18%' }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_24%,rgba(0,0,0,0.2)_48%,rgba(0,0,0,0.96)_100%)]" />
                {index === 0 ? (
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_12%,rgba(0,0,0,0.36)_100%)]" />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(72,255,151,0.12),transparent_32%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
                  <span data-creator-index className="font-mono text-[9px] tracking-[0.18em] text-white/52">{String(index + 1).padStart(2, '0')}</span>
                  <span data-creator-action className="grid size-7 place-items-center border border-white/15 bg-black/45 text-white/66 backdrop-blur-sm transition-colors group-hover:border-[#55ff9b]/45 group-hover:text-[#63ffa4]">
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </div>

                <div data-creator-caption className="absolute inset-x-0 bottom-0 p-3">
                  <div data-creator-designation className="truncate text-[9px] uppercase tracking-[0.2em] text-[#63ffa4]/72">{creator.designation}</div>
                  <div data-creator-name className="mt-1.5 text-sm font-semibold leading-tight text-white sm:text-[15px]">{creator.name}</div>
                </div>
              </motion.button>
            ))}
          </div>
        )}


        <div className="mt-auto flex items-center gap-3 pt-7 text-[9px] uppercase tracking-[0.22em] text-white/32">
          <span className="h-px w-8 bg-[#55ff9b]/35" />
          Select a creator to enter the archive
        </div>
      </div>
    </section>
  )
}
