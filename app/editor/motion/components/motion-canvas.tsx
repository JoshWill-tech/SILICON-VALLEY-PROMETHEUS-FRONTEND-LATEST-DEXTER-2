'use client'

import { useEffect, useRef, useState } from 'react'

import { useCanvasTransform } from '../hooks/use-canvas-transform'
import { useConnectionDraw } from '../hooks/use-connection-draw'
import { useNodeGraph } from '../hooks/use-node-graph'
import type { NodeType, Point, ToolbarTool } from '../types/motion-editor'
import { CanvasGrid } from './canvas-grid'
import { MotionContextMenu } from './context-menu'
import { MotionHeader } from './motion-header'
import { MotionSidebar } from './motion-sidebar'
import { MotionToolbar } from './motion-toolbar'
import { NodeDragPreview } from './node-drag-preview'
import { NodeGraph } from './node-graph'

const placementTypes: Partial<Record<ToolbarTool, NodeType>> = {
  image: 'image',
  text: 'text',
  sparkles: 'prompt',
  comment: 'comment',
  code: 'code',
}

export function MotionCanvas() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const isPanningRef = useRef(false)
  const spaceDownRef = useRef(false)
  const [isCanvasPanning, setIsCanvasPanning] = useState(false)
  const {
    activeTool,
    addNode,
    canvasOffset,
    connectionDraft,
    executePipeline,
    selectedNodeId,
    setActiveTool,
    setConnectionDraft,
    setContextMenu,
    setSelectedEdge,
    setSelectedNode,
    zoom,
  } = useNodeGraph()
  const { beginPan, endPan, panTo, toCanvasPoint, zoomAt } = useCanvasTransform(viewportRef)
  const { updateConnectionTarget } = useConnectionDraw()

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Space') spaceDownRef.current = true
    }
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') spaceDownRef.current = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const placeOrPan = (point: Point) => {
    const placementType = placementTypes[activeTool]

    if (placementType) {
      addNode(placementType, point)
      setActiveTool('cursor')
      return true
    }

    if (activeTool === 'execute') {
      executePipeline()
      setActiveTool('cursor')
      return true
    }

    return false
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-[#0a0a0a] text-white shadow-[0_32px_110px_rgba(0,0,0,0.45)]">
      <div
        className="absolute inset-0 overflow-hidden"
        onClick={() => {
          if (selectedNodeId) setSelectedNode('')
          setSelectedEdge('')
          setContextMenu(null)
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          const point = toCanvasPoint({ x: event.clientX, y: event.clientY })
          setContextMenu({
            type: 'canvas',
            canvas: point,
            screen: { x: event.clientX, y: event.clientY },
          })
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          const target = event.target as HTMLElement
          if (target.closest('[data-node-id], [data-port], button, input, textarea, select')) return

          setContextMenu(null)
          const point = toCanvasPoint({ x: event.clientX, y: event.clientY })
          if (placeOrPan(point)) return

          isPanningRef.current = activeTool === 'hand' || activeTool === 'cursor' || spaceDownRef.current
          if (isPanningRef.current) {
            setIsCanvasPanning(true)
            beginPan({ x: event.clientX, y: event.clientY })
          }
        }}
        onPointerMove={(event) => {
          const point = toCanvasPoint({ x: event.clientX, y: event.clientY })
          if (connectionDraft) updateConnectionTarget(point)
          if (isPanningRef.current) panTo({ x: event.clientX, y: event.clientY })
        }}
        onPointerUp={() => {
          isPanningRef.current = false
          setIsCanvasPanning(false)
          endPan()
          if (connectionDraft) setConnectionDraft(null)
        }}
        onPointerCancel={() => {
          isPanningRef.current = false
          setIsCanvasPanning(false)
          endPan()
          if (connectionDraft) setConnectionDraft(null)
        }}
        onWheel={(event) => {
          event.preventDefault()
          zoomAt({ x: event.clientX, y: event.clientY }, event.deltaY)
        }}
        ref={viewportRef}
        style={{ cursor: activeTool === 'hand' ? 'grab' : activeTool in placementTypes ? 'crosshair' : 'default' }}
      >
        <CanvasGrid offset={canvasOffset} zoom={zoom} />
        <div
          className={`absolute left-0 top-0 h-[1800px] w-[2600px] origin-top-left ${
            isCanvasPanning
              ? 'transition-none'
              : 'transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]'
          }`}
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
            willChange: 'transform',
          }}
        >
          <NodeGraph />
        </div>
      </div>
      <MotionHeader />
      <MotionSidebar />
      <MotionToolbar />
      <MotionContextMenu />
      <NodeDragPreview />
    </div>
  )
}
