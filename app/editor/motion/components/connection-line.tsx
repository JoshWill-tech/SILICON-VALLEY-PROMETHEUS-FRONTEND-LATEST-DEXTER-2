'use client'

import { motion } from 'framer-motion'

import { getEdgeGeometry } from '../lib/motion-utils'
import type { MotionEdge, MotionNode } from '../types/motion-editor'
import { useAnimationSequence } from '../hooks/use-animation-sequence'
import { useNodeGraph } from '../hooks/use-node-graph'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'

export function ConnectionLine({
  edge,
  nodes,
}: {
  edge: MotionEdge
  nodes: MotionNode[]
}) {
  const geometry = getEdgeGeometry(edge, nodes)
  const { edgeEntranceDelays } = useAnimationSequence()
  const { executingEdges, selectedEdgeId, setContextMenu, setSelectedEdge } = useNodeGraph()
  const reduceMotion = useStableReducedMotion()

  if (!geometry) return null

  const active = selectedEdgeId === edge.id
  const executing = executingEdges.includes(edge.id)

  return (
    <g
      onClick={(event) => {
        event.stopPropagation()
        setSelectedEdge(edge.id)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setSelectedEdge(edge.id)
        setContextMenu({ type: 'edge', edgeId: edge.id, screen: { x: event.clientX, y: event.clientY } })
      }}
    >
      <path
        d={geometry.path}
        fill="none"
        stroke="transparent"
        strokeLinecap="round"
        strokeWidth="18"
      />
      <motion.path
        d={geometry.path}
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: edgeEntranceDelays[edge.id] ?? 0.12, duration: 0.55, ease: 'easeOut' }}
        stroke={active ? '#86efac' : 'url(#motionEdgeGradient)'}
        strokeLinecap="round"
        strokeWidth={active ? 3 : 2}
        style={{
          filter: executing
            ? 'drop-shadow(0 0 10px rgba(34,197,94,0.8))'
            : 'drop-shadow(0 0 4px rgba(34,197,94,0.45))',
        }}
      />
      {edge.animated && !reduceMotion ? (
        <circle r={executing ? 4.5 : 3.25} fill="#22c55e" style={{ filter: 'drop-shadow(0 0 7px rgba(34,197,94,0.62))' }}>
          <animateMotion dur={executing ? '3.6s' : '8.5s'} path={geometry.path} repeatCount="indefinite" />
        </circle>
      ) : null}
    </g>
  )
}
