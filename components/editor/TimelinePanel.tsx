'use client'

import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Pause,
  Play,
  Scissors,
  AudioLines,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { Project, HeaderNavMode, PreviewMediaKind, BottomMode } from '@/lib/types'

export interface TimelinePanelProps {
  activeWorkspaceTab: HeaderNavMode
  previewKind: PreviewMediaKind
  previewUrl: string
  previewPlaying: boolean
  transportCurrentTime: string
  transportTime: string
  transportProgress: number
  isPreviewMuted: boolean
  project: Project | null
  bottomMode: BottomMode
  onTogglePlayback: () => void
  onSeek: (value: number) => void
  onToggleMute: () => void
  onSetBottomMode: (mode: BottomMode) => void
  /** Frame-accurate seek target in seconds (bypasses 0-100 quantization). */
  onSeekSeconds?: (timeSec: number) => void
  /** Split clip at playhead or specified timestamp */
  onSplit?: (timeSec?: number) => void
  /** Remove transcript-derived silent gaps from the editable timeline. */
  onRemoveSilence?: () => void
  /** Total preview duration in seconds; enables frame stepping + preview filmstrip. */
  durationSec?: number
}

const FRAME_STEP_SEC = 1 / 30
const THUMB_WIDTH = 160
const THUMB_HEIGHT = 90

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export type TimeFormatMode = 'COUNTER' | 'MM:SS' | 'MM:SS.d'

export interface ChronosChapter {
  id: string
  time: number
  title: string
  act: string
  hue: number
}

const DEFAULT_CHAPTERS: ChronosChapter[] = [
  { id: '01', time: 0, title: 'Overture in Obsidian', act: 'SEQ 01 // PROLOGUE', hue: 35 },
  { id: '02', time: 15, title: 'The Architecture of Silence', act: 'SEQ 02 // ACT I', hue: 210 },
  { id: '03', time: 42, title: 'Horological Precision', act: 'SEQ 03 // ACT II', hue: 38 },
  { id: '04', time: 78, title: 'Velocity & Light Refraction', act: 'SEQ 04 // ACT III', hue: 195 },
  { id: '05', time: 120, title: 'Nocturne in Champagne', act: 'SEQ 05 // EPILOGUE', hue: 32 },
]

export interface AudioProfile {
  name: string
  clickFreq: number
  subWeight: number
  noiseAmt: number
}

const AUDIO_PROFILES: AudioProfile[] = [
  { name: 'LEICA DETENT', clickFreq: 1850, subWeight: 1.0, noiseAmt: 0.45 },
  { name: 'CHRONOGRAPH', clickFreq: 3200, subWeight: 0.65, noiseAmt: 0.25 },
  { name: 'SUB-BASS REEL', clickFreq: 920, subWeight: 1.55, noiseAmt: 0.85 },
]

/**
 * Procedural Luxury Sound Engine (Web Audio API)
 * Synthesizes heavy mechanical watch/camera detents, sub-bass scrub swell,
 * analog tape friction noise, and resonant chapter lock harmonics.
 */
class LuxurySoundEngine {
  private ctx: AudioContext | null = null
  public isArmed: boolean = true
  public isInitialized: boolean = false
  public profileIndex: number = 0

  private scrubNoiseNode: AudioBufferSourceNode | null = null
  private scrubFilter: BiquadFilterNode | null = null
  private scrubGain: GainNode | null = null
  private subOsc: OscillatorNode | null = null
  private subGain: GainNode | null = null

  public init() {
    if (typeof window === 'undefined') return
    if (this.isInitialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume()
      }
      return
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtxClass) return
      this.ctx = new AudioCtxClass()
      this.setupContinuousScrubLoop()
      this.isInitialized = true
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  private setupContinuousScrubLoop() {
    if (!this.ctx) return

    try {
      // 1. Brown noise buffer for vintage reel friction
      const bufferSize = this.ctx.sampleRate * 2
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let lastOut = 0.0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        output[i] = (lastOut + 0.03 * white) / 1.03
        lastOut = output[i]
        output[i] *= 2.5 // Boost brown noise presence
      }

      this.scrubNoiseNode = this.ctx.createBufferSource()
      this.scrubNoiseNode.buffer = noiseBuffer
      this.scrubNoiseNode.loop = true

      this.scrubFilter = this.ctx.createBiquadFilter()
      this.scrubFilter.type = 'bandpass'
      this.scrubFilter.frequency.value = 180
      this.scrubFilter.Q.value = 1.4

      this.scrubGain = this.ctx.createGain()
      this.scrubGain.gain.value = 0.0001

      this.scrubNoiseNode.connect(this.scrubFilter)
      this.scrubFilter.connect(this.scrubGain)
      this.scrubGain.connect(this.ctx.destination)
      this.scrubNoiseNode.start(0)

      // 2. Sub-bass oscillator for cinematic weight during rapid scrub movements
      this.subOsc = this.ctx.createOscillator()
      this.subOsc.type = 'sine'
      this.subOsc.frequency.value = 44

      this.subGain = this.ctx.createGain()
      this.subGain.gain.value = 0.0001

      this.subOsc.connect(this.subGain)
      this.subGain.connect(this.ctx.destination)
      this.subOsc.start(0)
    } catch {
      // Ignore background oscillator creation errors
    }
  }

  public cycleProfile(): string {
    this.profileIndex = (this.profileIndex + 1) % AUDIO_PROFILES.length
    this.triggerTick(true, 1.2)
    return AUDIO_PROFILES[this.profileIndex].name
  }

  public get currentProfile(): AudioProfile {
    return AUDIO_PROFILES[this.profileIndex]
  }

  public triggerTick(isMajor = false, velocityFactor = 1.0) {
    if (!this.isArmed) return
    this.init()
    if (!this.ctx || this.ctx.state !== 'running') return

    try {
      const now = this.ctx.currentTime
      const profile = AUDIO_PROFILES[this.profileIndex]
      const velClamp = Math.min(Math.max(velocityFactor, 0.3), 3.0)

      const osc = this.ctx.createOscillator()
      const tickGain = this.ctx.createGain()
      const bandpass = this.ctx.createBiquadFilter()

      const baseFreq = profile.clickFreq * (isMajor ? 0.88 : 1.18) * (0.94 + Math.min(velClamp * 0.06, 0.25))
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(110, now + (isMajor ? 0.028 : 0.016))

      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(baseFreq * 1.1, now)
      bandpass.Q.setValueAtTime(3.2, now)

      const peakGain = (isMajor ? 0.16 : 0.08) * profile.subWeight * (0.7 + velClamp * 0.3)
      tickGain.gain.setValueAtTime(0.0001, now)
      tickGain.gain.linearRampToValueAtTime(peakGain, now + 0.0015)
      tickGain.gain.exponentialRampToValueAtTime(0.0001, now + (isMajor ? 0.03 : 0.018))

      osc.connect(bandpass)
      bandpass.connect(tickGain)
      tickGain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.035)
    } catch {
      // Transient synthesis catch
    }
  }

  public updateScrubVelocity(absVelocity: number) {
    if (!this.isInitialized || !this.ctx || !this.scrubGain || !this.subGain || !this.scrubFilter || !this.subOsc) return

    try {
      const now = this.ctx.currentTime
      if (!this.isArmed || this.ctx.state !== 'running') {
        this.scrubGain.gain.setTargetAtTime(0.0001, now, 0.05)
        this.subGain.gain.setTargetAtTime(0.0001, now, 0.05)
        return
      }

      const profile = AUDIO_PROFILES[this.profileIndex]
      const normalizedVel = Math.min(absVelocity / 35, 1.0)

      // Modulate reel tape friction
      const targetNoiseGain = Math.pow(normalizedVel, 1.4) * 0.14 * profile.noiseAmt
      const targetFilterFreq = 120 + normalizedVel * 980

      this.scrubGain.gain.setTargetAtTime(Math.max(0.0001, targetNoiseGain), now, 0.04)
      this.scrubFilter.frequency.setTargetAtTime(targetFilterFreq, now, 0.04)

      // Modulate deep sub-bass cinematic swell
      const targetSubGain = Math.pow(normalizedVel, 1.6) * 0.18 * profile.subWeight
      const targetSubFreq = 38 + normalizedVel * 32

      this.subGain.gain.setTargetAtTime(Math.max(0.0001, targetSubGain), now, 0.05)
      this.subOsc.frequency.setTargetAtTime(targetSubFreq, now, 0.05)
    } catch {
      // Velocity modulation catch
    }
  }

  public triggerChapterChime() {
    if (!this.isArmed) return
    this.init()
    if (!this.ctx || this.ctx.state !== 'running') return

    try {
      const now = this.ctx.currentTime
      const freqs = [110, 164.81, 220, 277.18] // A2 luxury cluster

      freqs.forEach((f, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const filter = this.ctx.createBiquadFilter()

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
        osc.frequency.setValueAtTime(f, now)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(600, now)
        filter.frequency.exponentialRampToValueAtTime(140, now + 1.4)

        const peak = 0.045 / (idx + 1)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.linearRampToValueAtTime(peak, now + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(now)
        osc.stop(now + 1.55)
      })
    } catch {
      // Chime catch
    }
  }

  public destroy() {
    try {
      if (this.scrubNoiseNode) {
        this.scrubNoiseNode.stop()
        this.scrubNoiseNode.disconnect()
      }
      if (this.subOsc) {
        this.subOsc.stop()
        this.subOsc.disconnect()
      }
      if (this.ctx) {
        void this.ctx.close()
      }
    } catch {
      // Cleanup catch
    }
  }
}

const BOKEH_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  seed: i * 17.31,
  radius: 16 + (i % 6) * 22,
  yRatio: 0.2 + ((i * 37) % 60) / 100,
  speed: 0.4 + (i % 5) * 0.35,
  alpha: 0.02 + (i % 4) * 0.018,
}))

export function TimelinePanel({
  activeWorkspaceTab,
  previewKind,
  previewUrl,
  previewPlaying,
  transportCurrentTime,
  transportTime,
  transportProgress,
  isPreviewMuted,
  onTogglePlayback,
  onSeek,
  onToggleMute,
  onSeekSeconds,
  onSplit,
  onRemoveSilence,
  durationSec = 0,
}: TimelinePanelProps) {
  const rulerCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const cinemaCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const soundEngineRef = React.useRef<LuxurySoundEngine | null>(null)

  const thumbnailVideoRef = React.useRef<HTMLVideoElement | null>(null)
  const thumbCanvasRef = React.useRef<HTMLCanvasElement | null>(null)

  // Physics & Scrubber state
  const [effectiveDuration, setEffectiveDuration] = React.useState<number>(durationSec > 0 ? durationSec : 220)
  const [currentTimeState, setCurrentTimeState] = React.useState<number>(87.0)
  const [targetTimeState, setTargetTimeState] = React.useState<number>(87.0)
  const [scrubVelocity, setScrubVelocity] = React.useState<number>(0)
  const [isDragging, setIsDragging] = React.useState<boolean>(false)
  const [snapToDetent, setSnapToDetent] = React.useState<boolean>(true)
  const [viewMode, setViewMode] = React.useState<'PURE' | 'CINEMA'>('PURE')
  const [timeFormat, setTimeFormat] = React.useState<TimeFormatMode>('COUNTER')
  const [audioProfileName, setAudioProfileName] = React.useState<string>('LEICA DETENT')
  const [activeChapterIndex, setActiveChapterIndex] = React.useState<number>(2)
  const [hoverTime, setHoverTime] = React.useState<number | null>(null)
  const [thumbTime, setThumbTime] = React.useState<number | null>(null)

  const isDraggingRef = React.useRef(false)
  const targetTimeRef = React.useRef(87.0)
  const currentTimeRef = React.useRef(87.0)
  const velocityRef = React.useRef(0)
  const lastPointerXRef = React.useRef(0)
  const dragStartXRef = React.useRef(0)
  const dragStartTimeRef = React.useRef(87.0)
  const lastTickIndexRef = React.useRef(Math.floor(87.0))
  const lastMinorTickIndexRef = React.useRef(Math.floor(87.0 * 2))

  const pixelsPerSecond = 128
  const scrubberDisabled = previewKind !== 'video' || !previewUrl

  // Sync external duration
  React.useEffect(() => {
    if (durationSec > 0) {
      setEffectiveDuration(durationSec)
    }
  }, [durationSec])

  // Sync external video transport time when not actively dragging
  React.useEffect(() => {
    if (isDraggingRef.current) return
    const dur = effectiveDuration > 0 ? effectiveDuration : 220
    const externalTime = (clamp01(transportProgress / 100)) * dur
    if (Math.abs(externalTime - targetTimeRef.current) > 0.45) {
      targetTimeRef.current = externalTime
      setTargetTimeState(externalTime)
    }
  }, [transportProgress, effectiveDuration])

  // Initialize Sound Engine
  React.useEffect(() => {
    const engine = new LuxurySoundEngine()
    soundEngineRef.current = engine
    engine.isArmed = !isPreviewMuted
    return () => {
      engine.destroy()
      soundEngineRef.current = null
    }
  }, [])

  // Sync mute state with sound engine
  React.useEffect(() => {
    if (soundEngineRef.current) {
      soundEngineRef.current.isArmed = !isPreviewMuted
    }
  }, [isPreviewMuted])

  // Emit seek to parent components
  const emitSeek = React.useCallback(
    (targetSec: number) => {
      const dur = effectiveDuration > 0 ? effectiveDuration : 220
      const clamped = Math.min(Math.max(0, targetSec), dur)
      if (onSeekSeconds) {
        onSeekSeconds(clamped)
      } else if (onSeek) {
        onSeek((clamped / dur) * 100)
      }
    },
    [effectiveDuration, onSeek, onSeekSeconds],
  )

  // Step frame precision (1 frame or 1 second)
  const stepFrame = React.useCallback(
    (direction: 1 | -1, coarse: boolean) => {
      if (scrubberDisabled) return
      soundEngineRef.current?.init()
      const step = coarse ? 1.0 : FRAME_STEP_SEC
      const dur = effectiveDuration > 0 ? effectiveDuration : 220
      const nextTime = Math.max(0, Math.min(dur, currentTimeRef.current + direction * step))
      targetTimeRef.current = nextTime
      setTargetTimeState(nextTime)
      soundEngineRef.current?.triggerTick(coarse, 1.1)
      emitSeek(nextTime)
    },
    [effectiveDuration, emitSeek, scrubberDisabled],
  )

  // Master Animation & Physics Loop (Canvas rendering + Spring physics + Procedural sound)
  React.useEffect(() => {
    let animId: number
    let lastFrameTime = performance.now()

    const animate = (now: number) => {
      const dt = Math.min((now - lastFrameTime) / 1000, 0.1)
      lastFrameTime = now
      const dur = effectiveDuration > 0 ? effectiveDuration : 220
      const sound = soundEngineRef.current

      // Advance target time if in Play mode
      if (previewPlaying && !isDraggingRef.current) {
        targetTimeRef.current += dt
        if (targetTimeRef.current >= dur) {
          targetTimeRef.current = dur
          if (onTogglePlayback) onTogglePlayback()
        }
      }

      // Smooth spring-damped interpolation (silky luxury inertia)
      const prevTime = currentTimeRef.current
      const damping = isDraggingRef.current ? 0.28 : (previewPlaying ? 0.38 : 0.14)
      currentTimeRef.current += (targetTimeRef.current - currentTimeRef.current) * damping
      if (currentTimeRef.current < 0) currentTimeRef.current = 0
      if (currentTimeRef.current > dur) currentTimeRef.current = dur

      // Compute instantaneous scrub velocity
      const instantVel = dt > 0 ? (currentTimeRef.current - prevTime) / dt : 0
      velocityRef.current = velocityRef.current * 0.8 + instantVel * 0.2
      const absVel = Math.abs(velocityRef.current)

      // Detect Major Tick Crossings (1.0s marks on ruler)
      const currentMajorTick = Math.floor(currentTimeRef.current + 0.02)
      if (currentMajorTick !== lastTickIndexRef.current) {
        const isChapter = DEFAULT_CHAPTERS.some((c) => c.time === currentMajorTick)
        if (sound) {
          sound.triggerTick(true, Math.max(0.6, absVel * 0.35))
          if (isChapter && absVel < 6) {
            sound.triggerChapterChime()
          }
        }
        lastTickIndexRef.current = currentMajorTick
      }

      // Detect Minor Sub-Detent Crossings during manual scrubbing
      const currentMinorTick = Math.floor(currentTimeRef.current * 2)
      if (currentMinorTick !== lastMinorTickIndexRef.current) {
        if (currentMinorTick % 2 !== 0 && absVel > 0.35 && !previewPlaying && sound) {
          sound.triggerTick(false, Math.max(0.4, absVel * 0.25))
        }
        lastMinorTickIndexRef.current = currentMinorTick
      }

      // Update continuous sub-bass & vinyl/reel friction sound
      if (sound) {
        sound.updateScrubVelocity(previewPlaying ? 0 : absVel)
      }

      // Update active chapter metadata
      let chapIdx = 0
      for (let i = DEFAULT_CHAPTERS.length - 1; i >= 0; i--) {
        if (currentTimeRef.current >= DEFAULT_CHAPTERS[i].time - 0.5) {
          chapIdx = i
          break
        }
      }
      setActiveChapterIndex(chapIdx)

      // Sync state readouts
      setCurrentTimeState(currentTimeRef.current)
      setScrubVelocity(absVel)

      // -------------------------------------------------------------
      // 1. RENDER OPTICAL RULER CANVAS (IMAGE 2 GEOMETRY)
      // -------------------------------------------------------------
      const rulerCanvas = rulerCanvasRef.current
      if (rulerCanvas) {
        const rulerCtx = rulerCanvas.getContext('2d')
        if (rulerCtx) {
          const width = rulerCanvas.width
          const height = rulerCanvas.height
          rulerCtx.clearRect(0, 0, width, height)

          const centerX = width / 2
          const centerY = height / 2
          const pps = pixelsPerSecond

          // Maximum visible radius before it fades into obsidian black
          const maxVisibleRadius = Math.min(width * 0.44, 560)
          const secondsVisible = Math.ceil(maxVisibleRadius / pps) + 2
          const centerSecFloor = Math.floor(currentTimeRef.current)
          const startSec = Math.max(0, centerSecFloor - secondsVisible)
          const endSec = Math.min(dur, centerSecFloor + secondsVisible)

          const tickGap = Math.max(7, pps * 0.075)
          const baseTickHeight = 28
          const barThickness = 2.6

          // Draw Horizontal Connector Segments (----) between tick i and i + 1
          for (let i = startSec; i < endSec; i++) {
            const x1 = centerX + (i - currentTimeRef.current) * pps
            const x2 = centerX + (i + 1 - currentTimeRef.current) * pps

            const segStartX = x1 + tickGap
            const segEndX = x2 - tickGap
            const segMidX = (segStartX + segEndX) * 0.5

            const distFromCenter = Math.abs(segMidX - centerX)
            if (distFromCenter > maxVisibleRadius) continue

            // Cosine falloff curve matching the reference vignette
            const normalizedDist = distFromCenter / maxVisibleRadius
            const falloff = Math.pow(Math.cos(normalizedDist * Math.PI * 0.5), 1.85)
            if (falloff <= 0.01) continue

            const distLeft = Math.min(1, Math.abs(segStartX - centerX) / maxVisibleRadius)
            const distRight = Math.min(1, Math.abs(segEndX - centerX) / maxVisibleRadius)
            const alphaLeft = Math.pow(Math.cos(distLeft * Math.PI * 0.5), 1.85) * 0.78
            const alphaRight = Math.pow(Math.cos(distRight * Math.PI * 0.5), 1.85) * 0.78

            const grad = rulerCtx.createLinearGradient(segStartX, centerY, segEndX, centerY)
            grad.addColorStop(0, `rgba(235, 235, 240, ${alphaLeft.toFixed(3)})`)
            grad.addColorStop(1, `rgba(235, 235, 240, ${alphaRight.toFixed(3)})`)

            rulerCtx.fillStyle = grad
            rulerCtx.beginPath()
            if (typeof rulerCtx.roundRect === 'function') {
              rulerCtx.roundRect(segStartX, centerY - barThickness / 2, segEndX - segStartX, barThickness, 1)
            } else {
              rulerCtx.rect(segStartX, centerY - barThickness / 2, segEndX - segStartX, barThickness)
            }
            rulerCtx.fill()
          }

          // Draw Vertical Tick Marks (|) at each second
          for (let i = startSec; i <= endSec; i++) {
            const tickX = centerX + (i - currentTimeRef.current) * pps
            const distFromCenter = Math.abs(tickX - centerX)
            if (distFromCenter > maxVisibleRadius) continue

            const normalizedDist = distFromCenter / maxVisibleRadius
            const falloff = Math.pow(Math.cos(normalizedDist * Math.PI * 0.5), 1.75)
            if (falloff <= 0.01) continue

            // Proximity boost when crossing playhead
            const centerProximity = Math.max(0, 1 - distFromCenter / (pps * 0.65))
            const isChapterTick = DEFAULT_CHAPTERS.some((c) => c.time === i)

            const tickWidth = 2.6 + centerProximity * 0.9
            const tickHeight = baseTickHeight + centerProximity * 4 + (isChapterTick ? 4 : 0)
            const alpha = Math.min(1, falloff * 0.82 + centerProximity * 0.25)

            rulerCtx.save()

            // Optical center glow on active tick
            if (centerProximity > 0.25) {
              rulerCtx.shadowColor = isChapterTick ? 'rgba(235, 210, 175, 0.85)' : 'rgba(255, 255, 255, 0.75)'
              rulerCtx.shadowBlur = 14 * centerProximity
            }

            if (isChapterTick) {
              rulerCtx.fillStyle = `rgba(238, 224, 200, ${alpha.toFixed(3)})`
            } else {
              rulerCtx.fillStyle = `rgba(245, 245, 248, ${alpha.toFixed(3)})`
            }

            rulerCtx.beginPath()
            if (typeof rulerCtx.roundRect === 'function') {
              rulerCtx.roundRect(tickX - tickWidth / 2, centerY - tickHeight / 2, tickWidth, tickHeight, 1)
            } else {
              rulerCtx.rect(tickX - tickWidth / 2, centerY - tickHeight / 2, tickWidth, tickHeight)
            }
            rulerCtx.fill()

            // Diamond/dot indicator above chapter cues
            if (isChapterTick && falloff > 0.15) {
              rulerCtx.fillStyle = `rgba(212, 197, 177, ${(falloff * 0.75).toFixed(3)})`
              rulerCtx.beginPath()
              rulerCtx.arc(tickX, centerY - tickHeight / 2 - 7, 2, 0, Math.PI * 2)
              rulerCtx.fill()
            }

            rulerCtx.restore()
          }
        }
      }

      // -------------------------------------------------------------
      // 2. RENDER CINEMA BACKDROP / PURE VIGNETTE CANVAS
      // -------------------------------------------------------------
      const cinemaCanvas = cinemaCanvasRef.current
      if (cinemaCanvas) {
        const cinemaCtx = cinemaCanvas.getContext('2d')
        if (cinemaCtx) {
          const sw = cinemaCanvas.width
          const sh = cinemaCanvas.height
          cinemaCtx.clearRect(0, 0, sw, sh)

          const cx = sw / 2
          const cy = sh / 2
          const curTime = currentTimeRef.current

          if (viewMode === 'PURE') {
            // Reference Image Mode: Deepest obsidian black with ultra-subtle optical center glow
            const glowRadius = Math.min(sw, sh) * 0.48
            const grad = cinemaCtx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius)
            const velBoost = Math.min(0.06, absVel * 0.008)
            grad.addColorStop(0, `rgba(255, 255, 255, ${(0.028 + velBoost).toFixed(4)})`)
            grad.addColorStop(0.5, 'rgba(18, 18, 22, 0.015)')
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

            cinemaCtx.fillStyle = grad
            cinemaCtx.fillRect(0, 0, sw, sh)
          } else {
            // CINEMA PREVIEW MODE: Procedural Anamorphic Bokeh & Flares
            const currentChap = DEFAULT_CHAPTERS[chapIdx] || DEFAULT_CHAPTERS[0]
            const hue = currentChap.hue

            // Anamorphic horizon flare
            const flareGrad = cinemaCtx.createRadialGradient(
              cx + Math.sin(curTime * 0.15) * 120,
              cy,
              10,
              cx,
              cy,
              Math.max(sw, sh) * 0.55,
            )
            flareGrad.addColorStop(0, `hsla(${hue}, 38%, 55%, 0.14)`)
            flareGrad.addColorStop(0.35, `hsla(${hue}, 30%, 25%, 0.06)`)
            flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
            cinemaCtx.fillStyle = flareGrad
            cinemaCtx.fillRect(0, 0, sw, sh)

            // Scrub-reactive bokeh particles
            BOKEH_PARTICLES.forEach((p) => {
              const rawX = ((p.seed * 140 + curTime * 95 * p.speed) % (sw + 400)) - 200
              const x = rawX < -200 ? rawX + sw + 400 : rawX
              const y = sh * p.yRatio + Math.sin(curTime * 0.4 + p.seed) * 28
              const stretchX = p.radius + absVel * 14 * p.speed

              const pGrad = cinemaCtx.createRadialGradient(x, y, 0, x, y, stretchX)
              pGrad.addColorStop(0, `hsla(${hue}, 45%, 78%, ${p.alpha * 1.6})`)
              pGrad.addColorStop(0.5, `hsla(${hue}, 35%, 52%, ${p.alpha * 0.6})`)
              pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

              cinemaCtx.save()
              cinemaCtx.translate(x, y)
              cinemaCtx.scale(1 + Math.min(3.5, absVel * 0.18), 0.65)
              cinemaCtx.translate(-x, -y)
              cinemaCtx.fillStyle = pGrad
              cinemaCtx.beginPath()
              cinemaCtx.arc(x, y, stretchX, 0, Math.PI * 2)
              cinemaCtx.fill()
              cinemaCtx.restore()
            })
          }
        }
      }

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [effectiveDuration, onTogglePlayback, pixelsPerSecond, previewPlaying, viewMode])

  // Canvas Resize Observer
  React.useEffect(() => {
    const handleResize = () => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const container = containerRef.current
      if (!container) return

      const width = container.clientWidth
      const height = 128

      if (rulerCanvasRef.current) {
        rulerCanvasRef.current.width = width * dpr
        rulerCanvasRef.current.height = height * dpr
        const ctx = rulerCanvasRef.current.getContext('2d')
        if (ctx) ctx.scale(dpr, dpr)
      }

      if (cinemaCanvasRef.current) {
        cinemaCanvasRef.current.width = width * dpr
        cinemaCanvasRef.current.height = (height + 80) * dpr
        const ctx = cinemaCanvasRef.current.getContext('2d')
        if (ctx) ctx.scale(dpr, dpr)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scrub interaction handlers
  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scrubberDisabled) return
      soundEngineRef.current?.init()
      e.currentTarget.setPointerCapture(e.pointerId)
      isDraggingRef.current = true
      setIsDragging(true)
      lastPointerXRef.current = e.clientX
      dragStartXRef.current = e.clientX
      dragStartTimeRef.current = targetTimeRef.current
    },
    [scrubberDisabled],
  )

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scrubberDisabled) return
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const dur = effectiveDuration > 0 ? effectiveDuration : 220
      const hoverSec = Math.max(0, Math.min(dur, currentTimeRef.current + (clickX - rect.width / 2) / pixelsPerSecond))
      setHoverTime(hoverSec)

      if (isDraggingRef.current) {
        const deltaX = e.clientX - lastPointerXRef.current
        lastPointerXRef.current = e.clientX

        const timeDelta = -deltaX / pixelsPerSecond
        const nextTime = Math.max(0, Math.min(dur, targetTimeRef.current + timeDelta))
        targetTimeRef.current = nextTime
        setTargetTimeState(nextTime)
        emitSeek(nextTime)
      }
    },
    [effectiveDuration, emitSeek, pixelsPerSecond, scrubberDisabled],
  )

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      isDraggingRef.current = false
      setIsDragging(false)

      const dur = effectiveDuration > 0 ? effectiveDuration : 220
      if (snapToDetent) {
        const snappedTime = Math.max(0, Math.min(dur, Math.round(targetTimeRef.current)))
        targetTimeRef.current = snappedTime
        setTargetTimeState(snappedTime)
        soundEngineRef.current?.triggerTick(true, 1.4)
        emitSeek(snappedTime)
      } else {
        emitSeek(targetTimeRef.current)
      }
    },
    [effectiveDuration, emitSeek, snapToDetent],
  )

  const handlePointerLeave = React.useCallback(() => {
    if (!isDraggingRef.current) setHoverTime(null)
  }, [])

  // Wheel scrub support
  const handleWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (scrubberDisabled) return
      soundEngineRef.current?.init()
      const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const dur = effectiveDuration > 0 ? effectiveDuration : 220
      const timeDelta = (rawDelta / pixelsPerSecond) * 0.4
      const nextTime = Math.max(0, Math.min(dur, targetTimeRef.current + timeDelta))
      targetTimeRef.current = nextTime
      setTargetTimeState(nextTime)
      emitSeek(nextTime)
    },
    [effectiveDuration, emitSeek, pixelsPerSecond, scrubberDisabled],
  )

  // Keyboard navigation shortcuts
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (scrubberDisabled) return
      const coarse = e.shiftKey
      const dur = effectiveDuration > 0 ? effectiveDuration : 220

      switch (e.key) {
        case ' ':
          e.preventDefault()
          onTogglePlayback()
          break
        case 'ArrowLeft':
        case '[':
          e.preventDefault()
          stepFrame(-1, coarse)
          break
        case 'ArrowRight':
        case ']':
          e.preventDefault()
          stepFrame(1, coarse)
          break
        case 'Home':
          e.preventDefault()
          targetTimeRef.current = 0
          setTargetTimeState(0)
          emitSeek(0)
          break
        case 'End':
          e.preventDefault()
          targetTimeRef.current = dur
          setTargetTimeState(dur)
          emitSeek(dur)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          onToggleMute()
          break
        case 's':
        case 'S':
          e.preventDefault()
          if (onSplit) onSplit(currentTimeRef.current)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          setAudioProfileName(soundEngineRef.current?.cycleProfile() || 'LEICA DETENT')
          break
      }
    },
    [currentTimeRef, effectiveDuration, emitSeek, onSplit, onToggleMute, onTogglePlayback, scrubberDisabled, stepFrame],
  )

  // Thumbnail frame preview logic
  React.useEffect(() => {
    if (hoverTime === null) return
    const timeout = window.setTimeout(() => setThumbTime(hoverTime), 40)
    return () => window.clearTimeout(timeout)
  }, [hoverTime])

  React.useEffect(() => {
    const video = thumbnailVideoRef.current
    const canvas = thumbCanvasRef.current
    if (!video || !canvas || thumbTime === null) return
    let cancelled = false
    const draw = () => {
      if (cancelled) return
      const ctx = canvas.getContext('2d')
      if (!ctx || video.videoWidth === 0) return
      ctx.drawImage(video, 0, 0, THUMB_WIDTH, THUMB_HEIGHT)
    }
    if (Math.abs(video.currentTime - thumbTime) < 0.033 && video.readyState >= 2) {
      draw()
      return
    }
    video.addEventListener('seeked', draw, { once: true })
    video.currentTime = thumbTime
    return () => {
      cancelled = true
      video.removeEventListener('seeked', draw)
    }
  }, [thumbTime])

  // Timecode formatting helper
  const formatTimecode = React.useCallback(
    (seconds: number, mode: TimeFormatMode): string => {
      const dur = effectiveDuration > 0 ? effectiveDuration : 220
      const clamped = Math.max(0, Math.min(dur, seconds))
      const mins = Math.floor(clamped / 60)
      const secs = Math.floor(clamped % 60)
      const tenths = Math.floor((clamped % 1) * 10)

      const mStr = String(mins).padStart(2, '0')
      const sStr = String(secs).padStart(2, '0')

      if (mode === 'MM:SS') {
        return `${mStr}:${sStr}`
      } else if (mode === 'MM:SS.d') {
        return `${mStr}:${sStr}.${tenths}`
      } else {
        // Continuous 4-digit cinema counter readout (matching the "1277" reference image)
        const deciseconds = Math.floor(clamped * 10) + 1200
        return String(deciseconds).slice(-4)
      }
    },
    [effectiveDuration],
  )

  if (activeWorkspaceTab === 'Music') return null

  const currentChapter = DEFAULT_CHAPTERS[activeChapterIndex] || DEFAULT_CHAPTERS[0]
  const currentFrame = Math.floor(currentTimeState * 24)

  return (
    <div
      ref={containerRef}
      tabIndex={scrubberDisabled ? -1 : 0}
      role="slider"
      data-action="seek-scrubber"
      data-autonomous-target="timeline-scrubber"
      aria-label="Timeline scrubber"
      aria-valuemin={0}
      aria-valuemax={Math.round(effectiveDuration * 1000)}
      aria-valuenow={Math.round(currentTimeState * 1000)}
      aria-valuetext={formatTimecode(currentTimeState, 'MM:SS.d')}
      aria-disabled={scrubberDisabled}
      onKeyDown={handleKeyDown}
      className={`group relative w-full select-none overflow-hidden rounded-2xl border border-white/5 bg-[#020202] text-white shadow-[0_28px_80px_rgba(0,0,0,0.95)] transition-all ${
        scrubberDisabled ? 'opacity-40 pointer-events-none' : 'opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/40'
      }`}
    >
      {/* Background Procedural Cinema Canvas */}
      <canvas
        ref={cinemaCanvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full z-0 opacity-85 transition-opacity duration-700"
      />

      {/* Deep Edge Vignette & Film Grain Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 [background:radial-gradient(circle_at_50%_50%,transparent_18%,rgba(2,2,2,0.72)_58%,#000000_92%),linear-gradient(90deg,#000000_0%,transparent_24%,transparent_76%,#000000_100%),linear-gradient(180deg,#000000_0%,transparent_25%,transparent_75%,#000000_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-full h-[300%] w-[300%] z-20 opacity-[0.038] [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%270_0_200_200%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter_id=%27noiseFilter%27%3E%3CfeTurbulence_type=%27fractalNoise%27_baseFrequency=%270.85%27_numOctaves=%273%27_stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect_width=%27100%25%27_height=%27100%25%27_filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')]"
      />

      {/* Top Luxury Minimalist HUD */}
      <header className="relative z-30 flex items-center justify-between px-6 pt-5 pb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="size-2 rounded-full bg-amber-200/80 shadow-[0_0_10px_rgba(253,230,138,0.8)] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/80">
              REEL // 04-CHRONO
            </span>
          </div>
          <span className="hidden sm:inline-block text-white/20 text-xs">|</span>
          <span className="hidden sm:inline-block font-mono text-[10px] tracking-[0.2em] text-white/40">
            24.00 FPS • RAW ANAMORPHIC
          </span>
        </div>

        {/* View Mode & Audio Controls */}
        <div className="flex items-center space-x-2">
          {/* Mode Toggle */}
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'PURE' ? 'CINEMA' : 'PURE'))}
            className="flex items-center space-x-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 transition-all hover:border-white/25 hover:bg-white/[0.08]"
            title="Toggle between Pure Black Reference Vignette & Procedural Cinema Backdrop"
          >
            <span>VIGNETTE:</span>
            <span className="text-amber-100/90">{viewMode}</span>
          </button>

          {/* Sound Profile Selector */}
          <button
            type="button"
            onClick={() => {
              if (soundEngineRef.current) {
                setAudioProfileName(soundEngineRef.current.cycleProfile())
              }
            }}
            className="hidden md:flex items-center space-x-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 transition-all hover:border-white/25 hover:bg-white/[0.08]"
            title="Switch Procedural Sound FX Profile"
          >
            <span>FX:</span>
            <span className="text-amber-100/90">{audioProfileName}</span>
          </button>

          {/* Audio Arm / Mute Button */}
          <button
            type="button"
            data-action="toggle-mute"
            data-autonomous-target="mute"
            onClick={onToggleMute}
            aria-label={isPreviewMuted ? 'Unmute preview' : 'Mute preview'}
            title={isPreviewMuted ? 'Unmute (M)' : 'Mute (M)'}
            className={`flex items-center space-x-2 rounded-full border px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-all ${
              !isPreviewMuted
                ? 'border-amber-200/40 bg-amber-200/10 text-white shadow-[0_0_20px_rgba(253,230,138,0.15)]'
                : 'border-white/10 bg-white/[0.04] text-white/40 hover:text-white'
            }`}
          >
            <div className="flex items-end space-x-0.5 h-3">
              <span
                className={`w-[2px] transition-all duration-75 ${!isPreviewMuted ? 'bg-amber-200' : 'bg-white/30'}`}
                style={{ height: !isPreviewMuted ? `${Math.max(3, Math.min(12, 3 + scrubVelocity * 1.5))}px` : '2px' }}
              />
              <span
                className={`w-[2px] transition-all duration-75 ${!isPreviewMuted ? 'bg-amber-200' : 'bg-white/30'}`}
                style={{ height: !isPreviewMuted ? `${Math.max(4, Math.min(12, 6 + scrubVelocity * 2.2))}px` : '2px' }}
              />
              <span
                className={`w-[2px] transition-all duration-75 ${!isPreviewMuted ? 'bg-amber-200' : 'bg-white/30'}`}
                style={{ height: !isPreviewMuted ? `${Math.max(3, Math.min(12, 4 + scrubVelocity * 1.8))}px` : '2px' }}
              />
              <span
                className={`w-[2px] transition-all duration-75 ${!isPreviewMuted ? 'bg-amber-200' : 'bg-white/30'}`}
                style={{ height: !isPreviewMuted ? `${Math.max(2, Math.min(12, 2 + scrubVelocity * 1.2))}px` : '2px' }}
              />
            </div>
            <span>{!isPreviewMuted ? 'SFX ARMED' : 'MUTED'}</span>
          </button>
        </div>
      </header>

      {/* Center Interactive Scrubber Stage */}
      <main
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
        className={`relative z-25 flex flex-col items-center justify-center py-4 cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        {/* Subtle Chapter / Scene Header */}
        <div className="pointer-events-none mb-3 text-center transition-all duration-500">
          <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/40 mb-0.5">
            {currentChapter.act}
          </div>
          <h2 className="font-serif italic text-lg md:text-xl text-white/85 tracking-wide font-normal">
            {currentChapter.title}
          </h2>
        </div>

        {/* Primary Horizontal Ruler Canvas (Image 2 geometry + Sub-pixel glow) */}
        <div className="relative w-full h-24 flex items-center justify-center">
          <canvas ref={rulerCanvasRef} className="block w-full h-full" />

          {/* Hover Frame Thumbnail Preview */}
          {hoverTime !== null && (
            <div
              className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-lg border border-white/15 bg-black/90 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.8)] backdrop-blur-md"
              style={{
                left: `${clamp01((hoverTime / (effectiveDuration > 0 ? effectiveDuration : 220))) * 100}%`,
              }}
            >
              <canvas
                ref={thumbCanvasRef}
                width={THUMB_WIDTH}
                height={THUMB_HEIGHT}
                className="block h-[54px] w-[96px] rounded bg-black/60"
              />
              <div className="py-0.5 text-center font-mono text-[10px] tabular-nums text-white/80">
                {formatTimecode(hoverTime, 'MM:SS.d')}
              </div>
            </div>
          )}
        </div>

        {/* Primary Timecode Readout ("1277" exact reference styling) */}
        <div className="pointer-events-none mt-1 flex flex-col items-center">
          <div
            className="timecode-display font-mono text-2xl md:text-3xl text-white/95 font-normal tracking-[0.24em] pl-[0.24em]"
            style={{ textShadow: '0 0 24px rgba(255, 255, 255, 0.28)' }}
          >
            {formatTimecode(currentTimeState, timeFormat)}
          </div>

          {/* Sub-frame / Millisecond & Velocity Telemetry */}
          <div className="mt-1 flex items-center space-x-3 font-mono text-[10px] tracking-[0.25em] text-white/40">
            <span>FRM {String(currentFrame).padStart(5, '0')}</span>
            <span>•</span>
            <span>DUR {formatTimecode(effectiveDuration, 'MM:SS')}</span>
            <span>•</span>
            <span className="text-amber-200/60 font-semibold">{scrubVelocity.toFixed(1)}x</span>
          </div>
        </div>
      </main>

      {/* Bottom Luxury Transport & Controls Bar */}
      <footer className="relative z-30 flex flex-wrap items-center justify-between border-t border-white/5 bg-black/40 px-6 py-4 gap-3">
        {/* Left: Transport Buttons */}
        <div className="flex items-center space-x-2">
          {/* Play/Pause Button */}
          <button
            type="button"
            data-action="toggle-playback"
            data-autonomous-target="playback"
            onClick={onTogglePlayback}
            disabled={scrubberDisabled}
            aria-label={previewPlaying ? 'Pause preview' : 'Play preview'}
            title={previewPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/85 transition-all hover:border-white/25 hover:bg-white/[0.08] active:scale-95 disabled:opacity-30"
          >
            {previewPlaying ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current ml-0.5" />}
            <span>{previewPlaying ? 'PAUSE' : 'PLAY REEL'}</span>
          </button>

          {/* Step Back 1 Frame */}
          <button
            type="button"
            onClick={() => stepFrame(-1, false)}
            disabled={scrubberDisabled}
            aria-label="Step one frame back"
            title="Step back 1 frame (← or [)"
            className="flex size-7 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/20 hover:text-white disabled:opacity-20"
          >
            <ChevronLeft className="size-3.5" />
          </button>

          {/* Step Forward 1 Frame */}
          <button
            type="button"
            onClick={() => stepFrame(1, false)}
            disabled={scrubberDisabled}
            aria-label="Step one frame forward"
            title="Step forward 1 frame (→ or ])"
            className="flex size-7 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/20 hover:text-white disabled:opacity-20"
          >
            <ChevronRight className="size-3.5" />
          </button>

          {/* Magnetic Detent Snap Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngineRef.current?.init()
              soundEngineRef.current?.triggerTick(false, 0.8)
              setSnapToDetent((prev) => !prev)
            }}
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-all ${
              snapToDetent
                ? 'border-amber-200/40 bg-amber-200/10 text-white'
                : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white'
            }`}
            title="Toggle magnetic detent snapping to major tick intervals"
          >
            {snapToDetent ? 'SNAP: DETENT' : 'SNAP: FREE'}
          </button>

          {/* Timecode Format Toggle ("1277" vs "MM:SS") */}
          <button
            type="button"
            onClick={() => {
              soundEngineRef.current?.init()
              soundEngineRef.current?.triggerTick(false, 0.8)
              const modes: TimeFormatMode[] = ['COUNTER', 'MM:SS', 'MM:SS.d']
              const nextIndex = (modes.indexOf(timeFormat) + 1) % modes.length
              setTimeFormat(modes[nextIndex])
            }}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 transition-all hover:border-white/25 hover:text-white"
            title="Switch between Counter (1277), MM:SS, and Sub-second format"
          >
            FMT: {timeFormat}
          </button>
        </div>

        {/* Center: Tactile Instruction Hint */}
        <div className="hidden xl:block font-mono text-[9px] uppercase tracking-[0.26em] text-white/30 text-center">
          DRAG HORIZONTALLY • SCROLL WHEEL • KEYS [ ] • SPACE TO PLAY
        </div>

        {/* Right: Editorial Actions (Split clip, silence cut, chapters) */}
        <div className="flex items-center space-x-1.5">
          {/* Split Clip Button */}
          <button
            type="button"
            data-action="split-cut"
            data-autonomous-target="split"
            aria-label="Split clip at playhead"
            title="Split clip at playhead (S)"
            onClick={() => {
              if (onSplit) onSplit(currentTimeRef.current)
              else if (onSeekSeconds) onSeekSeconds(currentTimeRef.current)
              soundEngineRef.current?.triggerTick(true, 1.8)
            }}
            className="flex items-center space-x-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/70 transition-all hover:border-white/25 hover:text-white"
          >
            <Scissors className="size-3" />
            <span className="hidden sm:inline">SPLIT</span>
          </button>

          {/* Remove Silence Cuts Button */}
          <button
            type="button"
            data-action="remove-silence"
            data-autonomous-target="silence-cut"
            onClick={onRemoveSilence}
            disabled={scrubberDisabled || !onRemoveSilence}
            aria-label="Remove transcript-detected silences"
            title="Remove transcript-detected silences"
            className="flex items-center space-x-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/70 transition-all hover:border-white/25 hover:text-white disabled:opacity-20"
          >
            <AudioLines className="size-3" />
            <span className="hidden sm:inline">SILENCE</span>
          </button>

          {/* Chapter Jump Cues */}
          <div className="hidden sm:flex items-center space-x-1">
            {DEFAULT_CHAPTERS.map((chap, idx) => (
              <button
                key={chap.id}
                type="button"
                onClick={() => {
                  soundEngineRef.current?.init()
                  targetTimeRef.current = chap.time
                  setTargetTimeState(chap.time)
                  soundEngineRef.current?.triggerChapterChime()
                  emitSeek(chap.time)
                }}
                className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-all ${
                  idx === activeChapterIndex
                    ? 'border border-amber-200/40 bg-amber-200/15 text-white font-semibold'
                    : 'border border-white/5 bg-white/[0.02] text-white/40 hover:text-white'
                }`}
                title={`${chap.title} (${formatTimecode(chap.time, 'MM:SS')})`}
              >
                CH.{chap.id}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Hidden Video element for background thumbnail extraction */}
      {previewKind === 'video' && previewUrl && (
        <video
          ref={thumbnailVideoRef}
          src={previewUrl}
          muted
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          aria-hidden="true"
          className="pointer-events-none absolute size-0 overflow-hidden opacity-0"
        />
      )}
    </div>
  )
}
