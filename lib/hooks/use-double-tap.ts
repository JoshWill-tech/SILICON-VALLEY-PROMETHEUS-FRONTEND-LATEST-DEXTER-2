'use client'

import * as React from 'react'

type DoubleTapOptions = {
  timeout?: number
  onDoubleTap: (event: React.PointerEvent<HTMLElement>) => void
  onSingleTap?: (event: React.PointerEvent<HTMLElement>) => void
}

export function useDoubleTap({ onDoubleTap, onSingleTap, timeout = 280 }: DoubleTapOptions) {
  const lastTapAtRef = React.useRef(0)
  const singleTapTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current !== null) {
        window.clearTimeout(singleTapTimeoutRef.current)
      }
    }
  }, [])

  return React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const now = Date.now()
      const elapsed = now - lastTapAtRef.current

      if (elapsed > 0 && elapsed < timeout) {
        if (singleTapTimeoutRef.current !== null) {
          window.clearTimeout(singleTapTimeoutRef.current)
          singleTapTimeoutRef.current = null
        }
        lastTapAtRef.current = 0
        onDoubleTap(event)
        return
      }

      lastTapAtRef.current = now

      if (onSingleTap) {
        singleTapTimeoutRef.current = window.setTimeout(() => {
          singleTapTimeoutRef.current = null
          onSingleTap(event)
        }, timeout)
      }
    },
    [onDoubleTap, onSingleTap, timeout],
  )
}
