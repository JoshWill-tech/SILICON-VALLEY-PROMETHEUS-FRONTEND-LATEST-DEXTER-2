'use client'

import * as React from 'react'

function detectWebglSupport() {
  if (typeof window === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function useWebGLSupport() {
  const [supported, setSupported] = React.useState(false)

  React.useEffect(() => {
    setSupported(detectWebglSupport())
  }, [])

  return supported
}
