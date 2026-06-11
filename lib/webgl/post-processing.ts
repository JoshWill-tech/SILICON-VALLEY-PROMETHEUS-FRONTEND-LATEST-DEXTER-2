export type ChromaticOffset = [number, number]

export function shouldEnablePostProcessing(input: {
  webglSupported: boolean
  reduceMotion: boolean
  mobileMode: boolean
}) {
  return input.webglSupported && !input.reduceMotion && !input.mobileMode
}

export function getChromaticTargetOffset(isTransitioning: boolean): ChromaticOffset {
  return isTransitioning ? [0.003, 0.003] : [0, 0]
}

export function lerpChromaticOffset(
  current: ChromaticOffset,
  target: ChromaticOffset,
  factor = 0.1,
): ChromaticOffset {
  return [
    current[0] + (target[0] - current[0]) * factor,
    current[1] + (target[1] - current[1]) * factor,
  ]
}
