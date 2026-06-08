'use client'

import * as React from 'react'

export interface UseSwipeCloseOptions {
  onClose: () => void
  threshold?: number
  verticalTolerance?: number
  enabled?: boolean
}

export function useSwipeClose<T extends HTMLElement>({
  onClose,
  threshold = 80,
  verticalTolerance = 72,
  enabled = true,
}: UseSwipeCloseOptions) {
  const targetRef = React.useRef<T | null>(null)
  const startRef = React.useRef<{ x: number; y: number } | null>(null)
  const onCloseRef = React.useRef(onClose)

  React.useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  React.useEffect(() => {
    const target = targetRef.current
    if (!target || !enabled) return

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      startRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      const start = startRef.current
      const touch = event.changedTouches[0]
      startRef.current = null
      if (!start || !touch) return

      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y
      if (deltaX < -threshold && Math.abs(deltaY) <= verticalTolerance) {
        onCloseRef.current()
      }
    }

    target.addEventListener('touchstart', handleTouchStart, { passive: true })
    target.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      target.removeEventListener('touchstart', handleTouchStart)
      target.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, verticalTolerance])

  return targetRef
}
