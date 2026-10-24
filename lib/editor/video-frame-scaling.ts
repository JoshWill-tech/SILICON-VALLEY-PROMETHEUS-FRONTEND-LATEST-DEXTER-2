/**
 * Video Frame Proportional Scaling Engine
 *
 * Implements deterministic scaling of typography, overlays, and layout bounds
 * relative to the canonical 960 reference frame (540x960 for 9:16 portrait video).
 *
 * Guarantees that subtitles, badges, and overlays authored or planned in the JSON system
 * maintain identical proportional prominence, line wrapping, and safe-zone positioning
 * across all display devices, preview viewport dimensions, and source video resolutions.
 */

import type { DraftTypography } from '@/lib/editor/mini-run-draft-store'

export const REFERENCE_FRAME_HEIGHT = 960
export const DEFAULT_ASPECT_RATIO = 9 / 16
export const REFERENCE_FRAME_WIDTH = Math.round(REFERENCE_FRAME_HEIGHT * DEFAULT_ASPECT_RATIO) // 540
export const DEFAULT_BASE_FONT_SIZE_960 = 38

export interface VideoFrameScaleInput {
  renderedWidth?: number | null
  renderedHeight?: number | null
  intrinsicWidth?: number | null
  intrinsicHeight?: number | null
  aspectRatio?: number | null
  canvasHeight?: number | null
}

export interface VideoScaleMetrics {
  scale: number
  scaleX: number
  scaleY: number
  referenceWidth: number
  referenceHeight: number
  renderedWidth: number
  renderedHeight: number
  aspectRatio: number
}

export interface ScaledTypographyStyles {
  fontSize: number
  lineHeight: number
  paddingX: number
  gapX: number
  gapY: number
  wordPaddingX: number
  wordPaddingY: number
  wordRadius: number
  strokeWidth?: string
  strokeColor?: string
  textShadow?: string
  positionYPercent: number
  maxWidthPercent: number
}

/**
 * Normalizes an arbitrary font size authored in the JSON manifest into the canonical 960 reference frame.
 * If canvasHeight is 1920 (or fontSize > 55), it scales from 1080p to 960p (factor 0.5).
 */
export function normalizeBaseFontSize(fontSizeRaw?: number | null, canvasHeight?: number | null): number {
  if (typeof fontSizeRaw !== 'number' || !Number.isFinite(fontSizeRaw) || fontSizeRaw <= 0) {
    return DEFAULT_BASE_FONT_SIZE_960
  }

  if (typeof canvasHeight === 'number' && Number.isFinite(canvasHeight) && canvasHeight > 1200) {
    return Math.round((fontSizeRaw * (REFERENCE_FRAME_HEIGHT / canvasHeight)) * 10) / 10
  }

  // Heuristic: font size > 55 in vertical video is typically authored for 1080x1920 (e.g. 72px)
  if (fontSizeRaw > 55) {
    return Math.round((fontSizeRaw * 0.5) * 10) / 10
  }

  return fontSizeRaw
}

/**
 * Computes exact scale factors relative to the 960 frame based on the rendered container dimensions.
 */
export function calculateVideoFrameScale({
  renderedWidth,
  renderedHeight,
  intrinsicWidth,
  intrinsicHeight,
  aspectRatio: explicitAspectRatio,
}: VideoFrameScaleInput): VideoScaleMetrics {
  const width = typeof renderedWidth === 'number' && Number.isFinite(renderedWidth) && renderedWidth > 0
    ? renderedWidth
    : 0

  const height = typeof renderedHeight === 'number' && Number.isFinite(renderedHeight) && renderedHeight > 0
    ? renderedHeight
    : 0

  // Derive aspect ratio: explicit -> intrinsic -> rendered -> fallback 9/16
  let aspectRatio = DEFAULT_ASPECT_RATIO
  if (typeof explicitAspectRatio === 'number' && Number.isFinite(explicitAspectRatio) && explicitAspectRatio > 0) {
    aspectRatio = explicitAspectRatio
  } else if (
    typeof intrinsicWidth === 'number' &&
    typeof intrinsicHeight === 'number' &&
    intrinsicWidth > 0 &&
    intrinsicHeight > 0
  ) {
    aspectRatio = intrinsicWidth / intrinsicHeight
  } else if (width > 0 && height > 0) {
    aspectRatio = width / height
  }

  const referenceHeight = REFERENCE_FRAME_HEIGHT
  const referenceWidth = Math.max(1, Math.round(referenceHeight * aspectRatio))

  // If container is not yet measured (e.g. SSR / pre-mount), supply calibrated preview default (~280px tall)
  if (height <= 0 || width <= 0) {
    const defaultScale = 0.2917 // 280 / 960
    return {
      scale: defaultScale,
      scaleX: defaultScale,
      scaleY: defaultScale,
      referenceWidth,
      referenceHeight,
      renderedWidth: referenceWidth * defaultScale,
      renderedHeight: referenceHeight * defaultScale,
      aspectRatio,
    }
  }

  const scaleX = width / referenceWidth
  const scaleY = height / referenceHeight
  // Uniform scale respects both width and height constraints so overlay never spills out
  const scale = Math.min(scaleX, scaleY)

  return {
    scale,
    scaleX,
    scaleY,
    referenceWidth,
    referenceHeight,
    renderedWidth: width,
    renderedHeight: height,
    aspectRatio,
  }
}

/**
 * Proportionally scales a text-shadow or drop-shadow string by the scale factor.
 */
export function scaleTextShadow(shadowString: string | undefined, scale: number): string {
  if (!shadowString || typeof shadowString !== 'string') {
    const blur = Math.max(2, Math.round(10 * scale))
    const offset = Math.max(1, Math.round(2 * scale))
    return `0 ${offset}px ${blur}px rgba(0,0,0,0.85)`
  }

  // Scale any pixel values (e.g. 4px, 15px) inside the shadow string
  return shadowString.replace(/(-?\d+(?:\.\d+)?)px/g, (_, num) => {
    const val = parseFloat(num)
    const scaled = Math.round(val * scale * 10) / 10
    return `${scaled}px`
  })
}

/**
 * Calculates responsive, proportionally scaled typography styles for the current video frame.
 */
export function calculateScaledTypography({
  metrics,
  typography,
  canvasHeight,
}: {
  metrics: VideoScaleMetrics
  typography?: DraftTypography | null
  canvasHeight?: number | null
}): ScaledTypographyStyles {
  const { scale } = metrics
  const baseFontSize960 = normalizeBaseFontSize(typography?.fontSize, canvasHeight)

  // Scale font size: guaranteed minimum 9px for legibility on smallest mobile previews
  const fontSize = Math.max(9, Math.round(baseFontSize960 * scale * 10) / 10)

  // Proportional padding & gaps
  const paddingX = Math.max(4, Math.round(24 * scale))
  const gapX = Math.max(2, Math.round(10 * scale))
  const gapY = Math.max(2, Math.round(6 * scale))

  // Word interactive bubble padding
  const wordPaddingX = Math.max(1, Math.round(5 * scale))
  const wordPaddingY = Math.max(1, Math.round(2.5 * scale))
  const wordRadius = Math.max(2, Math.round(4 * scale))

  // Stroke width
  let strokeWidth: string | undefined
  if (typeof typography?.strokeWidth === 'number' && typography.strokeWidth > 0) {
    const baseStroke = typography.strokeWidth > 6 ? typography.strokeWidth * 0.5 : typography.strokeWidth
    const scaled = Math.max(0.4, Math.round(baseStroke * scale * 10) / 10)
    strokeWidth = `${scaled}`
  }

  // Shadow
  const textShadow = scaleTextShadow(typography?.shadow, scale)

  // Vertical position
  let positionYPercent = 72
  const rawY = typography?.positionY
  if (typeof rawY === 'number' && Number.isFinite(rawY)) {
    if (rawY > 1) {
      // Pixel coordinate in canvas
      if (rawY > 960) {
        positionYPercent = (rawY / 1920) * 100
      } else {
        positionYPercent = (rawY / REFERENCE_FRAME_HEIGHT) * 100
      }
    } else {
      positionYPercent = rawY * 100
    }
  }

  return {
    fontSize,
    lineHeight: 1.15,
    paddingX,
    gapX,
    gapY,
    wordPaddingX,
    wordPaddingY,
    wordRadius,
    strokeWidth,
    strokeColor: typography?.strokeColor,
    textShadow,
    positionYPercent,
    maxWidthPercent: 92,
  }
}
