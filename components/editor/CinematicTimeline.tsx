'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Film, 
  Music, 
  Zap, 
  Type, 
  Sparkles, 
  Play, 
  Pause, 
  Plus, 
  ChevronRight, 
  X,
  Layers,
  Scissors,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { useEditor, SavedSegment } from './EditorContext'
import { useDeviceTier } from '@/hooks/useDeviceTier'
import { cn } from '@/lib/utils'
import gsap from 'gsap'

const TRACK_HEIGHT = 52
const MIN_ZOOM = 4
const MAX_ZOOM = 40

export interface CinematicTimelineProps {
  initialZoom?: number
}

const TRACKS = [
  { id: 'video', label: 'Video', icon: Film, color: 'var(--track-video)' },
  { id: 'audio', label: 'Audio', icon: Music, color: 'var(--track-audio)' },
  { id: 'motion', label: 'Motion', icon: Zap, color: 'var(--track-motion)' },
  { id: 'text', label: 'Text', icon: Type, color: 'var(--track-text)' },
  { id: 'effects', label: 'Effects', icon: Sparkles, color: 'var(--chrome-dim)' },
]

export const CinematicTimeline: React.FC<CinematicTimelineProps> = ({ initialZoom = 10 }) => {
  const { 
    currentTime, 
    duration, 
    setCurrentTime, 
    isPlaying, 
    setIsPlaying,
    selection,
    setSelection,
    clearSelection,
    saveSegment,
    savedSegments,
    removeSavedSegment,
    segments
  } = useEditor()

  const tier = useDeviceTier()
  const isLowTier = tier === 'low'

  const [zoom, setZoom] = useState(initialZoom) // pixels per second

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)))
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<number | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null)

  // Update playhead position with GSAP for smoothness
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!playheadRef.current) return
    gsap.set(playheadRef.current, {
      x: 72 + (currentTime * zoom)
    })
    
    if (!isLowTier) {
      gsap.fromTo(playheadRef.current,
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: "top", duration: 0.6, ease: "back.out(1.7)" }
      )
    }
  }, [])

  useEffect(() => {
    if (!playheadRef.current) return
    gsap.to(playheadRef.current, {
      x: currentTime * zoom + 72, // 72 is track header width
      duration: isLowTier ? 0 : 0.1, // Instant jump on low tier
      ease: 'none'
    })
  }, [currentTime, zoom, isLowTier])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.shiftKey) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left - 72 + containerRef.current!.scrollLeft
      const time = Math.max(0, x / zoom)
      setIsSelecting(true)
      setSelectionStart(time)
      setSelectionEnd(time)
    } else {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left - 72 + containerRef.current!.scrollLeft
      setCurrentTime(Math.max(0, Math.min(x / zoom, duration)))
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isSelecting && selectionStart !== null) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left - 72 + containerRef.current!.scrollLeft
      setSelectionEnd(Math.max(0, Math.min(x / zoom, duration)))
    }
  }

  const handlePointerUp = () => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd)
      const end = Math.max(selectionStart, selectionEnd)
      
      if (end - start > 0.1) {
        setSelection({
          startTime: start,
          endTime: end,
          startX: start * zoom + 72,
          endX: end * zoom + 72
        })
        
        // GSAP appearance animation
        setTimeout(() => {
          gsap.fromTo(".segment-marquee", 
            { opacity: 0, scaleX: 0.8, transformOrigin: "left center" },
            { opacity: 1, scaleX: 1, duration: 0.3, ease: "power2.out" }
          )
        }, 0)
      }
      setIsSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
    }
  }

  const handleSaveSegment = () => {
    if (!selection) return
    const newSegment: SavedSegment = {
      id: `seg-${Date.now()}`,
      startTime: selection.startTime,
      endTime: selection.endTime,
      note: 'New iteration segment',
      priority: 'Medium'
    }
    
    // GSAP save animation
    gsap.to(".segment-marquee", {
      scale: 0.95, opacity: 0, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        saveSegment(newSegment)
        setTimeout(() => {
          gsap.from(".saved-chip", {
            scale: 0.8, y: 20, opacity: 0, duration: 0.4, ease: "back.out(1.5)"
          })
        }, 0)
      }
    })
  }

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60)
    const ms = Math.floor((s % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col w-full">
      {/* Iteration Rail */}
      <div className="flex items-center gap-3 px-6 py-3 overflow-x-auto [scrollbar-width:none] h-14 bg-void">
        <div className="flex items-center gap-2 mr-4">
          <Layers className="size-3 text-white/30" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Iterations</span>
        </div>
        <AnimatePresence>
          {savedSegments.map((seg) => (
            <motion.div
              key={seg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="saved-chip group"
              onClick={() => setCurrentTime(seg.startTime)}
            >
              <div className="size-1.5 rounded-full bg-accent-green shadow-[0_0_8px_var(--accent-green)]" />
              <span>{formatTime(seg.startTime)}–{formatTime(seg.endTime)}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); removeSavedSegment(seg.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
              >
                <X className="size-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {savedSegments.length === 0 && (
          <span className="text-[11px] italic text-white/10">No iterations saved. Shift+Drag to select ranges.</span>
        )}
      </div>

      {/* Main Timeline */}
      <div 
        ref={containerRef}
        className="timeline-container relative w-full select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="time-ruler">
          {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
            i % 5 === 0 && (
              <div 
                key={i} 
                className="absolute" 
                style={{ left: i * zoom + 72 }}
              >
                <div className="h-2 w-px bg-white/10 mb-1" />
                <span>{i}s</span>
              </div>
            )
          ))}
        </div>

        {TRACKS.map((track) => (
          <div key={track.id} className={cn("track-lane", `track-${track.id}`)}>
            <div className="track-header">
              <track.icon className="size-3" style={{ color: track.color }} />
              <span>{track.label}</span>
            </div>
            {/* Mock clips for visualization */}
            {track.id === 'video' && (
              <div 
                className="track-clip" 
                style={{ left: 10 * zoom + 72, width: 45 * zoom }}
              >
                Source Clip Alpha
              </div>
            )}
            {track.id === 'audio' && (
              <div 
                className="track-clip" 
                style={{ left: 5 * zoom + 72, width: 60 * zoom }}
              >
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:4px_4px]" />
                Cinematic Bed.wav
              </div>
            )}
          </div>
        ))}

        {/* Playhead */}
        <div ref={playheadRef} className="playhead" />

        {/* Selection Marquee */}
        <div 
          className="segment-marquee"
          style={{
            opacity: (isSelecting || selection) ? 1 : 0,
            pointerEvents: (isSelecting || selection) ? 'auto' : 'none',
            left: isSelecting && selectionStart !== null && selectionEnd !== null
              ? Math.min(selectionStart, selectionEnd) * zoom + 72
              : selection?.startX || 0,
            width: isSelecting && selectionStart !== null && selectionEnd !== null
              ? Math.abs(selectionEnd - selectionStart) * zoom
              : (selection ? (selection.endTime - selection.startTime) * zoom : 0)
          }}
        >
          {/* Handles */}
          <div className="marquee-handle left-0" />
          <div className="marquee-handle right-0 translate-x-[100%]" />
          
          {/* Floating Action Bar */}
          {!isSelecting && selection && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1 glass-panel bg-void/80 backdrop-blur-xl border-accent-blue/30"
            >
              <button 
                onClick={handleSaveSegment}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-green hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="size-3" /> Save Segment
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-cyan hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Play className="size-3 fill-current" /> Preview Loop
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button 
                onClick={clearSelection}
                className="p-1.5 text-white/40 hover:text-white transition-colors"
              >
                <X className="size-3" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Timeline Toolbar */}
      <div className="flex items-center justify-between px-6 h-12 border-t border-white/5 bg-surface">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="size-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
            </button>
            <div className="flex flex-col leading-none">
              <span className="font-mono text-xs font-bold text-white">{formatTime(currentTime)}</span>
              <span className="font-mono text-[9px] text-white/30 uppercase tracking-tighter">Current</span>
            </div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-4">
             <button className="text-white/40 hover:text-white transition-colors"><Scissors className="size-4" /></button>
             <button className="text-white/40 hover:text-white transition-colors"><Layers className="size-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
            <button onClick={() => adjustZoom(-2)} className="p-1 hover:text-white text-white/40 transition-colors">
              <ZoomOut className="size-3" />
            </button>
            <span className="text-[10px] font-mono text-white/60 w-8 text-center">{zoom}px</span>
            <button onClick={() => adjustZoom(2)} className="p-1 hover:text-white text-white/40 transition-colors">
              <ZoomIn className="size-3" />
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-green/30 bg-accent-green/5 text-accent-green text-[11px] font-bold uppercase tracking-widest hover:bg-accent-green/10 transition-colors group">
            Analyze Iterations
            <span className="bg-accent-green text-void px-1.5 rounded-full text-[9px] group-hover:scale-110 transition-transform">
              {savedSegments.length}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
