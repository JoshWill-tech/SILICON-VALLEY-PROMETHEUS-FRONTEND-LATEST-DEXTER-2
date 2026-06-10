'use client'

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2, Maximize2, Pause, Play, RotateCw, Settings, Volume2, VolumeX } from 'lucide-react'

import { useDoubleTap } from '@/lib/hooks/use-double-tap'
import { formatVideoTime, useVideoPlayer } from '@/lib/hooks/use-video-player'
import { cn } from '@/lib/utils'

type MobileVideoPlayerProps = {
  className?: string
  poster?: string
  src?: string | null
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

export function MobileVideoPlayer({ className, poster, src }: MobileVideoPlayerProps) {
  const reduceMotion = useReducedMotion()
  const {
    bindVideoEvents,
    bufferedEnd,
    currentTime,
    duration,
    muted,
    playbackRate,
    seek,
    seekBy,
    setPlaybackRate,
    setVolume,
    status,
    toggleLandscapeFullscreen,
    toggleMuted,
    togglePlayback,
    videoRef,
    volume,
  } = useVideoPlayer(src)
  const [controlsVisible, setControlsVisible] = React.useState(true)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [seekFeedback, setSeekFeedback] = React.useState<'forward' | 'backward' | null>(null)
  const [volumeFeedback, setVolumeFeedback] = React.useState<number | null>(null)
  const progressRef = React.useRef<HTMLDivElement | null>(null)
  const hideControlsTimerRef = React.useRef<number | null>(null)
  const feedbackTimerRef = React.useRef<number | null>(null)
  const verticalGestureRef = React.useRef<{ startY: number; side: 'left' | 'right' } | null>(null)

  const isPlaying = status === 'playing'
  const showSpinner = status === 'waiting'
  const bufferedPercent = duration > 0 ? Math.min(100, (bufferedEnd / duration) * 100) : 0
  const playedPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const scheduleControlsHide = React.useCallback(() => {
    if (hideControlsTimerRef.current !== null) window.clearTimeout(hideControlsTimerRef.current)
    if (!isPlaying) return

    hideControlsTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false)
      setSettingsOpen(false)
    }, 2500)
  }, [isPlaying])

  const showControlsBriefly = React.useCallback(() => {
    setControlsVisible(true)
    scheduleControlsHide()
  }, [scheduleControlsHide])

  React.useEffect(() => {
    showControlsBriefly()
    return () => {
      if (hideControlsTimerRef.current !== null) window.clearTimeout(hideControlsTimerRef.current)
    }
  }, [showControlsBriefly])

  React.useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true)
      return
    }
    scheduleControlsHide()
  }, [isPlaying, scheduleControlsHide])

  const showSeekFeedback = React.useCallback((direction: 'forward' | 'backward') => {
    setSeekFeedback(direction)
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => setSeekFeedback(null), 650)
  }, [])

  const updateSeekFromClientX = React.useCallback(
    (clientX: number) => {
      const progress = progressRef.current
      if (!progress || duration <= 0) return
      const rect = progress.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      seek(ratio * duration)
    },
    [duration, seek],
  )

  const handleProgressPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      updateSeekFromClientX(event.clientX)
      showControlsBriefly()
    },
    [showControlsBriefly, updateSeekFromClientX],
  )

  const handleProgressPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
      updateSeekFromClientX(event.clientX)
    },
    [updateSeekFromClientX],
  )

  const handleDoubleTap = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const rightSide = event.clientX > rect.left + rect.width / 2
      seekBy(rightSide ? 10 : -10)
      showSeekFeedback(rightSide ? 'forward' : 'backward')
      showControlsBriefly()
    },
    [seekBy, showControlsBriefly, showSeekFeedback],
  )

  const handleSingleTap = React.useCallback(() => {
    if (!controlsVisible) {
      showControlsBriefly()
      return
    }
    togglePlayback()
    showControlsBriefly()
  }, [controlsVisible, showControlsBriefly, togglePlayback])

  const handleVideoTap = useDoubleTap({
    onDoubleTap: handleDoubleTap,
    onSingleTap: handleSingleTap,
  })

  const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    verticalGestureRef.current = {
      side: event.clientX < rect.left + rect.width / 2 ? 'left' : 'right',
      startY: event.clientY,
    }
  }, [])

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const gesture = verticalGestureRef.current
      if (!gesture || gesture.side !== 'right') return

      const delta = (gesture.startY - event.clientY) / 180
      if (Math.abs(delta) < 0.06) return
      const nextVolume = Math.max(0, Math.min(1, volume + delta))
      setVolume(nextVolume)
      setVolumeFeedback(nextVolume)
      showControlsBriefly()
      verticalGestureRef.current = { ...gesture, startY: event.clientY }
    },
    [setVolume, showControlsBriefly, volume],
  )

  const handlePointerUp = React.useCallback(() => {
    verticalGestureRef.current = null
    if (volumeFeedback !== null) {
      window.setTimeout(() => setVolumeFeedback(null), 500)
    }
  }, [volumeFeedback])

  return (
    <section
      className={cn('relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black px-4 py-5', className)}
      aria-label="Video preview player"
    >
      <div
        className="relative flex aspect-[9/16] max-h-full w-full max-w-[min(78vw,340px)] touch-none items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-black shadow-[0_30px_90px_-40px_rgba(0,0,0,0.95)] md:aspect-video md:max-w-4xl"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {src ? (
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            controls={false}
            muted={muted}
            playsInline
            poster={poster}
            preload="metadata"
            src={src}
            {...bindVideoEvents}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(0,212,255,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
        )}

        <button
          type="button"
          className="absolute inset-0 cursor-pointer touch-manipulation"
          onPointerUp={handleVideoTap}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        />

        <AnimatePresence>
          {showSpinner ? (
            <motion.div
              className="absolute inset-0 grid place-items-center bg-black/18"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="size-8 animate-spin text-white" aria-hidden="true" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {(!isPlaying || controlsVisible) ? (
            <motion.div
              className="pointer-events-none absolute inset-0 grid place-items-center"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
            >
              <div className="grid size-20 place-items-center rounded-full border border-white/15 bg-black/48 text-white/90 shadow-2xl backdrop-blur-xl">
                {isPlaying ? <Pause className="size-8" aria-hidden="true" /> : <Play className="ml-1 size-8" aria-hidden="true" />}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {seekFeedback ? (
            <motion.div
              className={cn(
                'pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl',
                seekFeedback === 'forward' ? 'right-8' : 'left-8',
              )}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
            >
              {seekFeedback === 'forward' ? '+10s' : '-10s'}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {volumeFeedback !== null ? (
            <motion.div
              className="pointer-events-none absolute right-4 top-1/2 w-2 -translate-y-1/2 overflow-hidden rounded-full bg-white/12"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mt-auto rounded-full bg-prometheus-accent-cyan" style={{ height: `${Math.round(volumeFeedback * 100)}%`, minHeight: 8 }} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {muted && isPlaying ? (
          <button
            type="button"
            onClick={toggleMuted}
            className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-medium text-white/82 backdrop-blur-xl"
          >
            Tap to unmute
          </button>
        ) : null}

        <AnimatePresence>
          {controlsVisible ? (
            <motion.div
              className="absolute inset-x-3 bottom-3 z-20 rounded-2xl border border-white/10 bg-black/40 p-3 text-white shadow-2xl backdrop-blur-md"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onPointerMove={showControlsBriefly}
            >
              <div
                ref={progressRef}
                className="relative h-6 cursor-pointer touch-none"
                onPointerDown={handleProgressPointerDown}
                onPointerMove={handleProgressPointerMove}
                style={{ touchAction: 'none' }}
              >
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/30">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-white/10" style={{ width: `${bufferedPercent}%` }} />
                  <div className="absolute inset-y-0 left-0 rounded-full bg-[#00D4FF]" style={{ width: `${playedPercent}%` }} />
                </div>
                <div
                  className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[#00D4FF] shadow-[0_0_18px_rgba(0,212,255,0.8)]"
                  style={{ left: `${playedPercent}%` }}
                />
              </div>

              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-cyan/70"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? <Pause className="size-4" aria-hidden="true" /> : <Play className="ml-0.5 size-4" aria-hidden="true" />}
                </button>
                <span className="min-w-[5.8rem] text-xs tabular-nums text-white/72">
                  {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={toggleMuted}
                  className="grid size-9 place-items-center rounded-full text-white/78 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-cyan/70"
                  aria-label={muted ? 'Unmute video' : 'Mute video'}
                >
                  {muted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((open) => !open)}
                    className="grid size-9 place-items-center rounded-full text-white/78 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-cyan/70"
                    aria-label="Playback settings"
                  >
                    <Settings className="size-4" aria-hidden="true" />
                  </button>
                  <AnimatePresence>
                    {settingsOpen ? (
                      <motion.div
                        className="absolute bottom-11 right-0 w-32 overflow-hidden rounded-xl border border-white/10 bg-black/80 p-1 shadow-2xl backdrop-blur-xl"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                      >
                        {SPEEDS.map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => {
                              setPlaybackRate(speed)
                              setSettingsOpen(false)
                            }}
                            className={cn(
                              'flex h-8 w-full items-center justify-between rounded-lg px-2 text-xs text-white/72 hover:bg-white/10 hover:text-white',
                              playbackRate === speed && 'bg-prometheus-accent-cyan/18 text-prometheus-accent-cyan',
                            )}
                          >
                            {speed}x
                            {playbackRate === speed ? <span aria-hidden="true">•</span> : null}
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <button
                  type="button"
                  onClick={toggleLandscapeFullscreen}
                  className="grid size-9 place-items-center rounded-full text-white/78 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-cyan/70"
                  aria-label="Toggle landscape fullscreen"
                >
                  <RotateCw className="size-4 md:hidden" aria-hidden="true" />
                  <Maximize2 className="hidden size-4 md:block" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!src ? (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 font-mono text-[11px] text-white/65">
            Add source video
          </div>
        ) : null}
      </div>
    </section>
  )
}
