'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, X } from 'lucide-react'
import { useEditor } from './EditorContext'

const TRACK_HEIGHT = 80
const MARKER_COLOR = 'rgba(255,255,255,0.25)'
const TRACK_BG = 'rgba(255,255,255,0.03)'
const SELECTION_FILL = 'rgba(0, 240, 255, 0.12)'
const SELECTION_STROKE = 'rgba(0, 240, 255, 0.6)'
const HANDLE_COLOR = '#00f0ff'

export const TimelineEngine: React.FC = () => {
  const { duration, selection, setSelection, setShowCommandBubble } = useEditor()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({
    isDragging: false,
    startX: 0,
    currentX: 0,
    startTime: 0,
    currentTime: 0,
  })
  const rafRef = useRef<number>(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // Desktop-only
  if (typeof window !== 'undefined' && window.innerWidth < 1024) return null

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
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = containerWidth * dpr
    canvas.height = TRACK_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      const w = containerWidth
      const h = TRACK_HEIGHT
      ctx.clearRect(0, 0, w, h)

      ctx.fillStyle = TRACK_BG
      ctx.fillRect(0, 20, w, 40)

      ctx.fillStyle = MARKER_COLOR
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      const step = 10
      const count = Math.ceil(duration / step)
      for (let i = 0; i <= count; i++) {
        const t = i * step
        const x = (t / duration) * w
        const mins = Math.floor(t / 60)
        const secs = t % 60
        const label = `${mins}:${secs.toString().padStart(2, '0')}`
        ctx.fillRect(x, 20, 1, i % 3 === 0 ? 12 : 6)
        if (i % 3 === 0) ctx.fillText(label, x, 14)
      }

      const s = stateRef.current
      if (s.isDragging && Math.abs(s.currentX - s.startX) > 4) {
        const selX = Math.min(s.startX, s.currentX)
        const selW = Math.abs(s.currentX - s.startX)
        ctx.fillStyle = SELECTION_FILL
        ctx.fillRect(selX, 20, selW, 40)
        ctx.strokeStyle = SELECTION_STROKE
        ctx.lineWidth = 1
        ctx.strokeRect(selX, 20, selW, 40)
        ctx.fillStyle = HANDLE_COLOR
        ctx.fillRect(selX - 3, 30, 6, 20)
        ctx.fillRect(selX + selW - 3, 30, 6, 20)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [containerWidth, duration])

  const getTimeFromX = useCallback((clientX: number): number => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const x = clientX - rect.left
    return (x / rect.width) * duration
  }, [duration])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const time = getTimeFromX(e.clientX)
    const rect = containerRef.current?.getBoundingClientRect()
    const x = e.clientX - (rect?.left || 0)
    stateRef.current = { isDragging: true, startX: x, currentX: x, startTime: time, currentTime: time }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [getTimeFromX])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current
    if (!s.isDragging) return
    const rect = containerRef.current?.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - (rect?.left || 0), rect?.width || 0))
    s.currentX = x
    s.currentTime = (x / (rect?.width || 1)) * duration
  }, [duration])

  const handlePointerUp = useCallback(() => {
    const s = stateRef.current
    if (!s.isDragging) return
    s.isDragging = false
    const minTime = Math.min(s.startTime, s.currentTime)
    const maxTime = Math.max(s.startTime, s.currentTime)
    if (maxTime - minTime > 0.5) {
      setSelection({
        startTime: minTime,
        endTime: maxTime,
        startX: Math.min(s.startX, s.currentX),
        endX: Math.max(s.startX, s.currentX),
      })
    }
  }, [setSelection])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="timeline-container w-full border-t border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 h-10 border-b border-white/[0.04]">
        <span className="text-[11px] font-mono uppercase tracking-widest text-white/40">Motion Timeline</span>
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
                <Wand2 size={12} /> Modify
              </button>
              <button onClick={() => setSelection(null)} className="p-1 rounded-md hover:bg-white/10 transition-colors">
                <X size={12} className="text-white/40" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={containerRef} className="relative w-full h-20 no-select cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-16 flex pointer-events-none">
          {useEditor().segments.map((seg) => {
            const left = (seg.startTime / duration) * 100
            const width = ((seg.endTime - seg.startTime) / duration) * 100
            return (
              <div
                key={seg.id}
                className="absolute top-0 h-full border-r border-white/[0.06] overflow-hidden"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: `linear-gradient(135deg, rgba(0,240,255,0.06) 0%, rgba(112,0,255,0.06) 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-1 left-2 text-[10px] font-mono text-white/50 truncate">
                  {seg.label}
                </span>
                {seg.aiGenerated && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400/50" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
