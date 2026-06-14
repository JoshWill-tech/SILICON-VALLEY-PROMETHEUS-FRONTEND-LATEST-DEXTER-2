'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Eye,
  Heart,
  Link2,
  MessageCircle,
  PlayCircle,
  Radio,
  RefreshCw,
  Settings2,
  Share2,
  TrendingUp,
} from 'lucide-react'

import { cn } from '@/lib/utils'

type PlatformTelemetry = {
  id: string
  name: string
  color: string
  connected: boolean
  status: string
  accountName: string | null
  totals: {
    views: number
    likes: number
    comments: number
    shares: number
    watchTimeSeconds: number
    retentionRate: number
  }
}

type VideoPlatformTelemetry = {
  platform: string
  platformName: string
  color: string
  connected: boolean
  views: number
  likes: number
  comments: number
  shares: number
  watchTimeSeconds: number
  retentionRate: number
  engagementRate: number
  publishedUrl: string | null
}

type VideoTelemetry = {
  id: string
  title: string
  status: string
  thumbnailUrl: string | null
  updatedAt: string | null
  totals: {
    views: number
    likes: number
    comments: number
    shares: number
    watchTimeSeconds: number
    retentionRate: number
    engagementRate: number
  }
  platformBreakdown: VideoPlatformTelemetry[]
}

type AnalyticsPayload = {
  success: true
  generatedAt: string
  dataSource: 'video_platform_metrics' | 'derived_from_exports'
  metricsWarning: string | null
  needsConnections: boolean
  platforms: PlatformTelemetry[]
  videos: VideoTelemetry[]
  totals: {
    views: number
    likes: number
    comments: number
    shares: number
    watchTimeSeconds: number
    connectedPlatformCount: number
    videoCount: number
    exportCount: number
  }
}

type ApiErrorPayload = {
  success?: false
  error?: { message?: string }
}

const metricCards = [
  { key: 'views', label: 'Reach', icon: Eye },
  { key: 'watchTimeSeconds', label: 'Watch time', icon: Activity },
  { key: 'likes', label: 'Likes', icon: Heart },
  { key: 'shares', label: 'Shares', icon: Share2 },
] as const

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatWatchTime(seconds: number) {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round((seconds / 3600) * 10) / 10}h`
}

function formatMetric(key: string, value: number) {
  if (key === 'watchTimeSeconds') return formatWatchTime(value)
  return formatNumber(value)
}

function buildTelemetryPath(values: number[]) {
  const safeValues = values.length ? values : [0, 0, 0, 0]
  const max = Math.max(...safeValues, 1)
  const width = 360
  const height = 96
  const step = safeValues.length > 1 ? width / (safeValues.length - 1) : width
  const points = safeValues.map((value, index) => {
    const x = Math.round(index * step)
    const y = Math.round(height - (value / max) * 72 - 12)
    return { x, y }
  })

  return points
    .map((point, index) => {
      if (index === 0) return `M${point.x},${point.y}`
      const previous = points[index - 1]
      const controlX = Math.round((previous.x + point.x) / 2)
      return `C${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`
    })
    .join(' ')
}

function SatinGrain() {
  return <div className="satin-grain-veneer" aria-hidden="true" />
}

function TelemetryGraph({ videos }: { videos: VideoTelemetry[] }) {
  const values = videos.length ? videos.map((video) => video.totals.views) : [4, 7, 5, 11, 9, 13]
  const path = buildTelemetryPath(values)

  return (
    <svg className="minimal-vector-graph" viewBox="0 0 360 104" role="img" aria-label="Video reach trend">
      <defs>
        <linearGradient id="analytics-path-gradient" x1="0" x2="360" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7ff2d4" stopOpacity="0.18" />
          <stop offset="0.48" stopColor="#ffffff" stopOpacity="0.74" />
          <stop offset="1" stopColor="#76a7ff" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <path className="isomorphic-path" d={path} stroke="url(#analytics-path-gradient)" />
      {values.map((value, index) => {
        const max = Math.max(...values, 1)
        const x = values.length > 1 ? (360 / (values.length - 1)) * index : 0
        const y = 96 - (value / max) * 72 - 12
        return <circle key={`${value}-${index}`} className="telemetry-node" cx={x} cy={y} r="2.5" />
      })}
    </svg>
  )
}

function ConnectionPrompt() {
  return (
    <div className="luxury-analysis-panel md:col-span-2 xl:col-span-3">
      <SatinGrain />
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/12 bg-amber-200/[0.055] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-amber-100/72">
            <AlertCircle className="size-3.5" />
            Connections needed
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Connect posting platforms to unlock live analytics.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/52">
            Prometheus can show export-derived telemetry now, but YouTube, Instagram, TikTok, X, Facebook, and LinkedIn performance requires connected accounts.
          </p>
        </div>
        <Link
          href="/settings/social-accounts"
          className="premium-liquid-pill inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#7ff2d4]/22 bg-[#7ff2d4]/12 px-5 text-sm font-semibold text-white shadow-[0_20px_44px_-34px_rgba(127,242,212,0.85)]"
        >
          <Settings2 className="size-4" />
          Connect accounts
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="ai-loader-wrapper" role="status" aria-live="polite" aria-label="Loading analytics">
        <span className="ai-loader-letters" aria-hidden="true">
          {'Loading'.split('').map((letter, index) => (
            <span key={`${letter}-${index}`} className="loader-letter" style={{ '--letter-index': index } as React.CSSProperties}>
              {letter}
            </span>
          ))}
        </span>
        <span className="loader-orb" aria-hidden="true" />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const reduceMotion = useReducedMotion()
  const [payload, setPayload] = React.useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadAnalytics = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/video-performance', { cache: 'no-store' })
      const data = (await response.json().catch(() => null)) as AnalyticsPayload | ApiErrorPayload | null

      if (!response.ok || !data?.success) {
        const errorPayload = data as ApiErrorPayload | null
        throw new Error(errorPayload?.error?.message ?? 'Unable to load video analytics.')
      }

      setPayload(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load video analytics.')
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const needsConnections = payload?.needsConnections ?? false
  const topVideo = payload?.videos[0] ?? null

  return (
    <main className="relative min-h-full overflow-hidden px-5 py-6 text-white sm:px-7 lg:px-9">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_6%,rgba(127,242,212,0.12)_0%,rgba(127,242,212,0.03)_30%,transparent_58%),radial-gradient(circle_at_16%_28%,rgba(118,167,255,0.14)_0%,rgba(118,167,255,0.035)_34%,transparent_66%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-[#7ff2d4]/70">
              <Radio className="size-3.5" />
              Video telemetry
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
              A quiet control surface for cross-platform performance, retention, engagement, and posting health.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {payload?.metricsWarning ? (
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white/46">
                Derived until backend metrics land
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void loadAnalytics()}
              className="premium-liquid-pill inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white/72"
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </header>

        {loading ? <LoadingState /> : null}

        {!loading && error ? (
          <div className="luxury-analysis-panel">
            <SatinGrain />
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Analytics unavailable</div>
                <p className="mt-2 text-sm text-white/48">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadAnalytics()}
                className="premium-liquid-pill inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-white/72"
              >
                <RefreshCw className="size-4" />
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {!loading && payload ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((card) => {
                const Icon = card.icon
                const value = payload.totals[card.key]

                return (
                  <motion.div
                    key={card.key}
                    className="luxury-analysis-panel analytics-micro-card"
                    initial={reduceMotion ? false : { opacity: 0, y: 3, filter: 'blur(6px)' }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={reduceMotion ? undefined : { type: 'spring', mass: 1.2, stiffness: 90, damping: 24 }}
                  >
                    <SatinGrain />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.22em] text-white/36">{card.label}</span>
                        <Icon className="size-4 text-[#7ff2d4]/58" />
                      </div>
                      <div className="mt-5 text-3xl font-semibold tracking-tight text-white">
                        {formatMetric(card.key, value)}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="luxury-analysis-panel min-h-[21rem]">
                <SatinGrain />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="quiet-label">System Telemetry</div>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Cross-platform reach curve</h2>
                    </div>
                    <span className="live-indicator" aria-label="Live analytics signal" />
                  </div>
                  <div className="interactive-zone mt-8 flex-1">
                    <TelemetryGraph videos={payload.videos} />
                  </div>
                  <div className="mt-6 grid gap-2 text-xs text-white/42 sm:grid-cols-3">
                    <span>{payload.totals.videoCount} videos indexed</span>
                    <span>{payload.totals.exportCount} exports traced</span>
                    <span>{payload.totals.connectedPlatformCount} connected platforms</span>
                  </div>
                </div>
              </div>

              <div className="luxury-analysis-panel">
                <SatinGrain />
                <div className="relative z-10">
                  <div className="quiet-label">Top Signal</div>
                  {topVideo ? (
                    <div className="mt-5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                          <PlayCircle className="size-5 text-white/64" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-white">{topVideo.title}</h3>
                          <p className="mt-1 text-xs text-white/38">{topVideo.status}</p>
                        </div>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Retention</div>
                          <div className="mt-2 text-2xl font-semibold">{topVideo.totals.retentionRate}%</div>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Engagement</div>
                          <div className="mt-2 text-2xl font-semibold">{topVideo.totals.engagementRate}%</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm leading-6 text-white/46">No videos have been exported yet. Create or export a video to populate telemetry.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              {needsConnections ? <ConnectionPrompt /> : null}
              {payload.platforms.map((platform) => (
                <div key={platform.id} className="luxury-analysis-panel analytics-micro-card">
                  <SatinGrain />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: platform.connected ? platform.color : 'rgba(255,255,255,0.18)' }} />
                          <span className="truncate text-sm font-semibold text-white">{platform.name}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-white/36">{platform.accountName ?? platform.status}</p>
                      </div>
                      {platform.connected ? <TrendingUp className="size-4 text-[#7ff2d4]/64" /> : <Link2 className="size-4 text-white/28" />}
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/28">Views</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{formatNumber(platform.totals.views)}</div>
                      </div>
                      <div className="text-right text-xs text-white/42">{platform.totals.retentionRate}% retention</div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="luxury-analysis-panel">
              <SatinGrain />
              <div className="relative z-10">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="quiet-label">Created Videos</div>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Performance by export</h2>
                  </div>
                  <BarChart3 className="size-5 text-white/34" />
                </div>
                <div className="space-y-3">
                  {payload.videos.length ? (
                    payload.videos.map((video) => (
                      <div key={video.id} className="analytics-video-row">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{video.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/36">
                            <span>{video.status}</span>
                            <span>{formatNumber(video.totals.views)} views</span>
                            <span>{video.totals.engagementRate}% engagement</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {video.platformBreakdown.slice(0, 4).map((platform) => (
                            <span
                              key={`${video.id}-${platform.platform}`}
                              className={cn(
                                'rounded-full border px-2.5 py-1 text-[11px]',
                                platform.connected
                                  ? 'border-white/10 bg-white/[0.04] text-white/62'
                                  : 'border-white/6 bg-white/[0.018] text-white/26',
                              )}
                            >
                              {platform.platformName} {formatNumber(platform.views)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/42">
                      Exported video analytics will appear here once a project is created and posted.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}
