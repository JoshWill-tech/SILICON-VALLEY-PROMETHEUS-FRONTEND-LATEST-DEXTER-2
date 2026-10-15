'use client'

import { Download, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { InlineLoadingAnimation } from '@/components/loading-animation'

export interface CinematicExportClusterProps {
  className?: string
  onExport: () => void
  isExporting?: boolean
  isRendering?: boolean
  progressPercent?: number | null
  isCompleted?: boolean
  onDownload?: () => void
  isDownloading?: boolean
}

/** A direct, compact action for the editor command island with live render feedback. */
export function CinematicExportCluster({
  className,
  onExport,
  isExporting = false,
  isRendering = false,
  progressPercent = null,
  isCompleted = false,
  onDownload,
  isDownloading = false,
}: CinematicExportClusterProps) {
  const isDownloadAction = isCompleted && Boolean(onDownload)
  const isRenderAction = Boolean(isRendering || isExporting)
  const isBusy = isDownloadAction ? isDownloading : isRenderAction

  const percentage = typeof progressPercent === 'number' && Number.isFinite(progressPercent) && progressPercent >= 0 && progressPercent <= 100
    ? Math.round(progressPercent)
    : null

  const label = isDownloadAction
    ? isDownloading
      ? 'Preparing'
      : 'Download'
    : isRenderAction
      ? percentage !== null
        ? `${percentage}%`
        : 'Rendering…'
      : 'Export'

  const ariaLabel = isDownloadAction
    ? 'Download completed export'
    : isRenderAction
      ? percentage !== null
        ? `Export rendering at ${percentage}%`
        : 'Export rendering in progress'
      : 'Export video'

  return (
    <div className={cn('inline-flex shrink-0 items-center', className)}>
      <button
        type="button"
        onClick={isDownloadAction ? onDownload : onExport}
        disabled={isBusy}
        data-action="export"
        data-autonomous-target="export"
        aria-label={ariaLabel}
        {...(isRenderAction ? {
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': percentage ?? undefined,
          'aria-valuetext': percentage !== null ? `${percentage}% complete` : 'Rendering in progress',
        } : {})}
        className={cn(
          'group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full border px-3.5 text-[13px] font-medium text-white transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 disabled:cursor-wait disabled:opacity-90',
          isDownloadAction
            ? 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100 hover:border-emerald-200/34 hover:bg-emerald-300/[0.14] hover:shadow-[0_12px_28px_-18px_rgba(52,211,153,0.5)]'
            : isRenderAction
              ? 'border-blue-400/40 bg-blue-500/[0.14] text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : 'border-white/14 bg-white/[0.06] hover:-translate-y-px hover:border-blue-300/55 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 hover:shadow-[0_0_24px_rgba(37,99,235,0.42)]',
        )}
      >
        {isRenderAction && percentage !== null ? (
          <span
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-blue-500/25 transition-[width] duration-300 ease-out"
            style={{ width: `${percentage}%` }}
            aria-hidden="true"
          />
        ) : null}

        <span className="relative z-10 flex items-center gap-2">
          {isRenderAction ? (
            <InlineLoadingAnimation size={14} label={ariaLabel} />
          ) : isDownloadAction ? (
            <Download className="size-3.5" aria-hidden="true" />
          ) : (
            <Sparkles className="size-3.5 text-white/60 transition-colors group-hover:text-white" aria-hidden="true" />
          )}
          <span className="tabular-nums font-semibold">{label}</span>
        </span>
      </button>
    </div>
  )
}
