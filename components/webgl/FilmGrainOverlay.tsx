'use client'

import { BlendFunction } from 'postprocessing'
import { Noise } from '@react-three/postprocessing'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWebGLSupport } from '@/hooks/useWebGLSupport'
import { shouldEnablePostProcessing } from '@/lib/webgl/post-processing'
import { isMobileWebglMode } from '@/lib/webgl/scene-routing'

export function FilmGrainOverlay() {
  const reduceMotion = useReducedMotion()
  const webglSupported = useWebGLSupport()
  const mobileMode = typeof navigator !== 'undefined' && isMobileWebglMode(navigator.hardwareConcurrency)

  if (!shouldEnablePostProcessing({ webglSupported, reduceMotion, mobileMode })) return null

  return <Noise opacity={0.04} premultiply blendFunction={BlendFunction.OVERLAY} />
}
