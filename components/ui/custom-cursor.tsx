'use client'

import * as React from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

type CursorPoint = { x: number; y: number }

function lerp(current: CursorPoint, target: CursorPoint, factor = 0.15) {
  return {
    x: current.x + (target.x - current.x) * factor,
    y: current.y + (target.y - current.y) * factor,
  }
}

export function CustomCursor() {
  const reduceMotion = useReducedMotion()
  const [enabled, setEnabled] = React.useState(false)
  const [hoveringInteractive, setHoveringInteractive] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const [position, setPosition] = React.useState<CursorPoint>({ x: 0, y: 0 })
  const frameRef = React.useRef<number | null>(null)
  const targetRef = React.useRef<CursorPoint>({ x: 0, y: 0 })
  const positionRef = React.useRef<CursorPoint>({ x: 0, y: 0 })

  React.useEffect(() => {
    if (reduceMotion) return
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(pointer:fine)').matches) return

    setEnabled(true)

    const step = () => {
      positionRef.current = lerp(positionRef.current, targetRef.current)
      setPosition(positionRef.current)
      frameRef.current = window.requestAnimationFrame(step)
    }

    const handleMove = (event: MouseEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY }
      const target = event.target
      if (target instanceof HTMLElement) {
        setHoveringInteractive(Boolean(target.closest('a, button, [role="button"], [data-cursor="pointer"]')))
      }
    }

    const handleDown = () => setPressed(true)
    const handleUp = () => setPressed(false)

    frameRef.current = window.requestAnimationFrame(step)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mousedown', handleDown)
    window.addEventListener('mouseup', handleUp)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [reduceMotion])

  if (!enabled) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
    >
      <div
        className="rounded-full border border-white/80 bg-white transition-[width,height,margin,transform,opacity] duration-150 ease-out"
        style={{
          width: hoveringInteractive ? 24 : 8,
          height: hoveringInteractive ? 24 : 8,
          marginLeft: hoveringInteractive ? -12 : -4,
          marginTop: hoveringInteractive ? -12 : -4,
          transform: pressed ? 'scale(0.82)' : 'scale(1)',
          opacity: hoveringInteractive ? 0.75 : 0.92,
          background: hoveringInteractive ? 'transparent' : 'white',
          boxShadow: hoveringInteractive ? '0 0 0 1px rgba(255,255,255,0.92)' : 'none',
        }}
      />
    </div>
  )
}
