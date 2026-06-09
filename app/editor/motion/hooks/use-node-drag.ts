'use client'

import { useCallback, useRef } from 'react'

import { snapPointToGrid } from '../lib/motion-utils'
import type { MotionNode, Point } from '../types/motion-editor'
import { useNodeGraph } from './use-node-graph'

export function useNodeDrag(node: MotionNode) {
  const { setSelectedNode, updateNodePosition, zoom } = useNodeGraph()
  const dragRef = useRef<{
    pointer: Point
    position: Point
  } | null>(null)

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement

    if (target.closest('[data-port], input, textarea, select, button')) return
    if (event.button !== 0) return

    event.stopPropagation()
    setSelectedNode(node.id)
    dragRef.current = {
      pointer: { x: event.clientX, y: event.clientY },
      position: node.position,
    }

    const move = (moveEvent: PointerEvent) => {
      const start = dragRef.current
      if (!start) return

      updateNodePosition(node.id, {
        x: start.position.x + (moveEvent.clientX - start.pointer.x) / zoom,
        y: start.position.y + (moveEvent.clientY - start.pointer.y) / zoom,
      })
    }

    const up = (upEvent: PointerEvent) => {
      const start = dragRef.current
      if (!start) return

      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      updateNodePosition(node.id, snapPointToGrid({
        x: start.position.x + (upEvent.clientX - start.pointer.x) / zoom,
        y: start.position.y + (upEvent.clientY - start.pointer.y) / zoom,
      }))
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [node.id, node.position, setSelectedNode, updateNodePosition, zoom])

  return {
    onPointerDown,
  }
}
