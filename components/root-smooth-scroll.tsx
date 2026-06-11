'use client'

import * as React from 'react'
import Lenis from 'lenis'

import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'

export function RootSmoothScroll() {
  const reduceMotion = useStableReducedMotion()

  React.useEffect(() => {
    if (reduceMotion) return

    const lenis = new Lenis({
      autoRaf: false,
      syncTouch: false,
      smoothWheel: true,
      wheelMultiplier: 0.9,
    })

    let frameId = 0

    const onFrame = (time: number) => {
      lenis.raf(time)
      frameId = window.requestAnimationFrame(onFrame)
    }

    frameId = window.requestAnimationFrame(onFrame)

    return () => {
      window.cancelAnimationFrame(frameId)
      lenis.destroy()
    }
  }, [reduceMotion])

  return null
}
