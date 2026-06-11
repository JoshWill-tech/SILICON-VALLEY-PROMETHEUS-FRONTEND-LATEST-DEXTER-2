'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

export function useRouteTransition(durationMs = 500) {
  const pathname = usePathname()
  const previousPathnameRef = React.useRef(pathname)
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  React.useEffect(() => {
    if (previousPathnameRef.current === pathname) return

    previousPathnameRef.current = pathname
    setIsTransitioning(true)

    const timeoutId = window.setTimeout(() => {
      setIsTransitioning(false)
    }, durationMs)

    return () => window.clearTimeout(timeoutId)
  }, [durationMs, pathname])

  return isTransitioning
}
