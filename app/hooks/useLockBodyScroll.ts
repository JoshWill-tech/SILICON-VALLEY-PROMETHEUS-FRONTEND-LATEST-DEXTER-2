'use client'

import * as React from 'react'

export function useLockBodyScroll(locked: boolean) {
  React.useEffect(() => {
    if (!locked || typeof document === 'undefined') return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'contain'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
    }
  }, [locked])
}
