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
}

export interface UseNetflixIntroSoundResult {
  isPlaying: boolean
  play: () => Promise<boolean>
}

/**
 * Plays the Netflix intro audio element with DOM lookup and fallback.
 */
function playAudioElement(volume: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve(false)
        return
      }

      if ((window as unknown as { __PROMETHEUS_INTRO_PLAYED__?: boolean }).__PROMETHEUS_INTRO_PLAYED__) {
        resolve(true)
        return
      }

      const earlyAudio = (window as unknown as { __prometheus_intro_audio?: HTMLAudioElement }).__prometheus_intro_audio
      const domAudio = document.getElementById('prometheus-netflix-sound') as HTMLAudioElement | null
      const audio = earlyAudio || domAudio || new Audio('/audio/netflix-intro.mp3')

      audio.volume = Math.max(0, Math.min(1, volume))
      try {
        audio.currentTime = 0
      } catch {
        // Safe ignore if audio has not buffered yet
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (typeof window !== 'undefined') {
              ;(window as unknown as { __PROMETHEUS_INTRO_PLAYED__?: boolean }).__PROMETHEUS_INTRO_PLAYED__ = true
              window.dispatchEvent(new CustomEvent('prometheus:intro-sound-played'))
            }
            resolve(true)
          })
          .catch(() => {
            resolve(false)
          })
      } else {
        if (typeof window !== 'undefined') {
          ;(window as unknown as { __PROMETHEUS_INTRO_PLAYED__?: boolean }).__PROMETHEUS_INTRO_PLAYED__ = true
          window.dispatchEvent(new CustomEvent('prometheus:intro-sound-played'))
        }
        resolve(true)
      }
    } catch {
      resolve(false)
    }
  })
}

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
      ctx.resume().catch(() => {})
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

    if (typeof window !== 'undefined') {
      ;(window as unknown as { __PROMETHEUS_INTRO_PLAYED__?: boolean }).__PROMETHEUS_INTRO_PLAYED__ = true
      window.dispatchEvent(new CustomEvent('prometheus:intro-sound-played'))
    }
  } catch {
    // Graceful no-op if Web Audio is unsupported or blocked
  }
}

/**
 * useNetflixIntroSound
 * 
 * Plays the iconic Netflix "ta-dum" sound strictly upon initial site/page reload.
 * Does NOT replay on client-side route transitions/page switches to prevent acoustic fatigue.
 */
export function useNetflixIntroSound({
  volume = 0.75,
  enabled = true,
}: UseNetflixIntroSoundOptions = {}): UseNetflixIntroSoundResult {
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  const hasTriggeredOnMountRef = useRef(false)

  const play = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    isPlayingRef.current = true
    setIsPlaying(true)

    let success = await playAudioElement(volume)

    // Standalone Audio fallback if DOM audio element failed or was missing
    if (!success) {
      try {
        const standalone = new Audio('/audio/netflix-intro.mp3')
        standalone.volume = Math.max(0, Math.min(1, volume))
        try {
          standalone.currentTime = 0
        } catch {}
        const p = standalone.play()
        if (p !== undefined) {
          await p
          if (typeof window !== 'undefined') {
            ;(window as unknown as { __PROMETHEUS_INTRO_PLAYED__?: boolean }).__PROMETHEUS_INTRO_PLAYED__ = true
            window.dispatchEvent(new CustomEvent('prometheus:intro-sound-played'))
          }
          success = true
        }
      } catch {
        success = false
      }
    }

    if (success) {
      if (typeof window !== 'undefined') {
        ;(window as unknown as { __PROMETHEUS_INTRO_PLAYED__?: boolean }).__PROMETHEUS_INTRO_PLAYED__ = true
      }
      setTimeout(() => {
        isPlayingRef.current = false
        setIsPlaying(false)
      }, 4000)
      return true
    } else {
      isPlayingRef.current = false
      setIsPlaying(false)
      return false
    }
  }, [volume])

  // Expose global helper for direct manual replay and test verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as { __playPrometheusIntroSound?: () => Promise<boolean> }).__playPrometheusIntroSound = play
    }
  }, [play])

  // Trigger ONLY upon initial page reload / site load.
  // By omitting route/pathname dependencies and gating with a lifecycle mount ref,
  // client-side page switches remain quiet, preventing acoustic fatigue.
  useEffect(() => {
    if (!enabled) return

    // If intro sound has already successfully played during this page lifecycle,
    // stay quiet across client-side page transitions.
    if (typeof window !== 'undefined' && (window as unknown as { __PROMETHEUS_INTRO_PLAYED__?: boolean }).__PROMETHEUS_INTRO_PLAYED__) {
      return
    }

    let isCleanedUp = false
    let cleanupListeners: (() => void) | null = null

    const attachGestureFallback = () => {
      if (cleanupListeners || isCleanedUp) return

      const onGesture = () => {
        play().then((started) => {
          if (started) {
            cleanupListeners?.()
            cleanupListeners = null
          } else {
            // Modern browser autoplay policy prevented unmuted sound without user gesture on reload.
            // If media element was blocked, synthesize the iconic cinematic chime
            playSynthesizedNetflixChime(volume)
            cleanupListeners?.()
            cleanupListeners = null
          }
        }).catch(() => {
          playSynthesizedNetflixChime(volume)
          cleanupListeners?.()
          cleanupListeners = null
        })
      }

      // Valid user activations ONLY.
      // Pointer move, scroll, and wheel are excluded because they are NOT user activation gestures
      // under browser autoplay policy and would prematurely consume and destroy gesture listeners.
      const events: (keyof WindowEventMap)[] = [
        'pointerdown',
        'mousedown',
        'keydown',
        'touchstart',
        'click',
      ]

      events.forEach((evt) => {
        window.addEventListener(evt, onGesture, {
          passive: true,
          capture: true,
        })
      })

      cleanupListeners = () => {
        events.forEach((evt) => {
          window.removeEventListener(evt, onGesture, { capture: true })
        })
      }
    }

    const attemptPlay = async () => {
      if (hasTriggeredOnMountRef.current && (window as unknown as { __PROMETHEUS_INTRO_PLAYED__?: boolean }).__PROMETHEUS_INTRO_PLAYED__) {
        return
      }
      hasTriggeredOnMountRef.current = true

      // Attempt immediate zero-click playback at the first moment of initial refresh
      const ok = await play()
      if (!ok && !isCleanedUp) {
        // Modern browser autoplay policy prevented unmuted sound without user gesture on reload.
        // Listen for any user gesture (pointerdown, click, keydown, touchstart) to immediately trigger audio.
        attachGestureFallback()
      }
    }

    attemptPlay()

    const handleReplay = () => {
      play().catch(() => {})
    }
    window.addEventListener('prometheus:replay-intro-sound', handleReplay)

    return () => {
      isCleanedUp = true
      cleanupListeners?.()
      window.removeEventListener('prometheus:replay-intro-sound', handleReplay)
      // Do NOT pause audio in cleanup! In React Strict Mode (dev),
      // effect cleanup runs immediately after initial mount. Pausing here
      // would kill the audio before the user hears it on reload.
    }
  }, [enabled, play, volume])

  return {
    isPlaying,
    play,
  }
}
