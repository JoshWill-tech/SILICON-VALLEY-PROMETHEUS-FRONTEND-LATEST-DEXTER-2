'use client'

import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useRouteTransition } from '@/hooks/use-route-transition'
import { useWebGLSupport } from '@/hooks/useWebGLSupport'
import {
  getChromaticTargetOffset,
  lerpChromaticOffset,
  shouldEnablePostProcessing,
} from '@/lib/webgl/post-processing'
import { isMobileWebglMode } from '@/lib/webgl/scene-routing'

export function ChromaticTransition() {
  const reduceMotion = useReducedMotion()
  const webglSupported = useWebGLSupport()
  const mobileMode = typeof navigator !== 'undefined' && isMobileWebglMode(navigator.hardwareConcurrency)
  const isTransitioning = useRouteTransition(500)
  const offset = React.useMemo(() => new THREE.Vector2(0, 0), [])
  const targetOffsetRef = React.useRef<[number, number]>([0, 0])

  React.useEffect(() => {
    targetOffsetRef.current = getChromaticTargetOffset(isTransitioning)
  }, [isTransitioning])

  useFrame(() => {
    const [nextX, nextY] = lerpChromaticOffset(
      [offset.x, offset.y],
      targetOffsetRef.current,
      isTransitioning ? 0.18 : 0.1,
    )
    offset.set(nextX, nextY)
  })

  if (!shouldEnablePostProcessing({ webglSupported, reduceMotion, mobileMode })) return null

  return (
    <ChromaticAberration
      offset={offset}
      blendFunction={BlendFunction.NORMAL}
      radialModulation
      modulationOffset={0.15}
    />
  )
}
