import type {
  EdgeGeometry,
  MotionEdge,
  MotionNode,
  NodeType,
  Point,
  PortAnchor,
  PortDirection,
  PortDefinition,
} from '../types/motion-editor'

export const GRID_SIZE = 16
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 2

export const NODE_SIZE: Record<NodeType, { width: number; height: number }> = {
  'ai-config': { width: 304, height: 230 },
  prompt: { width: 330, height: 244 },
  'image-settings': { width: 304, height: 230 },
  execute: { width: 64, height: 64 },
  'final-results': { width: 304, height: 316 },
  image: { width: 280, height: 210 },
  text: { width: 280, height: 190 },
  comment: { width: 280, height: 170 },
  code: { width: 300, height: 198 },
}

const defaultInputs: PortDefinition[] = [{ id: 'input', type: 'flow' }]
const defaultOutputs: PortDefinition[] = [{ id: 'output', type: 'flow' }]

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function snapToGrid(value: number, gridSize = GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize
}

export function snapPointToGrid(point: Point, gridSize = GRID_SIZE): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  }
}

export function screenToCanvas(client: Point, rect: DOMRect, offset: Point, zoom: number): Point {
  return {
    x: (client.x - rect.left - offset.x) / zoom,
    y: (client.y - rect.top - offset.y) / zoom,
  }
}

export function createBezierPath(source: Point, target: Point) {
  const distance = Math.abs(target.x - source.x)
  const control = clamp(distance * 0.42, 56, 180)

  if (Math.abs(source.x - target.x) < 10 && Math.abs(source.y - target.y) > 40) {
    const vertical = clamp(Math.abs(target.y - source.y) * 0.42, 40, 120)
    return `M ${source.x} ${source.y} C ${source.x} ${source.y + vertical}, ${target.x} ${target.y - vertical}, ${target.x} ${target.y}`
  }

  return `M ${source.x} ${source.y} C ${source.x + control} ${source.y}, ${target.x - control} ${target.y}, ${target.x} ${target.y}`
}

export function getPortsForType(type: NodeType): { inputs: PortDefinition[]; outputs: PortDefinition[] } {
  if (type === 'ai-config') {
    return { inputs: [], outputs: defaultOutputs }
  }

  if (type === 'execute') {
    return {
      inputs: [
        { id: 'input-top', type: 'flow' },
        { id: 'input-bottom', type: 'flow' },
      ],
      outputs: defaultOutputs,
    }
  }

  if (type === 'final-results') {
    return { inputs: defaultInputs, outputs: [] }
  }

  return { inputs: defaultInputs, outputs: defaultOutputs }
}

export function getPortAnchor(node: MotionNode, portId: string, direction: PortDirection): PortAnchor {
  const size = NODE_SIZE[node.type]

  if (node.type === 'execute') {
    if (portId === 'input-top') return { x: size.width / 2, y: 0 }
    if (portId === 'input-bottom') return { x: size.width / 2, y: size.height }
    return { x: size.width, y: size.height / 2 }
  }

  if (direction === 'input') {
    return { x: 0, y: size.height / 2 }
  }

  return { x: size.width, y: size.height / 2 }
}

export function getPortPoint(node: MotionNode, portId: string, direction: PortDirection): Point {
  const anchor = getPortAnchor(node, portId, direction)
  return {
    x: node.position.x + anchor.x,
    y: node.position.y + anchor.y,
  }
}

export function getEdgeGeometry(edge: MotionEdge, nodes: MotionNode[]): EdgeGeometry | null {
  const sourceNode = nodes.find((node) => node.id === edge.source)
  const targetNode = nodes.find((node) => node.id === edge.target)

  if (!sourceNode || !targetNode) return null

  const source = getPortPoint(sourceNode, edge.sourcePort, 'output')
  const target = getPortPoint(targetNode, edge.targetPort, 'input')

  return {
    source,
    target,
    path: createBezierPath(source, target),
    mid: {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2,
    },
  }
}

export function wouldCreateCycle(edges: MotionEdge[], source: string, target: string) {
  const graph = new Map<string, string[]>()

  for (const edge of edges) {
    const outgoing = graph.get(edge.source) ?? []
    outgoing.push(edge.target)
    graph.set(edge.source, outgoing)
  }

  const next = graph.get(source) ?? []
  next.push(target)
  graph.set(source, next)

  const stack = [target]
  const visited = new Set<string>()

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || visited.has(current)) continue
    if (current === source) return true
    visited.add(current)
    stack.push(...(graph.get(current) ?? []))
  }

  return false
}

export function createNodeId(type: NodeType) {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEdgeId(source: string, target: string) {
  return `edge-${source}-${target}-${Math.random().toString(36).slice(2, 6)}`
}
