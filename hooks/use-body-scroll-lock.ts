'use client'

import * as React from 'react'

export function useBodyScrollLock(locked = false) {
  const previousOverflowRef = React.useRef<string | null>(null)
  const lockedRef = React.useRef(false)

  const lockBodyScroll = React.useCallback(() => {
    if (typeof document === 'undefined' || lockedRef.current) return

    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lockedRef.current = true
  }, [])

  const unlockBodyScroll = React.useCallback(() => {
    if (typeof document === 'undefined' || !lockedRef.current) return

    document.body.style.overflow = previousOverflowRef.current ?? ''
    previousOverflowRef.current = null
    lockedRef.current = false
  }, [])

  React.useEffect(() => {
    if (locked) lockBodyScroll()
    else unlockBodyScroll()

    return () => {
      unlockBodyScroll()
    }
  }, [lockBodyScroll, locked, unlockBodyScroll])

  return {
    lockBodyScroll,
    unlockBodyScroll,
    isBodyScrollLockedRef: lockedRef,
  }
}
