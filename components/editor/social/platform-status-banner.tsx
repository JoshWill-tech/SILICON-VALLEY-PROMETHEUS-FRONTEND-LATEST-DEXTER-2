'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PlatformComplianceStatus = 'operational' | 'pending' | 'blocked'

export type PlatformStatusRecord = {
  status: PlatformComplianceStatus
  label: string
  message: string
}

export const PLATFORM_STATUS = {
  youtube: { status: 'operational', label: 'YouTube', message: 'Ready to publish' },
  googledrive: { status: 'pending', label: 'Google Drive', message: 'OAuth verification in progress' },
  tiktok: { status: 'pending', label: 'TikTok', message: 'App review submitted' },
  linkedin: { status: 'blocked', label: 'LinkedIn', message: 'Account disabled - recovery in progress' },
  x: { status: 'pending', label: 'X', message: 'Developer application pending' },
  facebook: { status: 'blocked', label: 'Facebook', message: 'Unavailable - account banned' },
  instagram: { status: 'blocked', label: 'Instagram', message: 'Unavailable - Facebook account banned' },
  dropbox: { status: 'pending', label: 'Dropbox', message: 'Resubmitted for review' },
} as const satisfies Record<string, PlatformStatusRecord>

export interface PlatformStatusBannerProps {
  statuses?: Record<string, PlatformStatusRecord>
  className?: string
}

const statusStyles: Record<PlatformComplianceStatus, string> = {
  operational: 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100',
  pending: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-100',
  blocked: 'border-rose-300/20 bg-rose-300/[0.08] text-rose-100',
}

function StatusIcon({ status }: { status: PlatformComplianceStatus }) {
  if (status === 'operational') return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
  if (status === 'pending') return <Clock3 className="h-4 w-4" aria-hidden="true" />
  return <AlertCircle className="h-4 w-4" aria-hidden="true" />
}

export function PlatformStatusBanner({ statuses = PLATFORM_STATUS, className }: PlatformStatusBannerProps) {
  const entries = React.useMemo(() => Object.entries(statuses), [statuses])

  return (
    <section
      aria-labelledby="platform-status-banner-title"
      className={cn('rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-white', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="platform-status-banner-title" className="text-sm font-semibold text-white">
            Publishing platform status
          </h2>
          <p className="mt-1 text-xs leading-5 text-white/52">
            Current review state for connected social and storage integrations.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {entries.map(([id, platform]) => (
          <div
            key={id}
            title={platform.message}
            className={cn(
              'flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-xs',
              statusStyles[platform.status],
            )}
          >
            <StatusIcon status={platform.status} />
            <div className="min-w-0">
              <div className="truncate font-semibold">{platform.label}</div>
              <div className="truncate opacity-75">{platform.message}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
