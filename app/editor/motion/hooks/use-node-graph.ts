'use client'

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  createEdgeId,
  createNodeId,
  getPortsForType,
  snapPointToGrid,
  wouldCreateCycle,
} from '../lib/motion-utils'
import type {
  CanvasTransform,
  ConnectionDraft,
  ContextMenuState,
  MotionEdge,
  MotionNode,
  MotionNodeData,
  NodeType,
  Point,
  ToolbarTool,
} from '../types/motion-editor'

type ValidationResult = {
  ok: boolean
  reason?: string
}

type NodeGraphContextValue = {
  activeTool: ToolbarTool
  addEdge: (edge: MotionEdge) => ValidationResult
  addNode: (type: NodeType, position: Point) => MotionNode
  canvasOffset: Point
  connectionDraft: ConnectionDraft
  contextMenu: ContextMenuState
  copiedNodes: MotionNode[]
  duplicateNode: (id: string) => void
  edges: MotionEdge[]
  executePipeline: () => void
  executingEdges: string[]
  invalidPortId: string
  isExecuting: boolean
  nodes: MotionNode[]
  pasteNodes: (position?: Point) => void
  removeEdge: (id: string) => void
  removeNode: (id: string) => void
  selectedEdgeId: string
  selectedNodeId: string
  setActiveTool: (tool: ToolbarTool) => void
  setCanvasTransform: (offset: Point, zoom: number) => void
  setConnectionDraft: (draft: ConnectionDraft) => void
  setContextMenu: (menu: ContextMenuState) => void
  setInvalidPortId: (id: string) => void
  setSelectedEdge: (id: string) => void
  setSelectedNode: (id: string) => void
  updateNodeData: (id: string, data: Partial<MotionNodeData>) => void
  updateNodePosition: (id: string, position: Point) => void
  zoom: number
}

const initialNodes: MotionNode[] = [
  {
    id: 'ai-config-1',
    type: 'ai-config',
    position: { x: 100, y: 300 },
    data: {
      coreModel: 'Claude 4',
      inferenceMode: 'High Quality',
    },
    ...getPortsForType('ai-config'),
  },
  {
    id: 'prompt-1',
    type: 'prompt',
    position: { x: 500, y: 150 },
    data: {
      text: 'A surreal portrait of a human figure covered in blooming wildflowers and greenery, wearing a light beige cap and standing in a sunlit field with warm golden hour lighting and soft depth of field, creating a calm cinematic and dreamy atmosphere with natural tones.',
      model: 'Opus 4.6',
      tokens: 20,
      duration: 10,
    },
    ...getPortsForType('prompt'),
  },
  {
    id: 'image-settings-1',
    type: 'image-settings',
    position: { x: 500, y: 450 },
    data: {
      creativityLevel: 50,
      qualitySteps: 0,
    },
    ...getPortsForType('image-settings'),
  },
  {
    id: 'execute-1',
    type: 'execute',
    position: { x: 700, y: 320 },
    data: {},
    ...getPortsForType('execute'),
  },
  {
    id: 'final-results-1',
    type: 'final-results',
    position: { x: 950, y: 280 },
    data: {
      images: ['/mock/result-1.jpg', '/mock/result-2.jpg', '/mock/result-3.jpg'],
      loading: false,
    },
    ...getPortsForType('final-results'),
  },
]

const initialEdges: MotionEdge[] = [
  { id: 'e1', source: 'ai-config-1', sourcePort: 'output', target: 'prompt-1', targetPort: 'input', animated: true },
  { id: 'e2', source: 'ai-config-1', sourcePort: 'output', target: 'image-settings-1', targetPort: 'input', animated: true },
  { id: 'e3', source: 'prompt-1', sourcePort: 'output', target: 'execute-1', targetPort: 'input-top', animated: true },
  { id: 'e4', source: 'image-settings-1', sourcePort: 'output', target: 'execute-1', targetPort: 'input-bottom', animated: true },
  { id: 'e5', source: 'execute-1', sourcePort: 'output', target: 'final-results-1', targetPort: 'input', animated: true },
]

const defaultCanvasTransform: CanvasTransform = {
  offset: { x: 44, y: 34 },
  zoom: 1,
}

const NodeGraphContext = createContext<NodeGraphContextValue | null>(null)

export function NodeGraphProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<MotionNode[]>(initialNodes)
  const [edges, setEdges] = useState<MotionEdge[]>(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [selectedEdgeId, setSelectedEdgeId] = useState('')
  const [canvasOffset, setCanvasOffset] = useState(defaultCanvasTransform.offset)
  const [zoom, setZoom] = useState(defaultCanvasTransform.zoom)
  const [activeTool, setActiveTool] = useState<ToolbarTool>('cursor')
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [invalidPortId, setInvalidPortIdState] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executingEdges, setExecutingEdges] = useState<string[]>([])
  const [copiedNodes, setCopiedNodes] = useState<MotionNode[]>([])

  const setInvalidPortId = useCallback((id: string) => {
    setInvalidPortIdState(id)

    if (id) {
      window.setTimeout(() => setInvalidPortIdState(''), 420)
    }
  }, [])

  const setCanvasTransform = useCallback((offset: Point, nextZoom: number) => {
    setCanvasOffset(offset)
    setZoom(nextZoom)
  }, [])

  const setSelectedNode = useCallback((id: string) => {
    setSelectedNodeId(id)
    if (id) setSelectedEdgeId('')
  }, [])

  const setSelectedEdge = useCallback((id: string) => {
    setSelectedEdgeId(id)
    if (id) setSelectedNodeId('')
  }, [])

  const updateNodePosition = useCallback((id: string, position: Point) => {
    setNodes((current) =>
      current.map((node) => (node.id === id ? { ...node, position } : node)),
    )
  }, [])

  const updateNodeData = useCallback((id: string, data: Partial<MotionNodeData>) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    )
  }, [])

  const addNode = useCallback((type: NodeType, position: Point) => {
    const id = createNodeId(type)
    const node: MotionNode = {
      id,
      type,
      position: snapPointToGrid(position),
      data: createDefaultNodeData(type),
      ...getPortsForType(type),
    }

    setNodes((current) => [...current, node])
    setSelectedNodeId(id)
    setSelectedEdgeId('')
    return node
  }, [])

  const removeNode = useCallback((id: string) => {
    setNodes((current) => current.filter((node) => node.id !== id))
    setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id))
    setSelectedNodeId((current) => (current === id ? '' : current))
  }, [])

  const removeEdge = useCallback((id: string) => {
    setEdges((current) => current.filter((edge) => edge.id !== id))
    setSelectedEdgeId((current) => (current === id ? '' : current))
  }, [])

  const addEdge = useCallback((edge: MotionEdge): ValidationResult => {
    const source = nodes.find((node) => node.id === edge.source)
    const target = nodes.find((node) => node.id === edge.target)
    const sourcePort = source?.outputs.find((port) => port.id === edge.sourcePort)
    const targetPort = target?.inputs.find((port) => port.id === edge.targetPort)

    if (!source || !target || !sourcePort || !targetPort) {
      return { ok: false, reason: 'Missing port. Even the graph noticed.' }
    }

    if (edge.source === edge.target || sourcePort.type !== targetPort.type) {
      return { ok: false, reason: 'Invalid port type.' }
    }

    if (edges.some((current) => current.source === edge.source && current.sourcePort === edge.sourcePort && current.target === edge.target && current.targetPort === edge.targetPort)) {
      return { ok: false, reason: 'Duplicate edge.' }
    }

    if (edges.some((current) => current.target === edge.target && current.targetPort === edge.targetPort)) {
      return { ok: false, reason: 'Input already occupied.' }
    }

    if (wouldCreateCycle(edges, edge.source, edge.target)) {
      return { ok: false, reason: 'Cycles are for people who enjoy debugging eternity.' }
    }

    setEdges((current) => [...current, edge])
    setSelectedEdgeId(edge.id)
    setSelectedNodeId('')
    return { ok: true }
  }, [edges, nodes])

  const duplicateNode = useCallback((id: string) => {
    const node = nodes.find((current) => current.id === id)
    if (!node) return

    const duplicate: MotionNode = {
      ...node,
      id: createNodeId(node.type),
      position: snapPointToGrid({ x: node.position.x + 48, y: node.position.y + 48 }),
      data: { ...node.data },
    }

    setNodes((current) => [...current, duplicate])
    setSelectedNodeId(duplicate.id)
    setSelectedEdgeId('')
  }, [nodes])

  const pasteNodes = useCallback((position?: Point) => {
    if (copiedNodes.length === 0) return

    const first = copiedNodes[0]
    const pasted = copiedNodes.map((node, index) => ({
      ...node,
      id: createNodeId(node.type),
      position: snapPointToGrid(position
        ? { x: position.x + index * 32, y: position.y + index * 32 }
        : { x: node.position.x + 64, y: node.position.y + 64 }),
      data: { ...node.data },
    }))

    setNodes((current) => [...current, ...pasted])
    setSelectedNodeId(pasted[0]?.id ?? first.id)
    setSelectedEdgeId('')
  }, [copiedNodes])

  const executePipeline = useCallback(() => {
    setIsExecuting(true)
    setExecutingEdges([])
    setNodes((current) =>
      current.map((node) =>
        node.type === 'final-results'
          ? { ...node, data: { ...node.data, loading: true } }
          : node,
      ),
    )

    const waves = [['e1', 'e2'], ['e3', 'e4'], ['e5']]
    waves.forEach((wave, index) => {
      window.setTimeout(() => {
        setExecutingEdges(wave)
      }, index * 720)
    })

    window.setTimeout(() => {
      setExecutingEdges([])
      setIsExecuting(false)
      setNodes((current) =>
        current.map((node) =>
          node.type === 'final-results'
            ? { ...node, data: { ...node.data, loading: false } }
          : node,
        ),
      )
    }, 2600)
  }, [])

  const value = useMemo<NodeGraphContextValue>(() => ({
    activeTool,
    addEdge,
    addNode,
    canvasOffset,
    connectionDraft,
    contextMenu,
    copiedNodes,
    duplicateNode,
    edges,
    executePipeline,
    executingEdges,
    invalidPortId,
    isExecuting,
    nodes,
    pasteNodes,
    removeEdge,
    removeNode,
    selectedEdgeId,
    selectedNodeId,
    setActiveTool,
    setCanvasTransform,
    setConnectionDraft,
    setContextMenu,
    setInvalidPortId,
    setSelectedEdge,
    setSelectedNode,
    updateNodeData,
    updateNodePosition,
    zoom,
  }), [
    activeTool,
    addEdge,
    addNode,
    canvasOffset,
    connectionDraft,
    contextMenu,
    copiedNodes,
    duplicateNode,
    edges,
    executePipeline,
    executingEdges,
    invalidPortId,
    isExecuting,
    nodes,
    pasteNodes,
    removeEdge,
    removeNode,
    selectedEdgeId,
    selectedNodeId,
    setCanvasTransform,
    setInvalidPortId,
    setSelectedEdge,
    setSelectedNode,
    updateNodeData,
    updateNodePosition,
    zoom,
  ])

  return createElement(
    NodeGraphContext.Provider,
    { value },
    children,
    createElement(GraphKeyboardController, {
      duplicateNode,
      executePipeline,
      nodes,
      pasteNodes,
      removeEdge,
      removeNode,
      selectedEdgeId,
      selectedNodeId,
      setActiveTool,
      setCanvasTransform,
      setCopiedNodes,
      setSelectedNode,
      transform: { offset: canvasOffset, zoom },
    }),
  )
}

export function useNodeGraph() {
  const context = useContext(NodeGraphContext)

  if (!context) {
    throw new Error('useNodeGraph must be used inside NodeGraphProvider')
  }

  return context
}

function GraphKeyboardController({
  duplicateNode,
  executePipeline,
  nodes,
  pasteNodes,
  removeEdge,
  removeNode,
  selectedEdgeId,
  selectedNodeId,
  setActiveTool,
  setCanvasTransform,
  setCopiedNodes,
  setSelectedNode,
  transform,
}: {
  duplicateNode: (id: string) => void
  executePipeline: () => void
  nodes: MotionNode[]
  pasteNodes: (position?: Point) => void
  removeEdge: (id: string) => void
  removeNode: (id: string) => void
  selectedEdgeId: string
  selectedNodeId: string
  setActiveTool: (tool: ToolbarTool) => void
  setCanvasTransform: (offset: Point, zoom: number) => void
  setCopiedNodes: (nodes: MotionNode[]) => void
  setSelectedNode: (id: string) => void
  transform: CanvasTransform
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = Boolean(target?.closest('input, textarea, select, [contenteditable="true"]'))
      if (isTyping) return

      const key = event.key.toLowerCase()
      const command = event.metaKey || event.ctrlKey
      const toolMap: Record<string, ToolbarTool> = {
        '1': 'cursor',
        '2': 'hand',
        '3': 'execute',
        '4': 'image',
        '5': 'text',
        '6': 'sparkles',
        '7': 'comment',
        '8': 'code',
      }

      if (toolMap[event.key]) {
        setActiveTool(toolMap[event.key])
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId) removeNode(selectedNodeId)
        if (selectedEdgeId) removeEdge(selectedEdgeId)
        return
      }

      if (key === 'a' && command) {
        event.preventDefault()
        setSelectedNode(nodes[0]?.id ?? '')
        return
      }

      if (key === 'c' && command && selectedNodeId) {
        event.preventDefault()
        const node = nodes.find((current) => current.id === selectedNodeId)
        setCopiedNodes(node ? [node] : [])
        return
      }

      if (key === 'v' && command) {
        event.preventDefault()
        pasteNodes()
        return
      }

      if (key === 'd' && command && selectedNodeId) {
        event.preventDefault()
        duplicateNode(selectedNodeId)
        return
      }

      if (event.key === '+' || event.key === '=') {
        setCanvasTransform(transform.offset, Math.min(2, transform.zoom + 0.1))
        return
      }

      if (event.key === '-') {
        setCanvasTransform(transform.offset, Math.max(0.25, transform.zoom - 0.1))
        return
      }

      if (event.key === '0') {
        setCanvasTransform({ x: 44, y: 34 }, 1)
        return
      }

      if (key === 'enter') {
        executePipeline()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    duplicateNode,
    executePipeline,
    nodes,
    pasteNodes,
    removeEdge,
    removeNode,
    selectedEdgeId,
    selectedNodeId,
    setActiveTool,
    setCanvasTransform,
    setCopiedNodes,
    setSelectedNode,
    transform.offset,
    transform.zoom,
  ])

  return null
}

function createDefaultNodeData(type: NodeType): MotionNodeData {
  if (type === 'ai-config') {
    return { coreModel: 'Claude 4', inferenceMode: 'High Quality' }
  }

  if (type === 'prompt') {
    return {
      text: 'A quiet cinematic prompt enters the graph. Configure it before pretending the machine understands taste.',
      model: 'Opus 4.6',
      tokens: 12,
      duration: 6,
    }
  }

  if (type === 'image-settings') {
    return { creativityLevel: 50, qualitySteps: 24 }
  }

  if (type === 'final-results') {
    return { images: ['/mock/result-1.jpg', '/mock/result-2.jpg', '/mock/result-3.jpg'], loading: false }
  }

  if (type === 'image') {
    return { title: 'Image Input', body: 'Drop or connect a frame source.', tone: 'visual' }
  }

  if (type === 'text') {
    return { title: 'Text Block', body: 'Editable text payload for downstream nodes.', tone: 'text' }
  }

  if (type === 'comment') {
    return { title: 'Comment', body: 'Explain the obvious, but at least keep it short.', tone: 'note' }
  }

  if (type === 'code') {
    return { title: 'Function', body: 'return frame.map(applyMotion);', tone: 'code' }
  }

  return {}
}
