export type WebglTier = 'high' | 'standard' | 'lite'

export interface SceneManagerConfig {
  enableLenis: boolean
  maxDpr: number
  mobileMaxFps: number
  overlayPointerEvents: 'none'
  backgroundPointerEvents: 'none'
}

export interface PostProcessingConfig {
  bloomIntensity: number
  bloomLuminanceThreshold: number
  grainOpacity: number
  vignetteDarkness: number
  vignetteOffset: number
}

export const DEFAULT_SCENE_MANAGER_CONFIG: SceneManagerConfig = {
  enableLenis: true,
  maxDpr: 2,
  mobileMaxFps: 30,
  overlayPointerEvents: 'none',
  backgroundPointerEvents: 'none',
}

export const DEFAULT_POST_PROCESSING_CONFIG: PostProcessingConfig = {
  bloomIntensity: 0.5,
  bloomLuminanceThreshold: 0.8,
  grainOpacity: 0.035,
  vignetteDarkness: 0.3,
  vignetteOffset: 0.2,
}

export function getDeviceWebglTier(input: {
  hardwareConcurrency?: number | null
  devicePixelRatio?: number | null
  prefersReducedMotion?: boolean
}): WebglTier {
  if (input.prefersReducedMotion) return 'lite'
  if ((input.hardwareConcurrency ?? 0) > 0 && (input.hardwareConcurrency ?? 0) < 4) return 'lite'
  if ((input.devicePixelRatio ?? 1) > 2) return 'standard'
  return 'high'
}
