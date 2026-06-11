'use client'

import { EffectComposer, Vignette } from '@react-three/postprocessing'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWebGLSupport } from '@/hooks/useWebGLSupport'
import { DEFAULT_POST_PROCESSING_CONFIG, type PostProcessingConfig } from '@/lib/webgl/config'
import { shouldEnablePostProcessing } from '@/lib/webgl/post-processing'
import { isMobileWebglMode } from '@/lib/webgl/scene-routing'

import { AccentBloom } from './AccentBloom'
import { ChromaticTransition } from './ChromaticTransition'
import { FilmGrainOverlay } from './FilmGrainOverlay'

export interface PostProcessingPipelineProps {
  enabled?: boolean
  config?: Partial<PostProcessingConfig>
  reduceMotion?: boolean
}

export function PostProcessingPipeline({
  enabled = true,
  config,
  reduceMotion: reduceMotionOverride = false,
}: PostProcessingPipelineProps) {
  const reduceMotion = useReducedMotion() || reduceMotionOverride
  const webglSupported = useWebGLSupport()
  const mobileMode = typeof navigator !== 'undefined' && isMobileWebglMode(navigator.hardwareConcurrency)
  const mergedConfig: PostProcessingConfig = {
    ...DEFAULT_POST_PROCESSING_CONFIG,
    ...config,
  }

  if (!enabled) return null

  const postProcessingEnabled = shouldEnablePostProcessing({
    webglSupported,
    reduceMotion,
    mobileMode,
  })

  if (postProcessingEnabled) {
    return (
      <EffectComposer multisampling={0}>
        <FilmGrainOverlay />
        <AccentBloom />
        <ChromaticTransition />
        <Vignette
          eskil={false}
          offset={mergedConfig.vignetteOffset}
          darkness={mergedConfig.vignetteDarkness}
        />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0}>
      <Vignette
        eskil={false}
        offset={mergedConfig.vignetteOffset}
        darkness={0}
      />
    </EffectComposer>
  )
}
