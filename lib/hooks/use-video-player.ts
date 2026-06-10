'use client'

import * as React from 'react'

const PLAYER_SPEED_KEY = 'prometheus_player_speed'
const DEFAULT_SPEED = 1
type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>
}

export type VideoPlayerStatus = 'idle' | 'playing' | 'paused' | 'ended' | 'waiting' | 'canplay'

export function formatVideoTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00'

  const totalSeconds = Math.floor(value)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function readStoredSpeed() {
  if (typeof window === 'undefined') return DEFAULT_SPEED

  const stored = Number(window.localStorage.getItem(PLAYER_SPEED_KEY))
  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_SPEED
}

export function useVideoPlayer(src?: string | null) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = React.useState<VideoPlayerStatus>('idle')
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [bufferedEnd, setBufferedEnd] = React.useState(0)
  const [muted, setMuted] = React.useState(true)
  const [volume, setVolumeState] = React.useState(1)
  const [playbackRate, setPlaybackRateState] = React.useState(DEFAULT_SPEED)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  React.useEffect(() => {
    setPlaybackRateState(readStoredSpeed())
  }, [])

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
    video.volume = volume
    video.muted = muted
  }, [muted, playbackRate, src, volume])

  React.useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const refreshBuffered = React.useCallback(() => {
    const video = videoRef.current
    if (!video || video.buffered.length === 0) {
      setBufferedEnd(0)
      return
    }
    setBufferedEnd(video.buffered.end(video.buffered.length - 1))
  }, [])

  const play = React.useCallback(async () => {
    const video = videoRef.current
    if (!video || !src) return

    try {
      await video.play()
      setStatus('playing')
    } catch {
      setStatus(video.paused ? 'paused' : 'playing')
    }
  }, [src])

  const pause = React.useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    setStatus('paused')
  }, [])

  const togglePlayback = React.useCallback(() => {
    const video = videoRef.current
    if (!video || video.paused || status === 'ended') {
      void play()
      return
    }
    pause()
  }, [pause, play, status])

  const seek = React.useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    const nextTime = Math.max(0, Math.min(Number.isFinite(video.duration) ? video.duration : 0, time))
    video.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  const seekBy = React.useCallback(
    (delta: number) => {
      const video = videoRef.current
      seek((video?.currentTime ?? currentTime) + delta)
    },
    [currentTime, seek],
  )

  const setPlaybackRate = React.useCallback((speed: number) => {
    const normalizedSpeed = Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_SPEED
    const video = videoRef.current
    if (video) video.playbackRate = normalizedSpeed
    setPlaybackRateState(normalizedSpeed)
    window.localStorage.setItem(PLAYER_SPEED_KEY, String(normalizedSpeed))
  }, [])

  const setVolume = React.useCallback((nextVolume: number) => {
    const normalized = Math.max(0, Math.min(1, nextVolume))
    const video = videoRef.current
    if (video) {
      video.volume = normalized
      if (normalized > 0) video.muted = false
    }
    setVolumeState(normalized)
    if (normalized > 0) setMuted(false)
  }, [])

  const toggleMuted = React.useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !video.muted
    video.muted = nextMuted
    setMuted(nextMuted)
  }, [])

  const toggleLandscapeFullscreen = React.useCallback(async () => {
    const video = videoRef.current
    const container = video?.parentElement
    if (!video || !container) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        await screen.orientation?.unlock?.()
        return
      }

      await container.requestFullscreen?.()
      await (screen.orientation as LockableScreenOrientation | undefined)?.lock?.('landscape')
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
  }, [])

  const bindVideoEvents = React.useMemo(
    () => ({
      onCanPlay: () => {
        setStatus((current) => (current === 'playing' ? current : 'canplay'))
        setDuration(videoRef.current?.duration ?? 0)
        refreshBuffered()
      },
      onDurationChange: () => setDuration(videoRef.current?.duration ?? 0),
      onEnded: () => setStatus('ended'),
      onPause: () => setStatus((current) => (current === 'ended' ? current : 'paused')),
      onPlay: () => setStatus('playing'),
      onProgress: refreshBuffered,
      onTimeUpdate: () => {
        const video = videoRef.current
        if (!video) return
        setCurrentTime(video.currentTime)
        refreshBuffered()
      },
      onVolumeChange: () => {
        const video = videoRef.current
        if (!video) return
        setMuted(video.muted)
        setVolumeState(video.volume)
      },
      onWaiting: () => setStatus('waiting'),
    }),
    [refreshBuffered],
  )

  return {
    bindVideoEvents,
    bufferedEnd,
    currentTime,
    duration,
    isFullscreen,
    muted,
    pause,
    play,
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
  }
}
