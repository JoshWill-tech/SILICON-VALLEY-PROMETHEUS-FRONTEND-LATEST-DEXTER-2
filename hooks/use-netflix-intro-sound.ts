'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface UseNetflixIntroSoundOptions {
  /**
   * Sound volume from 0.0 to 1.0 (default: 0.75).
   */
  volume?: number
  /**
   * If true, intro sound is enabled (default: true).
   */
  enabled?: boolean
  /**
   * Whether to only play on landing/studio surfaces (default: false to cover all Prometheus sections).
   */
  landingOnly?: boolean
  /**
   * Current pathname if routing check is needed.
   */
  pathname?: string
}

export interface UseNetflixIntroSoundResult {
  hasPlayed: boolean
  isPlaying: boolean
  play: () => Promise<boolean>
}

// Module-level tracking to prevent overlapping audio while permitting fresh visits and studio transitions
let lastPlayedTime = 0
let lastPlayedRoute: string | null = null
const COOLDOWN_MS = 4000 // 4 seconds (duration of the Netflix intro chime)

/**
 * Synthesizes a backup cinematic "ta-dum" sound using Web Audio API
 * in the unlikely event the MP3/OGG asset fails to load or is blocked.
 */
function playSynthesizedNetflixChime(volume: number = 0.75): void {
  if (typeof window === 'undefined') return
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return

  try {
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(volume * 0.9, now)
    masterGain.connect(ctx.destination)

    // First impact knock (t = 0)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(95, now)
    osc1.frequency.exponentialRampToValueAtTime(38, now + 0.35)
    gain1.gain.setValueAtTime(0.9, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc1.connect(gain1)
    gain1.connect(masterGain)
    osc1.start(now)
    osc1.stop(now + 0.5)

    // Second impact knock (t = 0.13s - characteristic "ta-DUM")
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(110, now + 0.13)
    osc2.frequency.exponentialRampToValueAtTime(32, now + 0.55)
    gain2.gain.setValueAtTime(0, now)
    gain2.gain.setValueAtTime(1.0, now + 0.13)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
    osc2.connect(gain2)
    gain2.connect(masterGain)
    osc2.start(now + 0.13)
    osc2.stop(now + 1.0)

    // Resonant sub-bass swell
    const subOsc = ctx.createOscillator()
    const subGain = ctx.createGain()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(55, now + 0.14)
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.8)
    subGain.gain.setValueAtTime(0, now)
    subGain.gain.setValueAtTime(0.7, now + 0.15)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)
    subOsc.connect(subGain)
    subGain.connect(masterGain)
    subOsc.start(now + 0.14)
    subOsc.stop(now + 2.1)
  } catch {
    // Graceful no-op if Web Audio is unsupported or blocked
  }
}

export function useNetflixIntroSound({
  volume = 0.75,
  enabled = true,
  landingOnly = false,
  pathname = '/',
}: UseNetflixIntroSoundOptions = {}): UseNetflixIntroSoundResult {
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)

  // Both front-end landing and studio surfaces are always eligible
  const isEligibleRoute =
    !landingOnly ||
    pathname === '/' ||
    pathname === '' ||
    pathname.startsWith('/studio') ||
    pathname.startsWith('/editor')

  const play = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    if (isPlayingRef.current) return false

    try {
      // Prefer preloaded DOM element if available for instant playback with zero buffer lag
      const domAudio = document.getElementById('prometheus-netflix-sound') as HTMLAudioElement | null

      let audio = domAudio || audioRef.current
      if (!audio) {
        audio = new Audio()
        audio.preload = 'auto'

        // Check browser codec capability
        if (audio.canPlayType('audio/mpeg')) {
          audio.src = '/audio/netflix-intro.mp3'
        } else if (audio.canPlayType('audio/ogg; codecs="vorbis"')) {
          audio.src = '/audio/netflix-intro.ogg'
        } else if (audio.canPlayType('audio/webm; codecs="opus"')) {
          audio.src = '/audio/netflix-intro.webm'
        } else {
          audio.src = '/audio/netflix-intro.mp3'
        }
        audioRef.current = audio
      }

      audio.volume = Math.max(0, Math.min(1, volume))

      // Hook audio lifecycle listeners
      const onPlay = () => {
        isPlayingRef.current = true
        setIsPlaying(true)
        setHasPlayed(true)
        lastPlayedTime = Date.now()
        lastPlayedRoute = pathname
        window.dispatchEvent(new CustomEvent('prometheus:intro-sound-played'))
      }

      const onEnded = () => {
        isPlayingRef.current = false
        setIsPlaying(false)
      }

      const onError = () => {
        isPlayingRef.current = false
        setIsPlaying(false)
        playSynthesizedNetflixChime(volume)
      }

      audio.addEventListener('play', onPlay, { once: true })
      audio.addEventListener('ended', onEnded, { once: true })
      audio.addEventListener('error', onError, { once: true })

      audio.currentTime = 0
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        await playPromise
      }

      isPlayingRef.current = true
      setIsPlaying(true)
      setHasPlayed(true)
      lastPlayedTime = Date.now()
      lastPlayedRoute = pathname
      return true
    } catch {
      // Browser autoplay policy rejected or user gesture required
      return false
    }
  }, [pathname, volume])

  // Expose global helper for testing and direct invocation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as { __playPrometheusIntroSound?: () => Promise<boolean> }).__playPrometheusIntroSound = play
    }
  }, [play])

  useEffect(() => {
    if (!enabled || !isEligibleRoute) return

    const now = Date.now()
    const isNewRoute = lastPlayedRoute !== pathname
    const cooldownElapsed = now - lastPlayedTime > COOLDOWN_MS

    // Only throttle if navigating rapidly within the same active section under cooldown
    if (!cooldownElapsed && !isNewRoute) return

    let isDisposed = false
    let cleanupGestureListeners: (() => void) | null = null

    const triggerPlay = async () => {
      if (isDisposed) return false
      const success = await play()
      if (success) {
        lastPlayedTime = Date.now()
        lastPlayedRoute = pathname
      }
      return success
    }

    // 1. Attempt immediate autoplay on mount/navigation
    triggerPlay().then((success) => {
      if (isDisposed || success) return

      // 2. Modern browser autoplay policy blocked sound without prior user gesture in this tab.
      // Attach one-time listeners so the moment the individual touches, clicks, or interacts with the studio, it plays.
      const onFirstInteraction = () => {
        if (isDisposed) return
        cleanupGestureListeners?.()
        cleanupGestureListeners = null
        triggerPlay().catch(() => {})
      }

      const gestureEvents: (keyof WindowEventMap)[] = [
        'pointerdown',
        'click',
        'keydown',
        'touchstart',
      ]

      gestureEvents.forEach((evt) => {
        window.addEventListener(evt, onFirstInteraction, {
          once: true,
          passive: true,
          capture: true,
        })
      })

      cleanupGestureListeners = () => {
        gestureEvents.forEach((evt) => {
          window.removeEventListener(evt, onFirstInteraction, {
            capture: true,
          })
        })
      }
    })

    const handleReplay = () => {
      lastPlayedTime = 0
      triggerPlay().catch(() => {})
    }
    window.addEventListener('prometheus:replay-intro-sound', handleReplay)

    return () => {
      isDisposed = true
      cleanupGestureListeners?.()
      window.removeEventListener('prometheus:replay-intro-sound', handleReplay)
      if (audioRef.current && isPlayingRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } catch {
          // Ignore pause errors during unmount
        }
      }
    }
  }, [enabled, isEligibleRoute, pathname, play])

  return {
    hasPlayed,
    isPlaying,
    play,
  }
}
