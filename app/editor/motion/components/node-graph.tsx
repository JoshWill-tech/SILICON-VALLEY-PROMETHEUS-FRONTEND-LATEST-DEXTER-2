'use client'

import { createBezierPath, getPortPoint } from '../lib/motion-utils'
import { useNodeGraph } from '../hooks/use-node-graph'
import { ConnectionLine } from './connection-line'
import { NodeCard } from './node-card'

export function NodeGraph() {
  const { connectionDraft, edges, nodes } = useNodeGraph()
  const draftSource = connectionDraft
    ? nodes.find((node) => node.id === connectionDraft.sourceNodeId)
    : undefined
  const draftSourcePoint = draftSource && connectionDraft
    ? getPortPoint(draftSource, connectionDraft.sourcePortId, 'output')
    : null
  const draftPath = draftSourcePoint && connectionDraft
    ? createBezierPath(draftSourcePoint, connectionDraft.targetPoint)
    : ''

  return (
    <>
      <svg
        className="absolute left-0 top-0 z-10 overflow-visible"
        height="1800"
        width="2600"
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <linearGradient id="motionEdgeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        {edges.map((edge) => (
          <ConnectionLine edge={edge} key={edge.id} nodes={nodes} />
        ))}
        {draftPath ? (
          <path
            d={draftPath}
            fill="none"
            stroke="#86efac"
            strokeDasharray="6 6"
            strokeLinecap="round"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 5px rgba(34,197,94,0.5))' }}
          />
        ) : null}
      </svg>
      <div className="absolute left-0 top-0 z-20">
        {nodes.map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
      </div>
    </>
  )
}
