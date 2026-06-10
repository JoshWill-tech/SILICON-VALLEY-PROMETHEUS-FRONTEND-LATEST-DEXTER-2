'use client'

import * as React from 'react'

const PLAYER_SPEED_KEY = 'prometheus_player_speed'
const DEFAULT_PLAYBACK_RATE = 1
const AUTO_HIDE_DELAY_MS = 2500
const CENTER_FADE_DELAY_MS = 2000

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>
  unlock?: () => void
}

export type YoutubePlayerStatus = 'idle' | 'playing' | 'paused' | 'ended' | 'waiting' | 'canplay'

export const PLAYER_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100
}

export function normalizePlaybackRate(value: number) {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_PLAYBACK_RATE
}

export function clampMediaTime(time: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  if (!Number.isFinite(time)) return 0
  return Math.max(0, Math.min(duration, time))
}

export function getProgressPercent(position: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return Math.max(0, Math.min(100, roundToTwoDecimals((clampMediaTime(position, duration) / duration) * 100)))
}

export function getScrubSeekTime(
  startTime: number,
  deltaX: number,
  width: number,
  scrubWindowSeconds: number,
  duration: number,
) {
  if (!Number.isFinite(width) || width <= 0) {
    return clampMediaTime(startTime, duration)
  }

  const deltaSeconds = roundToTwoDecimals((deltaX / width) * scrubWindowSeconds)
  return clampMediaTime(startTime + deltaSeconds, duration)
}

export function formatPlayerTime(value: number) {
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

function readStoredPlaybackRate() {
  if (typeof window === 'undefined') return DEFAULT_PLAYBACK_RATE

  const stored = Number(window.localStorage.getItem(PLAYER_SPEED_KEY))
  return normalizePlaybackRate(stored)
}

type UseYoutubePlayerResult = {
  bindVideoEvents: {
    onCanPlay: () => void
    onDurationChange: () => void
    onEnded: () => void
    onLoadedMetadata: () => void
    onPause: () => void
    onPlay: () => void
    onProgress: () => void
    onTimeUpdate: () => void
    onVolumeChange: () => void
    onWaiting: () => void
  }
  brightnessLevel: number
  brightnessOverlayValue: number | null
  bufferedEnd: number
  containerRef: React.RefObject<HTMLDivElement | null>
  currentTime: number
  duration: number
  isFullscreen: boolean
  muted: boolean
  pause: () => void
  pauseAutoHide: () => void
  play: () => Promise<void>
  playbackRate: number
  resumeAutoHide: () => void
  seek: (time: number) => void
  seekBy: (delta: number) => void
  setPlaybackRate: (speed: number) => void
  setVolume: (nextVolume: number) => void
  showCenterControl: boolean
  showControls: boolean
  showControlsNow: (showCenter?: boolean) => void
  status: YoutubePlayerStatus
  toggleFullscreen: () => Promise<void>
  toggleMuted: () => void
  togglePlayback: () => void
  videoRef: React.RefObject<HTMLVideoElement | null>
  volume: number
  volumeOverlayValue: number | null
  adjustBrightness: (delta: number) => void
  adjustVolume: (delta: number) => void
}

export function useYoutubePlayer(src?: string | null): UseYoutubePlayerResult {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = React.useState<YoutubePlayerStatus>('idle')
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [bufferedEnd, setBufferedEnd] = React.useState(0)
  const [muted, setMuted] = React.useState(false)
  const [volume, setVolumeState] = React.useState(1)
  const [playbackRate, setPlaybackRateState] = React.useState(DEFAULT_PLAYBACK_RATE)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showControls, setShowControls] = React.useState(true)
  const [showCenterControl, setShowCenterControl] = React.useState(true)
  const [autoHideSuspended, setAutoHideSuspended] = React.useState(false)
  const [brightnessLevel, setBrightnessLevel] = React.useState(1)
  const [volumeOverlayValue, setVolumeOverlayValue] = React.useState<number | null>(null)
  const [brightnessOverlayValue, setBrightnessOverlayValue] = React.useState<number | null>(null)
  const hideControlsTimerRef = React.useRef<number | null>(null)
  const hideCenterTimerRef = React.useRef<number | null>(null)
  const overlayTimerRef = React.useRef<number | null>(null)

  const clearHideControlsTimer = React.useCallback(() => {
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current)
      hideControlsTimerRef.current = null
    }
  }, [])

  const clearHideCenterTimer = React.useCallback(() => {
    if (hideCenterTimerRef.current !== null) {
      window.clearTimeout(hideCenterTimerRef.current)
      hideCenterTimerRef.current = null
    }
  }, [])

  const clearOverlayTimer = React.useCallback(() => {
    if (overlayTimerRef.current !== null) {
      window.clearTimeout(overlayTimerRef.current)
      overlayTimerRef.current = null
    }
  }, [])

  const queueOverlayDismiss = React.useCallback(() => {
    clearOverlayTimer()
    overlayTimerRef.current = window.setTimeout(() => {
      setVolumeOverlayValue(null)
      setBrightnessOverlayValue(null)
    }, 900)
  }, [clearOverlayTimer])

  const refreshBuffered = React.useCallback(() => {
    const video = videoRef.current
    if (!video || video.buffered.length === 0) {
      setBufferedEnd(0)
      return
    }
    setBufferedEnd(video.buffered.end(video.buffered.length - 1))
  }, [])

  const scheduleAutoHide = React.useCallback(() => {
    clearHideControlsTimer()
    if (autoHideSuspended || status !== 'playing') return

    hideControlsTimerRef.current = window.setTimeout(() => {
      setShowControls(false)
    }, AUTO_HIDE_DELAY_MS)
  }, [autoHideSuspended, clearHideControlsTimer, status])

  const scheduleCenterFade = React.useCallback(() => {
    clearHideCenterTimer()
    if (status !== 'playing') return

    hideCenterTimerRef.current = window.setTimeout(() => {
      setShowCenterControl(false)
    }, CENTER_FADE_DELAY_MS)
  }, [clearHideCenterTimer, status])

  const showControlsNow = React.useCallback(
    (showCenter = true) => {
      setShowControls(true)
      if (showCenter) {
        setShowCenterControl(true)
      }
      if (!autoHideSuspended && status === 'playing') {
        scheduleAutoHide()
        if (showCenter) {
          scheduleCenterFade()
        }
      }
    },
    [autoHideSuspended, scheduleAutoHide, scheduleCenterFade, status],
  )

  const pauseAutoHide = React.useCallback(() => {
    setAutoHideSuspended(true)
    clearHideControlsTimer()
  }, [clearHideControlsTimer])

  const resumeAutoHide = React.useCallback(() => {
    setAutoHideSuspended(false)
    if (status === 'playing') {
      scheduleAutoHide()
    } else {
      setShowControls(true)
    }
  }, [scheduleAutoHide, status])

  const seek = React.useCallback((time: number) => {
    const video = videoRef.current
    const nextTime = clampMediaTime(time, video?.duration ?? duration)

    if (video) {
      video.currentTime = nextTime
    }

    setCurrentTime(nextTime)
    refreshBuffered()
  }, [duration, refreshBuffered])

  const seekBy = React.useCallback(
    (delta: number) => {
      const video = videoRef.current
      const baseTime = video?.currentTime ?? currentTime
      seek(baseTime + delta)
    },
    [currentTime, seek],
  )

  const syncMediaSettings = React.useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = playbackRate
    video.volume = volume
    video.muted = muted
  }, [muted, playbackRate, volume])

  const play = React.useCallback(async () => {
    const video = videoRef.current
    if (!video || !src) return

    if (status === 'ended' || (Number.isFinite(video.duration) && video.currentTime >= video.duration)) {
      video.currentTime = 0
      setCurrentTime(0)
    }

    syncMediaSettings()
    setShowControls(true)
    setShowCenterControl(true)

    try {
      await video.play()
      setStatus('playing')
      scheduleAutoHide()
      scheduleCenterFade()
    } catch {
      setStatus(video.paused ? 'paused' : 'playing')
    }
  }, [scheduleAutoHide, scheduleCenterFade, src, status, syncMediaSettings])

  const pause = React.useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.pause()
    setStatus('paused')
    setShowControls(true)
    setShowCenterControl(true)
    clearHideControlsTimer()
    clearHideCenterTimer()
  }, [clearHideCenterTimer, clearHideControlsTimer])

  const togglePlayback = React.useCallback(() => {
    const video = videoRef.current
    if (!video || video.paused || status === 'ended') {
      void play()
      return
    }

    pause()
  }, [pause, play, status])

  const setPlaybackRate = React.useCallback((speed: number) => {
    const nextSpeed = normalizePlaybackRate(speed)
    const video = videoRef.current

    if (video) {
      video.playbackRate = nextSpeed
    }

    setPlaybackRateState(nextSpeed)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLAYER_SPEED_KEY, String(nextSpeed))
    }
  }, [])

  const setVolume = React.useCallback(
    (nextVolume: number) => {
      const normalized = Math.max(0, Math.min(1, nextVolume))
      const video = videoRef.current

      if (video) {
        video.volume = normalized
        video.muted = normalized <= 0
      }

      setVolumeState(normalized)
      setMuted(normalized <= 0)
      setVolumeOverlayValue(normalized)
      setBrightnessOverlayValue(null)
      queueOverlayDismiss()
    },
    [queueOverlayDismiss],
  )

  const adjustVolume = React.useCallback(
    (delta: number) => {
      const video = videoRef.current
      const baseline = video ? (video.muted ? 0 : video.volume) : muted ? 0 : volume
      setVolume(baseline + delta)
    },
    [muted, setVolume, volume],
  )

  const toggleMuted = React.useCallback(() => {
    const video = videoRef.current

    if (!video) return

    if (video.muted || muted) {
      if (volume <= 0) {
        setVolume(0.5)
        return
      }

      video.muted = false
      setMuted(false)
      setVolumeOverlayValue(video.volume)
      setBrightnessOverlayValue(null)
      queueOverlayDismiss()
      return
    }

    video.muted = true
    setMuted(true)
    setVolumeOverlayValue(0)
    setBrightnessOverlayValue(null)
    queueOverlayDismiss()
  }, [muted, queueOverlayDismiss, setVolume, volume])

  const adjustBrightness = React.useCallback(
    (delta: number) => {
      setBrightnessLevel((current) => {
        const nextValue = Math.max(0.25, Math.min(1.75, roundToTwoDecimals(current + delta)))
        setBrightnessOverlayValue(roundToTwoDecimals((nextValue - 0.25) / 1.5))
        setVolumeOverlayValue(null)
        queueOverlayDismiss()
        return nextValue
      })
    },
    [queueOverlayDismiss],
  )

  const toggleFullscreen = React.useCallback(async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        await (screen.orientation as LockableScreenOrientation | undefined)?.unlock?.()
        return
      }

      await container.requestFullscreen?.()
      await (screen.orientation as LockableScreenOrientation | undefined)?.lock?.('landscape')
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
  }, [])

  React.useEffect(() => {
    setPlaybackRateState(readStoredPlaybackRate())
  }, [])

  React.useEffect(() => {
    syncMediaSettings()
  }, [syncMediaSettings])

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  React.useEffect(() => {
    setStatus('idle')
    setCurrentTime(0)
    setDuration(0)
    setBufferedEnd(0)
    setShowControls(true)
    setShowCenterControl(true)
    clearHideControlsTimer()
    clearHideCenterTimer()
  }, [clearHideCenterTimer, clearHideControlsTimer, src])

  React.useEffect(() => {
    if (status !== 'playing') {
      setShowControls(true)
      setShowCenterControl(true)
      clearHideControlsTimer()
      clearHideCenterTimer()
      return
    }

    if (!autoHideSuspended && showControls) {
      scheduleAutoHide()
    }

    if (showCenterControl) {
      scheduleCenterFade()
    }
  }, [
    autoHideSuspended,
    clearHideCenterTimer,
    clearHideControlsTimer,
    scheduleAutoHide,
    scheduleCenterFade,
    showCenterControl,
    showControls,
    status,
  ])

  React.useEffect(() => {
    return () => {
      clearHideControlsTimer()
      clearHideCenterTimer()
      clearOverlayTimer()
    }
  }, [clearHideCenterTimer, clearHideControlsTimer, clearOverlayTimer])

  const bindVideoEvents = React.useMemo(
    () => ({
      onCanPlay: () => {
        setDuration(videoRef.current?.duration ?? 0)
        refreshBuffered()
        setStatus((current) => (current === 'playing' ? current : 'canplay'))
      },
      onDurationChange: () => setDuration(videoRef.current?.duration ?? 0),
      onEnded: () => setStatus('ended'),
      onLoadedMetadata: () => {
        setDuration(videoRef.current?.duration ?? 0)
        refreshBuffered()
      },
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
    adjustBrightness,
    adjustVolume,
    bindVideoEvents,
    brightnessLevel,
    brightnessOverlayValue,
    bufferedEnd,
    containerRef,
    currentTime,
    duration,
    isFullscreen,
    muted,
    pause,
    pauseAutoHide,
    play,
    playbackRate,
    resumeAutoHide,
    seek,
    seekBy,
    setPlaybackRate,
    setVolume,
    showCenterControl,
    showControls,
    showControlsNow,
    status,
    toggleFullscreen,
    toggleMuted,
    togglePlayback,
    videoRef,
    volume,
    volumeOverlayValue,
  }
}
