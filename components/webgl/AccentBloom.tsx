'use client'

import { Bloom } from '@react-three/postprocessing'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWebGLSupport } from '@/hooks/useWebGLSupport'
import { shouldEnablePostProcessing } from '@/lib/webgl/post-processing'
import { isMobileWebglMode } from '@/lib/webgl/scene-routing'

export function AccentBloom() {
  const reduceMotion = useReducedMotion()
  const webglSupported = useWebGLSupport()
  const mobileMode = typeof navigator !== 'undefined' && isMobileWebglMode(navigator.hardwareConcurrency)

  if (!shouldEnablePostProcessing({ webglSupported, reduceMotion, mobileMode })) return null

  return (
    <Bloom
      intensity={0.5}
      luminanceThreshold={0.8}
      luminanceSmoothing={0.9}
      mipmapBlur
    />
  )
}
