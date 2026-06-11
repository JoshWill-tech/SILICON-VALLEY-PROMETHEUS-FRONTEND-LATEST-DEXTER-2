'use client'

import { motion } from 'framer-motion'

import { getPortAnchor } from '../lib/motion-utils'
import type { MotionNode, PortDefinition, PortDirection } from '../types/motion-editor'
import { useConnectionDraw } from '../hooks/use-connection-draw'
import { useNodeGraph } from '../hooks/use-node-graph'

export function ConnectionPort({
  direction,
  node,
  port,
}: {
  direction: PortDirection
  node: MotionNode
  port: PortDefinition
}) {
  const { connectionDraft, invalidPortId } = useNodeGraph()
  const { finishConnection, startConnection } = useConnectionDraw()
  const anchor = getPortAnchor(node, port.id, direction)
  const invalid = invalidPortId === `${node.id}:${port.id}`
  const occupied = direction === 'input' && Boolean(connectionDraft)

  return (
    <motion.button
      aria-label={`${direction} ${port.id}`}
      className="absolute z-20 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/70 bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.55)] outline-none transition hover:scale-125"
      data-port
      data-port-id={port.id}
      data-port-direction={direction}
      onPointerDown={(event) => {
        if (direction !== 'output') return
        event.stopPropagation()
        startConnection(node, port.id, port.type)
      }}
      onPointerUp={(event) => {
        if (direction !== 'input') return
        event.stopPropagation()
        finishConnection(node, port.id, port.type)
      }}
      animate={{
        backgroundColor: invalid ? '#ef4444' : occupied ? '#86efac' : '#22c55e',
        scale: invalid ? [1, 1.75, 1] : 1,
      }}
      style={{
        left: anchor.x,
        top: anchor.y,
      }}
      type="button"
    />
  )
}
