'use client'

import { useCallback, useRef, type RefObject } from 'react'

import { clamp, MAX_ZOOM, MIN_ZOOM, screenToCanvas } from '../lib/motion-utils'
import type { Point } from '../types/motion-editor'
import { useNodeGraph } from './use-node-graph'

export function useCanvasTransform(viewportRef: RefObject<HTMLDivElement | null>) {
  const { canvasOffset, setCanvasTransform, zoom } = useNodeGraph()
  const panStartRef = useRef<{
    origin: Point
    offset: Point
  } | null>(null)
  const rafRef = useRef<number | null>(null)

  const toCanvasPoint = useCallback((client: Point) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return client
    return screenToCanvas(client, rect, canvasOffset, zoom)
  }, [canvasOffset, viewportRef, zoom])

  const beginPan = useCallback((client: Point) => {
    panStartRef.current = {
      origin: client,
      offset: canvasOffset,
    }
  }, [canvasOffset])

  const panTo = useCallback((client: Point) => {
    const start = panStartRef.current
    if (!start) return

    if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    rafRef.current = window.requestAnimationFrame(() => {
      setCanvasTransform({
        x: start.offset.x + client.x - start.origin.x,
        y: start.offset.y + client.y - start.origin.y,
      }, zoom)
    })
  }, [setCanvasTransform, zoom])

  const endPan = useCallback(() => {
    panStartRef.current = null
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  const zoomAt = useCallback((client: Point, deltaY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return

    const nextZoom = clamp(zoom * (deltaY > 0 ? 0.9 : 1.1), MIN_ZOOM, MAX_ZOOM)
    const canvasPoint = screenToCanvas(client, rect, canvasOffset, zoom)

    setCanvasTransform({
      x: client.x - rect.left - canvasPoint.x * nextZoom,
      y: client.y - rect.top - canvasPoint.y * nextZoom,
    }, nextZoom)
  }, [canvasOffset, setCanvasTransform, viewportRef, zoom])

  return {
    beginPan,
    endPan,
    panTo,
    toCanvasPoint,
    zoomAt,
  }
}
