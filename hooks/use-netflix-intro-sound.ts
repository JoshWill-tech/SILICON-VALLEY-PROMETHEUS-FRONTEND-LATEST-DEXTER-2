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
   * Current pathname if routing check is needed.
   */
  pathname?: string
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
      const domAudio = document.getElementById('prometheus-netflix-sound') as HTMLAudioElement | null
      const audio = domAudio || new Audio('/audio/netflix-intro.mp3')

      audio.volume = Math.max(0, Math.min(1, volume))
      audio.currentTime = 0

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            window.dispatchEvent(new CustomEvent('prometheus:intro-sound-played'))
            resolve(true)
          })
          .catch(() => {
            resolve(false)
          })
      } else {
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
  } catch {
    // Graceful no-op if Web Audio is unsupported or blocked
  }
}

export function useNetflixIntroSound({
  volume = 0.75,
  enabled = true,
  pathname = '/',
}: UseNetflixIntroSoundOptions = {}): UseNetflixIntroSoundResult {
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)

  const play = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    isPlayingRef.current = true
    setIsPlaying(true)

    const success = await playAudioElement(volume)
    if (success) {
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

  // Trigger on every reload and route entry
  useEffect(() => {
    if (!enabled) return

    let cleanupListeners: (() => void) | null = null

    const attemptPlay = async () => {
      const ok = await play()
      if (!ok) {
        // Modern browser autoplay policy prevented unmuted sound without user gesture on reload.
        // Listen for any gesture (pointer, click, keydown, scroll, wheel) to immediately trigger audio.
        const onGesture = () => {
          cleanupListeners?.()
          cleanupListeners = null
          play().then((started) => {
            if (!started) {
              playSynthesizedNetflixChime(volume)
            }
          }).catch(() => {
            playSynthesizedNetflixChime(volume)
          })
        }

        const events: (keyof WindowEventMap)[] = [
          'pointerdown',
          'click',
          'keydown',
          'touchstart',
          'pointermove',
          'mousemove',
          'mouseover',
          'mouseenter',
          'pointerenter',
          'focus',
          'scroll',
          'wheel',
        ]

        events.forEach((evt) => {
          window.addEventListener(evt, onGesture, {
            once: true,
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
    }

    attemptPlay()

    const handleReplay = () => {
      play().catch(() => {})
    }
    window.addEventListener('prometheus:replay-intro-sound', handleReplay)

    return () => {
      cleanupListeners?.()
      window.removeEventListener('prometheus:replay-intro-sound', handleReplay)
      // Do NOT pause audio in cleanup! In React Strict Mode (dev),
      // effect cleanup runs immediately after initial mount. Pausing here
      // would kill the audio before the user hears it on reload.
    }
  }, [enabled, pathname, play, volume])

  return {
    isPlaying,
    play,
  }
}
