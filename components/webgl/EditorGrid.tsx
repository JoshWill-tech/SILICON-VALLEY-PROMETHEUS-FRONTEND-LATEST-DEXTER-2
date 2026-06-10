'use client'

import * as React from 'react'
import * as THREE from 'three'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWebGLSupport } from '@/hooks/useWebGLSupport'

export function EditorGrid() {
  const webglSupported = useWebGLSupport()
  const reduceMotion = useReducedMotion()
  const gridRef = React.useRef<THREE.GridHelper | null>(null)

  const grid = React.useMemo(() => {
    const helper = new THREE.GridHelper(14, 28, '#1f3147', '#111827')
    if (Array.isArray(helper.material)) {
      helper.material.forEach((material) => {
        material.transparent = true
        material.opacity = 0.22
      })
    } else {
      helper.material.transparent = true
      helper.material.opacity = 0.22
    }
    helper.position.set(0, -1.9, -2.5)
    helper.rotation.x = Math.PI / 2.55
    return helper
  }, [])

  React.useEffect(() => {
    return () => {
      grid.geometry.dispose()
      if (Array.isArray(grid.material)) {
        grid.material.forEach((material) => material.dispose())
      } else {
        grid.material.dispose()
      }
    }
  }, [grid])

  React.useEffect(() => {
    if (!gridRef.current || reduceMotion) return
    gridRef.current.material.opacity = 0.22
  }, [reduceMotion])

  if (!webglSupported) return null

  return <primitive ref={gridRef} object={grid} />
}
