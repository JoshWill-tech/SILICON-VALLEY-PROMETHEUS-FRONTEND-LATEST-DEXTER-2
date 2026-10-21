'use client'

import * as React from 'react'
import { ExternalLink, Play, RotateCcw, Scissors, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  extractYouTubeVideoId,
  formatClipDuration,
  type WallClip,
} from '@/lib/media/youtube-clip-service'

export interface SupoClipMatrixViewProps {
  videoId?: string | null
  sourceUrl?: string | null
  clips: WallClip[]
  activeClipId?: string | null
  isProcessing?: boolean
  processingLabel?: string
  loadError?: string | null
  onRetry?: () => void
  onSelectClip?: (clip: WallClip) => void
  onClose?: () => void
  className?: string
}

function formatSourceLabel(sourceUrl?: string | null, videoId?: string | null) {
  if (!sourceUrl) return videoId ? `YouTube · ${videoId}` : 'Source video'
  try {
    const url = new URL(sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`)
    return `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`
  } catch {
    return sourceUrl
  }
}

function secondsFromTimestamp(timestamp: string) {
  return timestamp.split(':').reduce((seconds, part) => seconds * 60 + (Number(part) || 0), 0)
}

function ClipRow({
  clip,
  index,
  isCurrent,
  onOpen,
}: {
  clip: WallClip
  index: number
  isCurrent: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors',
        isCurrent
          ? 'border-cyan-200/45 bg-cyan-200/[0.07]'
          : 'border-white/[0.07] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]',
      )}
      aria-label={`Preview clip ${index + 1}: ${clip.hook_title}`}
    >
      <span className="relative aspect-video w-[38%] shrink-0 overflow-hidden rounded-lg bg-black">
        {clip.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clip.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-black" />
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/15 transition-colors group-hover:bg-black/30">
          <span className="grid size-8 place-items-center rounded-full border border-white/50 bg-black/35 text-white shadow-lg backdrop-blur-sm">
            <Play className="ml-0.5 size-3.5 fill-current" />
          </span>
        </span>
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/90">
          {formatClipDuration(clip.duration)}
        </span>
      </span>
      <span className="min-w-0 flex-1 py-1">
        <span className="block line-clamp-2 text-[13px] font-medium leading-snug text-white/90 group-hover:text-white">
          {clip.hook_title}
        </span>
        <span className="mt-2 block font-mono text-[11px] tabular-nums text-white/45">
          {clip.start_time} <span className="px-1 text-white/25">—</span> {clip.end_time}
        </span>
      </span>
      <Play className="mr-1 size-3.5 shrink-0 text-white/25 transition-colors group-hover:text-cyan-100" />
    </button>
  )
}

export function SupoClipMatrixView({
  videoId,
  sourceUrl,
  clips,
  activeClipId,
  isProcessing = false,
  processingLabel = 'Fetching and analyzing source',
  loadError,
  onRetry,
  onSelectClip,
  onClose,
  className,
}: SupoClipMatrixViewProps) {
  const [focusedClip, setFocusedClip] = React.useState<WallClip | null>(null)
  const [focusedIndex, setFocusedIndex] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const sourceLabel = formatSourceLabel(sourceUrl, videoId)

  const openClip = (clip: WallClip, index: number) => {
    setFocusedClip(clip)
    setFocusedIndex(index)
    setIsPlaying(false)
  }

  const closeClip = () => {
    setFocusedClip(null)
    setIsPlaying(false)
  }

  const activeVideoId =
    videoId ||
    extractYouTubeVideoId(sourceUrl) ||
    (focusedClip ? extractYouTubeVideoId(focusedClip.video_url) : null)

  return (
    <aside
      aria-label="Source clips"
      className={cn(
        'relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#08090b] text-white shadow-[0_24px_80px_-42px_rgba(0,0,0,0.95)]',
        className,
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-cyan-100/15 bg-cyan-100/[0.06] text-cyan-100/80">
          <Scissors className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-medium tracking-wide text-white/90">Source clips</h2>
          <p className="mt-0.5 truncate text-[11px] text-white/40" title={sourceLabel}>{sourceLabel}</p>
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`}
            target="_blank"
            rel="noreferrer"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.07] hover:text-white"
            aria-label="Open source video"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.07] hover:text-white"
            aria-label="Close source clips"
          >
            <X className="size-4" />
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
        {isProcessing && (
          <div role="status" className="mb-3 flex items-center gap-2.5 px-1 py-1 text-[11px] text-white/55">
            <span className="relative grid size-3 place-items-center">
              <span className="absolute size-3 animate-ping rounded-full bg-cyan-200/25" />
              <span className="size-1.5 rounded-full bg-cyan-100" />
            </span>
            {processingLabel}
          </div>
        )}

        {loadError ? (
          <div className="flex min-h-40 flex-col items-center justify-center px-5 text-center">
            <p className="text-sm font-medium text-white/85">Couldn’t fetch this source</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/45">{loadError}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/75 transition hover:border-cyan-100/35 hover:text-white"
              >
                <RotateCcw className="size-3.5" /> Try again
              </button>
            )}
          </div>
        ) : clips.length > 0 ? (
          <div className="space-y-2.5">
            {clips.map((clip, index) => (
              <ClipRow
                key={clip.id}
                clip={clip}
                index={index}
                isCurrent={clip.id === activeClipId}
                onOpen={() => openClip(clip, index)}
              />
            ))}
          </div>
        ) : !isProcessing ? (
          <div className="flex min-h-40 items-center justify-center px-5 text-center text-xs leading-relaxed text-white/40">
            Add a public YouTube video or channel URL to find clips.
          </div>
        ) : null}
      </div>

      <Dialog open={focusedClip !== null} onOpenChange={(open) => !open && closeClip()}>
        <DialogContent className="max-h-[90dvh] max-w-3xl gap-0 overflow-hidden border-white/10 bg-[#0a0b0d] p-0 text-white md:grid-cols-[minmax(240px,330px)_minmax(0,1fr)]">
          {focusedClip && (
            <>
              <div className="relative flex min-h-[340px] items-center justify-center bg-black p-4">
                <div className="relative aspect-[9/16] max-h-[72dvh] w-full overflow-hidden rounded-xl bg-[#101114]">
                  {isPlaying && activeVideoId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?start=${secondsFromTimestamp(focusedClip.start_time)}&autoplay=1&controls=1&rel=0`}
                      title={focusedClip.hook_title}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      {focusedClip.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={focusedClip.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                      <button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 grid place-items-center"
                        aria-label="Play source clip"
                      >
                        <span className="grid size-12 place-items-center rounded-full border border-white/50 bg-black/35 text-white shadow-xl backdrop-blur-sm">
                          <Play className="ml-0.5 size-5 fill-current" />
                        </span>
                      </button>
                      <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 font-mono text-[11px] tabular-nums text-white/80">
                        {focusedClip.start_time} — {focusedClip.end_time}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-100/55">
                    Clip {focusedIndex + 1} <span className="px-1 text-white/20">/</span> {clips.length}
                  </p>
                  <DialogTitle className="mt-3 text-xl font-medium leading-snug tracking-tight text-white/95">
                    {focusedClip.hook_title}
                  </DialogTitle>
                  <DialogDescription className="mt-2 font-mono text-xs tabular-nums text-white/45">
                    {focusedClip.start_time} — {focusedClip.end_time} · {formatClipDuration(focusedClip.duration)}
                  </DialogDescription>

                  {focusedClip.text && (
                    <section className="mt-8 border-t border-white/[0.08] pt-5">
                      <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">Transcript</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/75">“{focusedClip.text}”</p>
                    </section>
                  )}
                </div>
                <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-4">
                  <span className="truncate font-mono text-[11px] text-white/35">{sourceLabel}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectClip?.(focusedClip)
                      closeClip()
                    }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-100 px-3.5 py-2 text-xs font-semibold text-[#071014] transition hover:bg-white"
                  >
                    <Scissors className="size-3.5" /> Use this cut
                  </button>
                </footer>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  )
}
