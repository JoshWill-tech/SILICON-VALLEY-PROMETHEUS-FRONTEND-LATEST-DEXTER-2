'use client'

import * as React from 'react'

type SwipeDirection = 'left' | 'right'

interface SwipeDetail {
  direction: SwipeDirection
  distanceX: number
  distanceY: number
  startX: number
  velocityX: number
}

interface UseSwipeGestureOptions<T extends HTMLElement = HTMLElement> {
  enabled?: boolean
  edgeOnly?: boolean
  edgeThreshold?: number
  minDistance?: number
  minVelocity?: number
  onSwipeLeft?: (detail: SwipeDetail) => void
  onSwipeRight?: (detail: SwipeDetail) => void
  targetRef?: React.RefObject<T | null>
  verticalTolerance?: number
}

interface PointerState {
  startTime: number
  startX: number
  startY: number
  triggered: boolean
}

function isTouchEvent(event: Event): event is TouchEvent {
  return 'changedTouches' in event && 'touches' in event
}

export function useSwipeGesture<T extends HTMLElement = HTMLElement>({
  enabled = true,
  edgeOnly = false,
  edgeThreshold = 30,
  minDistance = 80,
  minVelocity = 0.35,
  onSwipeLeft,
  onSwipeRight,
  targetRef,
  verticalTolerance = 72,
}: UseSwipeGestureOptions<T>) {
  const internalRef = React.useRef<T | null>(null)
  const resolvedRef = targetRef ?? internalRef
  const pointerStateRef = React.useRef<PointerState | null>(null)
  const callbacksRef = React.useRef({ onSwipeLeft, onSwipeRight })

  React.useEffect(() => {
    callbacksRef.current = { onSwipeLeft, onSwipeRight }
  }, [onSwipeLeft, onSwipeRight])

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const startTarget: HTMLElement | Window = resolvedRef.current ?? window
    const endTarget: HTMLElement | Window = window

    const getClientPoint = (event: Event) => {
      if (isTouchEvent(event)) {
        return event.changedTouches[0] ?? event.touches[0] ?? null
      }

      if (event instanceof PointerEvent || event instanceof MouseEvent) {
        return event
      }

      return null
    }

    const handleStart = (event: Event) => {
      if ('button' in event && event.button !== 0) return

      const point = getClientPoint(event)
      if (!point) return
      if (edgeOnly && point.clientX > edgeThreshold) {
        pointerStateRef.current = null
        return
      }

      pointerStateRef.current = {
        startTime: performance.now(),
        startX: point.clientX,
        startY: point.clientY,
        triggered: false,
      }
    }

    const maybeDispatchSwipe = (event: Event, endInteraction: boolean) => {
      const start = pointerStateRef.current
      const point = getClientPoint(event)
      if (!start || !point) return

      const distanceX = point.clientX - start.startX
      const distanceY = point.clientY - start.startY
      const elapsed = Math.max(performance.now() - start.startTime, 1)
      const velocityX = Math.abs(distanceX) / elapsed

      if (Math.abs(distanceX) < minDistance) return
      if (endInteraction && velocityX < minVelocity) return
      if (Math.abs(distanceY) > verticalTolerance) return

      const direction: SwipeDirection = distanceX > 0 ? 'right' : 'left'
      start.triggered = true
      const detail: SwipeDetail = {
        direction,
        distanceX,
        distanceY,
        startX: start.startX,
        velocityX,
      }

      if (direction === 'right') callbacksRef.current.onSwipeRight?.(detail)
      else callbacksRef.current.onSwipeLeft?.(detail)
    }

    const handleMove = (event: Event) => {
      if (pointerStateRef.current?.triggered) return
      maybeDispatchSwipe(event, false)
    }

    const handleEnd = (event: Event) => {
      if (!pointerStateRef.current?.triggered) {
        maybeDispatchSwipe(event, true)
      }
      pointerStateRef.current = null
    }

    startTarget.addEventListener('touchstart', handleStart, { passive: true })
    endTarget.addEventListener('touchmove', handleMove, { passive: true })
    endTarget.addEventListener('touchend', handleEnd, { passive: true })
    startTarget.addEventListener('pointerdown', handleStart)
    endTarget.addEventListener('pointermove', handleMove)
    endTarget.addEventListener('pointerup', handleEnd)
    startTarget.addEventListener('mousedown', handleStart)
    endTarget.addEventListener('mousemove', handleMove)
    endTarget.addEventListener('mouseup', handleEnd)

    return () => {
      startTarget.removeEventListener('touchstart', handleStart)
      endTarget.removeEventListener('touchmove', handleMove)
      endTarget.removeEventListener('touchend', handleEnd)
      startTarget.removeEventListener('pointerdown', handleStart)
      endTarget.removeEventListener('pointermove', handleMove)
      endTarget.removeEventListener('pointerup', handleEnd)
      startTarget.removeEventListener('mousedown', handleStart)
      endTarget.removeEventListener('mousemove', handleMove)
      endTarget.removeEventListener('mouseup', handleEnd)
    }
  }, [edgeOnly, edgeThreshold, enabled, minDistance, minVelocity, resolvedRef, verticalTolerance])

  return resolvedRef
}
