'use client'

import type { Point } from '../types/motion-editor'

export function CanvasGrid({ offset, zoom }: { offset: Point; zoom: number }) {
  const size = 28 * zoom

  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.075) 1.4px, transparent 1.6px)',
        backgroundPosition: `${offset.x}px ${offset.y}px`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  )
}
