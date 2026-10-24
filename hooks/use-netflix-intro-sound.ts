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
   * Whether to only play on the landing page/root (default: true).
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

// Module-level tracking so client-side SPA navigations don't repeatedly blare
let hasPlayedInSession = false

/**
 * Synthesizes a backup cinematic "ta-dum" sound using Web Audio API
 * in the unlikely event the MP3/OGG asset fails to load or is blocked.
 */
function playSynthesizedNetflixChime(volume: number = 0.75): void {
  if (typeof window === 'undefined') return
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
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
  landingOnly = true,
  pathname = '/',
}: UseNetflixIntroSoundOptions = {}): UseNetflixIntroSoundResult {
  const [hasPlayed, setHasPlayed] = useState(hasPlayedInSession)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)

  const isEligibleRoute = !landingOnly || pathname === '/' || pathname === ''

  const play = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    if (isPlayingRef.current) return false

    try {
      if (!audioRef.current) {
        const audio = new Audio()
        // Provide standard sources with fallback
        audio.preload = 'auto'
        audio.volume = Math.max(0, Math.min(1, volume))

        // Check format support
        if (audio.canPlayType('audio/mpeg')) {
          audio.src = '/audio/netflix-intro.mp3'
        } else if (audio.canPlayType('audio/ogg; codecs="vorbis"')) {
          audio.src = '/audio/netflix-intro.ogg'
        } else if (audio.canPlayType('audio/webm; codecs="opus"')) {
          audio.src = '/audio/netflix-intro.webm'
        } else {
          audio.src = '/audio/netflix-intro.mp3'
        }

        audio.addEventListener('play', () => {
          isPlayingRef.current = true
          setIsPlaying(true)
          setHasPlayed(true)
          hasPlayedInSession = true
          window.dispatchEvent(new CustomEvent('prometheus:intro-sound-played'))
        })

        audio.addEventListener('ended', () => {
          isPlayingRef.current = false
          setIsPlaying(false)
        })

        audio.addEventListener('error', () => {
          isPlayingRef.current = false
          setIsPlaying(false)
          // Fall back to Web Audio API synthesis if file fails
          playSynthesizedNetflixChime(volume)
        })

        audioRef.current = audio
      }

      audioRef.current.currentTime = 0
      audioRef.current.volume = Math.max(0, Math.min(1, volume))
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        await playPromise
      }

      hasPlayedInSession = true
      setHasPlayed(true)
      return true
    } catch {
      // Autoplay policy or user hasn't interacted yet
      return false
    }
  }, [volume])

  useEffect(() => {
    if (!enabled || !isEligibleRoute || hasPlayedInSession) return

    let isDisposed = false
    let cleanupGestureListeners: (() => void) | null = null

    // 1. Attempt immediate autoplay on mount
    play().then((success) => {
      if (isDisposed) return

      if (!success) {
        // 2. Modern browser autoplay policy blocked immediate playback without gesture.
        // Listen for the very first user interaction anywhere on the document.
        const onFirstInteraction = () => {
          if (isDisposed || hasPlayedInSession) return
          cleanupGestureListeners?.()
          cleanupGestureListeners = null
          play().catch(() => {})
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
      }
    })

    // Listen for manual replay commands
    const handleReplay = () => {
      play().catch(() => {})
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
  }, [enabled, isEligibleRoute, play])

  return {
    hasPlayed,
    isPlaying,
    play,
  }
}
