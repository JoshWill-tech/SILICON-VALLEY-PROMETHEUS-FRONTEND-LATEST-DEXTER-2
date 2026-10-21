'use client'

import * as React from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

import { BackButton } from '@/components/navigation/BackButton'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import {
  adaptAccountScopedAnalytics,
  type DashboardAccount,
  type DashboardVideo,
  type PerformanceMetric,
} from '@/lib/analytics/video-performance-dashboard'
import { PolaroidLineCarousel, DEFAULT_SLIDES, type Slide, type LandPalette } from '@/components/ui/polaroid-line-carousel'
import { captureFirstVideoFrame } from '@/lib/media/capture-first-video-frame'

type LoadState = 'loading' | 'ready' | 'error'

type PrometheusTrackedVideo = {
  id: string
  title: string
  status?: string
  thumbnailUrl?: string | null
  previewUrl?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  totals?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
    watchTimeSeconds?: number
    retentionRate?: number
    engagementRate?: number
  }
  platformBreakdown?: Array<{
    platform: string
    platformName: string
    views?: number
    publishedUrl?: string | null
  }>
}

function formatCompactViews(count?: number) {
  if (!count) return null
  return new Intl.NumberFormat('en', { notation: count >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(count)
}

export function VideoPerformanceDashboard() {
  const [, setLoadState] = React.useState<LoadState>('loading')
  const [, setAccounts] = React.useState<DashboardAccount[]>([])
  const [videosByAccount, setVideosByAccount] = React.useState<Record<string, DashboardVideo[]>>({})
  const [trackedVideos, setTrackedVideos] = React.useState<PrometheusTrackedVideo[]>([])
  const [frames, setFrames] = React.useState<Record<string, string>>({})
  const [frameFailures, setFrameFailures] = React.useState<Record<string, boolean>>({})
  const [frameRequests, setFrameRequests] = React.useState<Record<string, boolean>>({})
  const framesRef = React.useRef(frames)
  const frameFailuresRef = React.useRef(frameFailures)
  const [selectedAnalyticsVideo, setSelectedAnalyticsVideo] = React.useState<DashboardVideo | PrometheusTrackedVideo | null>(null)
  const [requestKey] = React.useState(0)

  React.useEffect(() => { framesRef.current = frames }, [frames])
  React.useEffect(() => { frameFailuresRef.current = frameFailures }, [frameFailures])

  React.useEffect(() => {
    const controller = new AbortController()
    setLoadState('loading')
    async function load() {
      try {
        const response = await fetch('/api/analytics/video-performance', { cache: 'no-store', signal: controller.signal })
        const payload: unknown = await response.json().catch(() => null)
        if (!response.ok) throw new Error('Analytics request failed')
        const adapted = adaptAccountScopedAnalytics(payload)
        if (controller.signal.aborted) return
        setAccounts(adapted.accounts)
        setVideosByAccount(adapted.videosByAccount)

        const rawPayloadVideos = (payload && typeof payload === 'object' && Array.isArray((payload as { videos?: unknown }).videos))
          ? ((payload as { videos: unknown[] }).videos as Array<Record<string, unknown>>)
          : []
        const mappedTrackedVideos: PrometheusTrackedVideo[] = rawPayloadVideos.map((item) => {
          const latestExport = item.latestExport && typeof item.latestExport === 'object' ? (item.latestExport as Record<string, unknown>) : null
          const exportId = typeof latestExport?.id === 'string' ? latestExport.id : null
          const previewUrl = typeof item.previewUrl === 'string'
            ? item.previewUrl
            : (exportId && latestExport?.status === 'completed'
              ? `/api/exports/${encodeURIComponent(exportId)}/preview`
              : null)
          return {
            id: typeof item.id === 'string' ? item.id : Math.random().toString(),
            title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Untitled production',
            status: typeof item.status === 'string' ? item.status : 'tracked',
            thumbnailUrl: typeof item.thumbnailUrl === 'string' && item.thumbnailUrl.trim() ? item.thumbnailUrl.trim() : null,
            previewUrl,
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : null,
            updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : null,
            totals: item.totals && typeof item.totals === 'object' ? (item.totals as PrometheusTrackedVideo['totals']) : undefined,
            platformBreakdown: Array.isArray(item.platformBreakdown) ? (item.platformBreakdown as PrometheusTrackedVideo['platformBreakdown']) : undefined,
          }
        })
        setTrackedVideos(mappedTrackedVideos)
        setLoadState('ready')
      } catch {
        if (!controller.signal.aborted) setLoadState('error')
      }
    }
    void load()
    return () => controller.abort()
  }, [requestKey])

  const accountVideos = React.useMemo(
    () => Object.values(videosByAccount).flat(),
    [videosByAccount],
  )

  const carouselSlides: Slide[] = React.useMemo(() => {
    // Reflect the last 5 or 6 videos that Prometheus did and tracked for the user
    const candidateVideos = trackedVideos.length > 0 ? trackedVideos : accountVideos
    if (candidateVideos.length === 0) return []

    const prints: Slide[] = candidateVideos.slice(0, 6).map((video, index) => {
      const isTracked = 'totals' in video
      const tracked = isTracked ? (video as PrometheusTrackedVideo) : null
      const dashboard = !isTracked ? (video as DashboardVideo) : null
      const views = tracked?.totals?.views ?? dashboard?.metrics.views ?? 0
      const retention = tracked?.totals?.retentionRate ?? dashboard?.metrics.retentionRate ?? 0
      const platformsList = tracked
        ? (tracked.platformBreakdown ?? [])
            .filter((p) => Boolean((p.views && p.views > 0) || p.publishedUrl))
            .map((p) => p.platformName)
        : dashboard ? [dashboard.platformName] : []

      let caption = ''
      if (views > 0) {
        caption = `${formatCompactViews(views)} views`
        if (retention > 0) caption += ` · ${retention}% retention`
        if (platformsList.length > 0) caption += ` · on ${platformsList.join(', ')}`
      } else if (video.status) {
        const capitalized = video.status.charAt(0).toUpperCase() + video.status.slice(1)
        caption = `Status: ${capitalized} · Tracked in Prometheus`
      } else {
        caption = 'Tracked production cut'
      }

      const frame = frames[video.id]
      const image = frame || video.thumbnailUrl || undefined

      return {
        id: video.id,
        title: video.title || `Production #${index + 1}`,
        caption,
        image,
        alt: video.title,
        palette: (['dawn', 'alpine', 'dusk', 'mist'] as LandPalette[])[index % 4],
        seed: (index + 1) * 23 + (video.id ? video.id.charCodeAt(0) : 0),
      }
    })
    return prints
  }, [accountVideos, frames, trackedVideos])

  const activeSlides: Slide[] = carouselSlides.length > 0 ? carouselSlides : DEFAULT_SLIDES

  React.useEffect(() => {
    let active = true
    const candidateList = [...trackedVideos.slice(0, 6), ...accountVideos.slice(0, 6)]
    const seen = new Set<string>()
    const candidates = candidateList.filter((video) => {
      if (seen.has(video.id)) return false
      seen.add(video.id)
      const hasProjectSource = !video.id.includes(':')
      return (!video.thumbnailUrl || frameRequests[video.id]) && Boolean(video.previewUrl || hasProjectSource) && !framesRef.current[video.id] && !frameFailuresRef.current[video.id]
    })
    let next = 0
    async function captureNext() {
      while (active && next < candidates.length) {
        const video = candidates[next++]!
        const frame = await captureAnalyticsVideoFrame(video)
        if (!active) return
        if (!frame) {
          frameFailuresRef.current = { ...frameFailuresRef.current, [video.id]: true }
          setFrameFailures((current) => ({ ...current, [video.id]: true }))
          continue
        }

        framesRef.current = { ...framesRef.current, [video.id]: frame }
        setFrames((current) => ({ ...current, [video.id]: frame }))
        if (!video.id.includes(':')) {
          try {
            await fetch(`/api/projects/${encodeURIComponent(video.id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ thumbnailUrl: frame }),
            })
          } catch {
            // The captured frame remains available in this session; a later
            // Analytics visit can retry persistence if the request failed.
          }
        }
      }
    }
    // Frame state updates must not cancel this batch; the refs above keep
    // state current without making it an effect dependency.
    void Promise.all(Array.from({ length: Math.min(3, candidates.length) }, () => captureNext()))
    return () => { active = false }
  }, [accountVideos, frameRequests, trackedVideos])

  return (
    <main className="min-h-[100svh] bg-black text-[#F1F0EA]">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-4 sm:px-7 sm:pt-7 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <BackButton fallbackHref="/studio" className="mb-0 border border-white/[0.12] bg-white/[0.025] text-white hover:bg-white/[0.08]" />
          <p className="text-right text-[9px] uppercase tracking-[0.24em] text-[#8D8E85]">PROMETHEUS / PERFORMANCE</p>
        </header>

        {/* RECENT TRACKED VIDEOS / POLAROID LINE CAROUSEL */}
        <section className="mt-8 sm:mt-12" aria-labelledby="tracked-carousel-title">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[#A3A68F]">Prometheus Archive</p>
              <h1 id="tracked-carousel-title" className="mt-3 font-[family-name:var(--font-vogue-display)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] text-[#F1F0EA]">
                Recent tracked videos
              </h1>
              <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#92938B]">
                Recent videos created or published through Prometheus.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#787A72]">
              <span className="inline-block size-1.5 rounded-full bg-[#D7FF4F]" />
              {carouselSlides.length > 0 ? `${carouselSlides.length} ${carouselSlides.length === 1 ? 'video' : 'videos'}` : `${DEFAULT_SLIDES.length} default prints`}
            </div>
          </div>

          <div className="mt-8 overflow-hidden border-y border-white/[0.08]">
            <PolaroidLineCarousel
              slides={activeSlides}
              height={520}
              cardWidth={280}
              sag={46}
              swing={1}
              autoplay={4500}
              string="#736c62"
              background="transparent"
              ink="#F1F0EA"
              ariaLabel="Recent Prometheus tracked videos carousel"
              onSelect={(index) => {
                const id = activeSlides[index]?.id
                if (!id) return
                const selected = trackedVideos.find((video) => video.id === id) ?? accountVideos.find((video) => video.id === id)
                if (selected) setSelectedAnalyticsVideo(selected)
              }}
              onImageFailure={(index) => {
                if (carouselSlides.length === 0) return
                const id = activeSlides[index]?.id
                const video = trackedVideos.find((candidate) => candidate.id === id) ?? accountVideos.find((candidate) => candidate.id === id)
                if (video && !frames[video.id] && !frameRequests[video.id]) {
                  setFrameRequests((current) => ({ ...current, [video.id]: true }))
                }
              }}
            />
          </div>
        </section>
      </div>
      <AnalyticsVideoSheet video={selectedAnalyticsVideo} frame={selectedAnalyticsVideo ? frames[selectedAnalyticsVideo.id] ?? null : null} onOpenChange={(open) => !open && setSelectedAnalyticsVideo(null)} />
    </main>
  )
}

function AnalyticsVideoSheet({ video, frame, onOpenChange }: { video: DashboardVideo | PrometheusTrackedVideo | null; frame: string | null; onOpenChange: (open: boolean) => void }) {
  const tracked = video && !('metrics' in video) ? video : null
  const dashboard = video && 'metrics' in video ? video : null
  const values: Array<[string, number, PerformanceMetric]> = video
    ? tracked
      ? [
          ['Views', tracked.totals?.views ?? 0, 'views'],
          ['Likes', tracked.totals?.likes ?? 0, 'likes'],
          ['Comments', tracked.totals?.comments ?? 0, 'comments'],
          ['Shares', tracked.totals?.shares ?? 0, 'shares'],
          ['Watch time', tracked.totals?.watchTimeSeconds ?? 0, 'watchTimeSeconds'],
          ['Retention', tracked.totals?.retentionRate ?? 0, 'retentionRate'],
          ['Engagement', tracked.totals?.engagementRate ?? 0, 'engagementRate'],
        ]
      : [
          ['Views', dashboard!.metrics.views, 'views'],
          ['Likes', dashboard!.metrics.likes, 'likes'],
          ['Comments', dashboard!.metrics.comments, 'comments'],
          ['Shares', dashboard!.metrics.shares, 'shares'],
          ['Watch time', dashboard!.metrics.watchTimeSeconds, 'watchTimeSeconds'],
          ['Retention', dashboard!.metrics.retentionRate, 'retentionRate'],
          ['Engagement', dashboard!.metrics.engagementRate, 'engagementRate'],
        ]
    : []
  const thumbnail = frame || video?.thumbnailUrl || null
  const publishedUrl = dashboard?.publishedUrl ?? tracked?.platformBreakdown?.find((platform) => platform.publishedUrl)?.publishedUrl ?? null

  return (
    <Sheet open={Boolean(video)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l border-white/[0.1] bg-[#080808] px-5 pb-8 pt-7 text-[#F1F0EA] sm:max-w-xl sm:px-8">
        {video ? <>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#A3A68F]">Video performance</p>
          <SheetTitle className="mt-3 pr-8 font-[family-name:var(--font-vogue-display)] text-4xl font-normal leading-tight text-[#F1F0EA]">{video.title}</SheetTitle>
          <SheetDescription className="mt-2 text-[12px] text-[#A8AA9D]">{video.status} · {dashboard?.platformName ?? 'Prometheus project'}</SheetDescription>
          <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-white/[0.1] bg-[#101010]">
            {thumbnail ? <Image src={thumbnail} alt={`${video.title} thumbnail`} width={960} height={540} unoptimized={thumbnail.startsWith('data:')} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[10px] uppercase tracking-[0.16em] text-white/40">Video thumbnail unavailable</div>}
          </div>
          <div className="mt-7 grid grid-cols-2 border-y border-white/[0.1] sm:grid-cols-3">
            {values.map(([label, value, metric]) => <div key={label} className="border-b border-r border-white/[0.08] px-4 py-4 last:border-r-0">
              <p className="text-[9px] uppercase tracking-[0.16em] text-[#81837A]">{label}</p>
              <p className="mt-2 text-xl tabular-nums text-[#E6E6DE]">{formatMetric(value, metric)}</p>
            </div>)}
          </div>
          {tracked?.platformBreakdown?.length ? <div className="mt-7">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-[#A3A68F]">Channel readings</h3>
            <div className="mt-3 divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {tracked.platformBreakdown.map((platform) => <div key={platform.platform} className="flex items-center justify-between gap-3 py-3 text-[11px]">
                <span>{platform.platformName}</span><span className="tabular-nums text-[#B8BAAF]">{formatCompactViews(platform.views) ?? 'No reach data'}</span>
              </div>)}
            </div>
          </div> : null}
          {publishedUrl ? <a href={publishedUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.16] px-4 text-[10px] uppercase tracking-[0.14em] text-[#D7FF4F] hover:border-[#D7FF4F]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF4F]">View published video <ArrowUpRight className="size-3.5" /></a> : null}
        </> : null}
      </SheetContent>
    </Sheet>
  )
}

async function captureAnalyticsVideoFrame(video: DashboardVideo | PrometheusTrackedVideo): Promise<string | null> {
  let previewUrl = video.previewUrl
  if (!previewUrl && !video.id.includes(':')) {
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(video.id)}/assets`)
      if (!response.ok) return null
      const payload = await response.json() as { asset?: { mime_type?: string }; source?: { url?: string } }
      if (!payload.asset?.mime_type?.startsWith('video/')) return null
      previewUrl = payload.source?.url ?? null
    } catch {
      return null
    }
  }
  return previewUrl ? captureFirstVideoFrame(previewUrl) : null
}

function formatMetric(value: number, metric: PerformanceMetric) {
  if (metric === 'retentionRate' || metric === 'engagementRate') return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)}%`
  if (metric === 'watchTimeSeconds') {
    const seconds = Math.max(0, Math.round(value))
    return seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m` : `${Math.floor(seconds / 60)}m`
  }
  return new Intl.NumberFormat('en', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}
