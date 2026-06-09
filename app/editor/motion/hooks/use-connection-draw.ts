'use client'

import { useCallback } from 'react'

import { createEdgeId, getPortPoint } from '../lib/motion-utils'
import type { MotionNode, Point } from '../types/motion-editor'
import { useNodeGraph } from './use-node-graph'

export function useConnectionDraw() {
  const {
    addEdge,
    connectionDraft,
    nodes,
    setConnectionDraft,
    setInvalidPortId,
  } = useNodeGraph()

  const startConnection = useCallback((node: MotionNode, portId: string, portType: string) => {
    setConnectionDraft({
      sourceNodeId: node.id,
      sourcePortId: portId,
      sourceType: portType,
      targetPoint: getPortPoint(node, portId, 'output'),
    })
  }, [setConnectionDraft])

  const updateConnectionTarget = useCallback((point: Point) => {
    if (!connectionDraft) return
    setConnectionDraft({
      ...connectionDraft,
      targetPoint: point,
    })
  }, [connectionDraft, setConnectionDraft])

  const finishConnection = useCallback((targetNode: MotionNode, targetPortId: string, targetType: string) => {
    if (!connectionDraft) return

    if (connectionDraft.sourceType !== targetType) {
      setInvalidPortId(`${targetNode.id}:${targetPortId}`)
      setConnectionDraft(null)
      return
    }

    const result = addEdge({
      id: createEdgeId(connectionDraft.sourceNodeId, targetNode.id),
      source: connectionDraft.sourceNodeId,
      sourcePort: connectionDraft.sourcePortId,
      target: targetNode.id,
      targetPort: targetPortId,
      animated: true,
    })

    if (!result.ok) {
      setInvalidPortId(`${targetNode.id}:${targetPortId}`)
    }

    setConnectionDraft(null)
  }, [addEdge, connectionDraft, setConnectionDraft, setInvalidPortId])

  const sourceNode = connectionDraft
    ? nodes.find((node) => node.id === connectionDraft.sourceNodeId)
    : undefined

  return {
    finishConnection,
    sourceNode,
    startConnection,
    updateConnectionTarget,
  }
}
