'use client'

import Image from 'next/image'

type TimelineClip = {
  id: string
  duration: number
  thumbnail?: string
}

type TimelineProps = {
  audioWaveform?: number[]
  clips: TimelineClip[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function Timeline({ audioWaveform, clips, currentTime, duration, onSeek }: TimelineProps) {
  const safeDuration = Math.max(duration, 1)
  const progress = Math.max(0, Math.min(1, currentTime / safeDuration))

  return (
    <div className="flex h-28 flex-col border-y border-white/10 bg-black/60">
      <button
        type="button"
        className="flex h-6 items-center px-4 text-left font-mono text-[10px] text-white/40"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          onSeek(((event.clientX - rect.left) / rect.width) * safeDuration)
        }}
      >
        <span>{formatTime(currentTime)}</span>
        <span className="mx-auto">{formatTime(duration)}</span>
      </button>

      <div className="relative flex-1 overflow-x-auto">
        <div className="flex h-full min-w-full items-center gap-1 px-4">
          {clips.map((clip) => (
            <button
              key={clip.id}
              type="button"
              className="relative h-12 min-w-16 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-white/10"
              style={{ width: `${Math.max(8, (clip.duration / safeDuration) * 100)}%` }}
              onClick={() => onSeek(Math.min(duration, clip.duration))}
            >
              {clip.thumbnail ? (
                <Image
                  src={clip.thumbnail}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover opacity-60"
                />
              ) : null}
            </button>
          ))}
        </div>

        <div
          className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-accent-cyan"
          style={{ left: `${progress * 100}%` }}
        >
          <div className="size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan" />
        </div>
      </div>

      {audioWaveform ? (
        <div className="flex h-8 items-end gap-px bg-teal-900/30 px-4">
          {audioWaveform.map((amp, index) => (
            <div
              key={`${amp}-${index}`}
              className="flex-1 rounded-t-sm bg-teal-400/60"
              style={{ height: `${Math.max(8, Math.min(100, amp * 100))}%` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function formatTime(value: number) {
  const safeValue = Math.max(0, Math.floor(value))
  const minutes = Math.floor(safeValue / 60)
  const seconds = safeValue % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
