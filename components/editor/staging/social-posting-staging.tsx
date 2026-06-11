'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, Hourglass, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserConnectionV2 } from '@/hooks/use-user-connections'

export type SocialPostingPlatformStatus = 'connected' | 'unconnected' | 'pending-review'

export type SocialPostingPlatformV2 = {
  id: string
  label: string
  reviewPending?: boolean
  docsHref?: string
}

export interface SocialPostingStagingProps {
  platforms: SocialPostingPlatformV2[]
  connections?: UserConnectionV2[]
  onConnect?: (platformId: string) => void
  className?: string
}

function getStatus(platform: SocialPostingPlatformV2, connectedProviders: Set<string>): SocialPostingPlatformStatus {
  if (platform.reviewPending) return 'pending-review'
  return connectedProviders.has(platform.id) ? 'connected' : 'unconnected'
}

export function SocialPostingStaging({ platforms, connections = [], onConnect, className }: SocialPostingStagingProps) {
  const connectedProviders = React.useMemo(
    () =>
      new Set(
        connections
          .filter((connection) => connection.connected !== false && connection.status !== 'disconnected')
          .map((connection) => connection.provider)
          .filter((provider): provider is string => Boolean(provider)),
      ),
    [connections],
  )

  const connectedLabels = platforms
    .filter((platform) => getStatus(platform, connectedProviders) === 'connected')
    .map((platform) => platform.label)
  const pendingLabels = platforms.filter((platform) => platform.reviewPending).map((platform) => platform.label)
  const canPost = connectedLabels.length > 0

  return (
    <section
      aria-labelledby="social-posting-staging-title"
      className={cn('rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-white', className)}
    >
      <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
          <div>
            <h2 id="social-posting-staging-title" className="text-sm font-semibold text-amber-100">
              Social publishing is in beta. Some platforms require app review.
            </h2>
            <p className="mt-1 text-xs leading-5 text-amber-100/72">
              Connected: {connectedLabels.length ? connectedLabels.join(', ') : 'none'}. Pending review:{' '}
              {pendingLabels.length ? pendingLabels.join(', ') : 'none'}.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {platforms.map((platform) => {
          const status = getStatus(platform, connectedProviders)
          return (
            <div
              key={platform.id}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{platform.label}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/48">
                  {status === 'connected' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                      Ready to post
                    </>
                  ) : status === 'pending-review' ? (
                    <>
                      <Hourglass className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />
                      App review pending. Reapply to enable posting.
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Connect your account to publish directly.
                    </>
                  )}
                </div>
              </div>

              {status === 'pending-review' && platform.docsHref ? (
                <a
                  href={platform.docsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-white/10 px-3 text-xs text-white/64 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Docs
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : status === 'unconnected' ? (
                <button
                  type="button"
                  onClick={() => onConnect?.(platform.id)}
                  className="h-9 rounded-full border border-accent-cyan/25 bg-accent-cyan/10 px-3 text-xs font-medium text-accent-cyan transition-colors hover:bg-accent-cyan/15"
                >
                  Connect {platform.label}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        disabled={!canPost}
        title={canPost ? 'Publish to connected platforms' : 'Connect at least one platform to publish.'}
        className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-white text-sm font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/36"
      >
        Post
      </button>
    </section>
  )
}
