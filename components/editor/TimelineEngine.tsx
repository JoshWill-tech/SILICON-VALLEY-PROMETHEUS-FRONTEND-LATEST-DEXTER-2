'use client'

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, X } from 'lucide-react'
import { useEditor } from './EditorContext'
import { useThumbnails } from '@/lib/timeline/useThumbnails'
import { findNearestSnap, type SnapPoint } from '@/lib/timeline/snap-engine'

const TRACK_HEIGHT = 80
const MARKER_COLOR = 'rgba(255,255,255,0.25)'
const TRACK_BG = 'rgba(255,255,255,0.03)'
const SELECTION_FILL = 'rgba(0, 240, 255, 0.12)'
const SELECTION_STROKE = 'rgba(0, 240, 255, 0.6)'
const HANDLE_COLOR = '#00f0ff'

export const TimelineEngine: React.FC = () => {
  const { duration, selection, setSelection, setShowCommandBubble, segments, projectId } = useEditor()
  const [zoomScale, setZoomScale] = useState(1.0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const thumbnails = useThumbnails(projectId)
  
  const stateRef = useRef({
    isDragging: false,
    startX: 0,
    currentX: 0,
    startTime: 0,
    currentTime: 0,
  })
  
  const rafRef = useRef<number>(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // Snap points from segment boundaries
  const snapPoints = useMemo<SnapPoint[]>(() => {
    const points: SnapPoint[] = []
    segments.forEach(seg => {
      points.push({ timeMs: seg.startTime * 1000, type: 'start', strength: 1.0 })
      points.push({ timeMs: seg.endTime * 1000, type: 'end', strength: 1.0 })
    })
    return points
  }, [segments])

  const timeToPixel = useCallback((timeMs: number) => {
    return (timeMs / 1000) * 100 * zoomScale - scrollOffset
  }, [zoomScale, scrollOffset])

  const pixelToTime = useCallback((pixel: number) => {
    return ((pixel + scrollOffset) / (100 * zoomScale)) * 1000
  }, [zoomScale, scrollOffset])

  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDesktop(window.innerWidth >= 1024)
      const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth === 0) return
    
    // Zoom & Scroll Handlers
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoomScale(prev => Math.min(10.0, Math.max(0.1, prev * delta)))
      } else {
        setScrollOffset(prev => Math.max(0, prev + e.deltaX))
      }
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [containerWidth])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth === 0) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = containerWidth * dpr
    canvas.height = TRACK_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    const drawSegment = (ctx: CanvasRenderingContext2D, segment: any) => {
      const x = timeToPixel(segment.startTime * 1000)
      const width = (segment.endTime - segment.startTime) * 100 * zoomScale
      const y = 20
      const height = 40

      ctx.save()
      ctx.beginPath()
      // @ts-ignore - roundRect might not be in all types yet
      if (ctx.roundRect) ctx.roundRect(x, y, width, height, 8)
      else ctx.rect(x, y, width, height)
      ctx.clip()

      // Background
      ctx.fillStyle = 'rgba(0, 240, 255, 0.06)'
      ctx.fillRect(x, y, width, height)

      // Thumbnails
      const thumbWidth = 80 * zoomScale
      const numThumbs = Math.ceil(width / thumbWidth)
      for (let i = 0; i < numThumbs; i++) {
        const timeMs = (segment.startTime * 1000) + (i * (1000 / zoomScale))
        const img = thumbnails.getImage(timeMs)
        if (img) {
          ctx.drawImage(img, x + (i * thumbWidth), y, thumbWidth, height)
        }
      }

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()
      
      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '9px monospace'
      ctx.fillText(segment.label, x + 5, y + height - 5)
    }

    const draw = () => {
      const w = containerWidth
      const h = TRACK_HEIGHT
      ctx.clearRect(0, 0, w, h)

      // Time Markers
      ctx.fillStyle = MARKER_COLOR
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      
      const pixelsPerSecond = 100 * zoomScale
      const step = zoomScale < 0.5 ? 5 : 1
      const count = Math.ceil(duration / step)
      
      for (let i = 0; i <= count; i++) {
        const t = i * step
        const x = timeToPixel(t * 1000)
        if (x < 0 || x > w) continue

        const mins = Math.floor(t / 60)
        const secs = t % 60
        const label = `${mins}:${secs.toString().padStart(2, '0')}`
        ctx.fillRect(x, 20, 1, i % 5 === 0 ? 12 : 6)
        if (i % 5 === 0) ctx.fillText(label, x, 14)
      }

      // Draw Segments
      segments.forEach(seg => drawSegment(ctx, seg))

      // Selection / Dragging
      const s = stateRef.current
      if (s.isDragging) {
        const snap = findNearestSnap(s.currentTime * 1000, snapPoints, zoomScale)
        const drawX = snap ? timeToPixel(snap.timeMs) : s.currentX
        
        if (snap) {
          ctx.strokeStyle = "rgba(0,255,136,0.6)"
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(drawX, 0)
          ctx.lineTo(drawX, h)
          ctx.stroke()
          ctx.setLineDash([])
        }

        if (Math.abs(s.currentX - s.startX) > 4) {
          const selX = Math.min(s.startX, drawX)
          const selW = Math.abs(drawX - s.startX)
          ctx.fillStyle = SELECTION_FILL
          ctx.fillRect(selX, 20, selW, 40)
          ctx.strokeStyle = SELECTION_STROKE
          ctx.lineWidth = 1
          ctx.strokeRect(selX, 20, selW, 40)
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [containerWidth, duration, zoomScale, scrollOffset, segments, thumbnails, snapPoints, timeToPixel])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const time = pixelToTime(x) / 1000
    stateRef.current = { isDragging: true, startX: x, currentX: x, startTime: time, currentTime: time }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pixelToTime])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current
    if (!s.isDragging) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    s.currentX = x
    s.currentTime = pixelToTime(x) / 1000
  }, [pixelToTime])

  const handlePointerUp = useCallback(() => {
    const s = stateRef.current
    if (!s.isDragging) return
    s.isDragging = false
    
    const snap = findNearestSnap(s.currentTime * 1000, snapPoints, zoomScale)
    const finalTime = snap ? snap.timeMs / 1000 : s.currentTime
    
    const minTime = Math.min(s.startTime, finalTime)
    const maxTime = Math.max(s.startTime, finalTime)
    
    if (maxTime - minTime > 0.1) {
      setSelection({
        startTime: minTime,
        endTime: maxTime,
        startX: Math.min(s.startX, timeToPixel(finalTime * 1000)),
        endX: Math.max(s.startX, timeToPixel(finalTime * 1000)),
      })
    }
  }, [setSelection, snapPoints, zoomScale, timeToPixel])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    const ms = Math.floor((s % 1) * 100)
    return `${m}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  if (!isDesktop) return null;

  return (
    <div className="timeline-container w-full border-t border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 h-10 border-b border-white/[0.04]">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/40">Motion Timeline</span>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-white/5 border border-white/10">
            <span className="text-[10px] font-mono text-white/30 italic">Zoom: {(zoomScale * 100).toFixed(0)}%</span>
          </div>
        </div>
        <AnimatePresence>
          {selection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <span className="text-[11px] font-mono text-cyan-400">
                {formatTime(selection.startTime)} — {formatTime(selection.endTime)}
              </span>
              <button
                onClick={() => setShowCommandBubble(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-400 text-[11px] font-medium hover:bg-cyan-500/25 transition-colors active:scale-95"
              >
                < Wand2 size={12} /> Modify
              </button>
              <button onClick={() => setSelection(null)} className="p-1 rounded-md hover:bg-white/10 transition-colors">
                <X size={12} className="text-white/40" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={containerRef} className="relative w-full h-20 no-select cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  )
}
