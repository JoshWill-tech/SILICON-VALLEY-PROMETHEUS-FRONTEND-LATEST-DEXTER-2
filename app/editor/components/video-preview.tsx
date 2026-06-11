'use client'

import { Pause, Play } from 'lucide-react'

type VideoPreviewProps = {
  isPlaying: boolean
  onTogglePlayback: () => void
}

export function VideoPreview({ isPlaying, onTogglePlayback }: VideoPreviewProps) {
  const Icon = isPlaying ? Pause : Play

  return (
    <button
      type="button"
      className="group relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black px-4 py-5"
      onClick={onTogglePlayback}
      aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
    >
      <div className="relative flex aspect-[9/16] max-h-full w-full max-w-[min(78vw,340px)] items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black shadow-[0_30px_90px_-40px_rgba(0,0,0,0.95)] md:aspect-video md:max-w-4xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(0,240,255,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
        <div className="absolute inset-x-6 top-6 h-2 rounded-full bg-white/10" />
        <div className="relative grid size-20 place-items-center rounded-full border border-white/15 bg-black/48 text-white/90 backdrop-blur-xl transition-transform group-hover:scale-105">
          <Icon className="size-8" aria-hidden="true" />
        </div>
        <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 font-mono text-[11px] text-white/65">
          1080x1920
        </div>
      </div>
    </button>
  )
}
