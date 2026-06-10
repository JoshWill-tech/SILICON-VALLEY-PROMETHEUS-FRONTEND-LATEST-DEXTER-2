'use client'

import * as React from 'react'

import { getScrubSeekTime } from '@/lib/hooks/use-youtube-player'

export type GestureRegion = 'left' | 'center' | 'right'

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100
}

export function getGestureRegion(localX: number, width: number, edgeRatio = 0.22): GestureRegion {
  if (!Number.isFinite(width) || width <= 0) return 'center'

  const safeX = Math.max(0, Math.min(width, localX))
  const edgeWidth = width * Math.max(0.05, Math.min(edgeRatio, 0.45))

  if (safeX <= edgeWidth) return 'left'
  if (safeX >= width - edgeWidth) return 'right'
  return 'center'
}

export function getVerticalGestureDelta(previousY: number, nextY: number, sensitivity: number) {
  if (!Number.isFinite(sensitivity) || sensitivity <= 0) return 0
  return roundToTwoDecimals((previousY - nextY) / sensitivity)
}

export function getHorizontalScrubSeconds(deltaX: number, width: number, scrubWindowSeconds: number) {
  if (!Number.isFinite(width) || width <= 0) return 0
  return roundToTwoDecimals((deltaX / width) * scrubWindowSeconds)
}

type UsePlayerGesturesOptions = {
  doubleTapTimeout?: number
  edgeRatio?: number
  getCurrentTime: () => number
  getDuration: () => number
  moveThreshold?: number
  onDoubleTap: (side: 'left' | 'right') => void
  onHorizontalScrub: (nextTime: number, done: boolean) => void
  onSingleTap: () => void
  onVerticalSwipe: (kind: 'brightness' | 'volume', delta: number) => void
  scrubWindowSeconds?: number
}

type ActiveGesture = {
  lastY: number
  mode: 'brightness' | 'volume' | 'scrub' | null
  pointerId: number
  region: GestureRegion
  startTime: number
  startX: number
  startY: number
  width: number
  duration: number
}

export function usePlayerGestures({
  doubleTapTimeout = 280,
  edgeRatio = 0.22,
  getCurrentTime,
  getDuration,
  moveThreshold = 12,
  onDoubleTap,
  onHorizontalScrub,
  onSingleTap,
  onVerticalSwipe,
  scrubWindowSeconds = 60,
}: UsePlayerGesturesOptions) {
  const activeGestureRef = React.useRef<ActiveGesture | null>(null)
  const lastTapAtRef = React.useRef(0)
  const singleTapTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current !== null) {
        window.clearTimeout(singleTapTimeoutRef.current)
      }
    }
  }, [])

  const clearSingleTapTimeout = React.useCallback(() => {
    if (singleTapTimeoutRef.current !== null) {
      window.clearTimeout(singleTapTimeoutRef.current)
      singleTapTimeoutRef.current = null
    }
  }, [])

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const localX = event.clientX - rect.left
      const region = getGestureRegion(localX, rect.width, edgeRatio)

      activeGestureRef.current = {
        duration: getDuration(),
        lastY: event.clientY,
        mode: null,
        pointerId: event.pointerId,
        region,
        startTime: getCurrentTime(),
        startX: event.clientX,
        startY: event.clientY,
        width: rect.width,
      }

      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [edgeRatio, getCurrentTime, getDuration],
  )

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const gesture = activeGestureRef.current
      if (!gesture || gesture.pointerId !== event.pointerId) return

      const deltaX = event.clientX - gesture.startX
      const deltaY = event.clientY - gesture.startY
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (gesture.mode === null) {
        if (gesture.region !== 'center' && absY > moveThreshold && absY > absX + 2) {
          gesture.mode = gesture.region === 'left' ? 'brightness' : 'volume'
        } else if (absX > moveThreshold && absX > absY + 2) {
          gesture.mode = 'scrub'
        } else {
          return
        }
      }

      if (gesture.mode === 'scrub') {
        const nextTime = getScrubSeekTime(
          gesture.startTime,
          deltaX,
          gesture.width,
          scrubWindowSeconds,
          gesture.duration,
        )
        onHorizontalScrub(nextTime, false)
        return
      }

      const delta = getVerticalGestureDelta(
        gesture.lastY,
        event.clientY,
        Math.max(180, gesture.width * 0.8),
      )

      if (delta === 0) return

      gesture.lastY = event.clientY
      onVerticalSwipe(gesture.mode === 'brightness' ? 'brightness' : 'volume', delta)
    },
    [moveThreshold, onHorizontalScrub, onVerticalSwipe, scrubWindowSeconds],
  )

  const finalizeTap = React.useCallback(
    (clientX: number, width: number) => {
      const now = Date.now()
      const side = clientX <= width / 2 ? 'left' : 'right'
      const elapsed = now - lastTapAtRef.current

      if (elapsed > 0 && elapsed < doubleTapTimeout) {
        clearSingleTapTimeout()
        lastTapAtRef.current = 0
        onDoubleTap(side)
        return
      }

      lastTapAtRef.current = now
      singleTapTimeoutRef.current = window.setTimeout(() => {
        singleTapTimeoutRef.current = null
        onSingleTap()
      }, doubleTapTimeout)
    },
    [clearSingleTapTimeout, doubleTapTimeout, onDoubleTap, onSingleTap],
  )

  const endGesture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const gesture = activeGestureRef.current
      if (!gesture || gesture.pointerId !== event.pointerId) return

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      if (gesture.mode === 'scrub') {
        const nextTime = getScrubSeekTime(
          gesture.startTime,
          event.clientX - gesture.startX,
          gesture.width,
          scrubWindowSeconds,
          gesture.duration,
        )
        onHorizontalScrub(nextTime, true)
      } else if (gesture.mode === null) {
        finalizeTap(event.clientX - event.currentTarget.getBoundingClientRect().left, gesture.width)
      }

      activeGestureRef.current = null
    },
    [finalizeTap, onHorizontalScrub, scrubWindowSeconds],
  )

  return {
    onPointerCancel: endGesture,
    onPointerDown,
    onPointerMove,
    onPointerUp: endGesture,
  }
}
