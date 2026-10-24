'use client'

import * as React from 'react'
import {
  calculateVideoFrameScale,
  calculateScaledTypography,
  REFERENCE_FRAME_HEIGHT,
  REFERENCE_FRAME_WIDTH,
  type VideoScaleMetrics,
  type ScaledTypographyStyles,
} from '@/lib/editor/video-frame-scaling'
import type { DraftTypography } from '@/lib/editor/mini-run-draft-store'

export interface UseVideoFrameScaleOptions {
  videoRef?: React.RefObject<HTMLVideoElement | null>
  containerRef?: React.RefObject<HTMLElement | null>
  sourceMeta?: { width?: number; height?: number } | null
  aspectRatio?: number
}

export interface UseVideoFrameScaleReturn {
  metrics: VideoScaleMetrics
  scale: number
  getScaledTypography: (typography?: DraftTypography | null) => ScaledTypographyStyles
  referenceFrameHeight: number
  referenceFrameWidth: number
}

/**
 * Responsive video frame scaling hook.
 *
 * Observes the live rendered bounding box of the video and overlay container,
 * continuously re-deriving exact scale factors relative to the 960 reference frame.
 * Automatically adapts when browser resizes, container collapses/expands,
 * aspect ratio switches, or fullscreen toggles.
 */
export function useVideoFrameScale({
  videoRef,
  containerRef,
  sourceMeta,
  aspectRatio: explicitAspectRatio,
}: UseVideoFrameScaleOptions): UseVideoFrameScaleReturn {
  const [dimensions, setDimensions] = React.useState<{
    width: number
    height: number
    intrinsicWidth?: number
    intrinsicHeight?: number
  }>(() => ({
    width: 0,
    height: 0,
    intrinsicWidth: sourceMeta?.width,
    intrinsicHeight: sourceMeta?.height,
  }))

  const updateDimensions = React.useCallback(() => {
    const container = containerRef?.current
    const video = videoRef?.current

    let width = 0
    let height = 0

    if (container) {
      const rect = container.getBoundingClientRect()
      width = rect.width
      height = rect.height
    }

    if ((width <= 0 || height <= 0) && video) {
      const rect = video.getBoundingClientRect()
      width = rect.width
      height = rect.height
    }

    const intrinsicWidth = video?.videoWidth || sourceMeta?.width
    const intrinsicHeight = video?.videoHeight || sourceMeta?.height

    setDimensions((prev) => {
      // Guard against superfluous re-renders if size difference is subpixel
      if (
        Math.abs(prev.width - width) < 0.5 &&
        Math.abs(prev.height - height) < 0.5 &&
        prev.intrinsicWidth === intrinsicWidth &&
        prev.intrinsicHeight === intrinsicHeight
      ) {
        return prev
      }
      return { width, height, intrinsicWidth, intrinsicHeight }
    })
  }, [containerRef, videoRef, sourceMeta?.width, sourceMeta?.height])

  // Initial measurement + ResizeObserver binding
  React.useEffect(() => {
    updateDimensions()

    if (typeof window === 'undefined') return

    let resizeObserver: ResizeObserver | null = null

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions()
      })

      if (containerRef?.current) {
        resizeObserver.observe(containerRef.current)
      }
      if (videoRef?.current) {
        resizeObserver.observe(videoRef.current)
      }
    }

    const video = videoRef?.current
    const onMetadata = () => updateDimensions()
    if (video) {
      video.addEventListener('loadedmetadata', onMetadata)
    }

    window.addEventListener('resize', updateDimensions)
    window.addEventListener('orientationchange', updateDimensions)

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      if (video) {
        video.removeEventListener('loadedmetadata', onMetadata)
      }
      window.removeEventListener('resize', updateDimensions)
      window.removeEventListener('orientationchange', updateDimensions)
    }
  }, [containerRef, videoRef, updateDimensions])

  // Compute metrics relative to 960 frame
  const metrics = React.useMemo(() => {
    return calculateVideoFrameScale({
      renderedWidth: dimensions.width,
      renderedHeight: dimensions.height,
      intrinsicWidth: dimensions.intrinsicWidth,
      intrinsicHeight: dimensions.intrinsicHeight,
      aspectRatio: explicitAspectRatio,
    })
  }, [dimensions, explicitAspectRatio])

  const getScaledTypography = React.useCallback(
    (typography?: DraftTypography | null): ScaledTypographyStyles => {
      return calculateScaledTypography({
        metrics,
        typography,
        canvasHeight: dimensions.intrinsicHeight,
      })
    },
    [metrics, dimensions.intrinsicHeight]
  )

  return {
    metrics,
    scale: metrics.scale,
    getScaledTypography,
    referenceFrameHeight: REFERENCE_FRAME_HEIGHT,
    referenceFrameWidth: REFERENCE_FRAME_WIDTH,
  }
}
