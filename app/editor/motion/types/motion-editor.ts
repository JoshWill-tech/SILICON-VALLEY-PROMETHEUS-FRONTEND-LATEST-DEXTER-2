import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'

export type Point = {
  x: number
  y: number
}

export type NodeType =
  | 'ai-config'
  | 'prompt'
  | 'image-settings'
  | 'execute'
  | 'final-results'
  | 'image'
  | 'text'
  | 'comment'
  | 'code'

export type PortDirection = 'input' | 'output'

export type PortDefinition = {
  id: string
  label?: string
  type: string
}

export type BaseNodeData = Record<string, unknown>

export type AiConfigData = {
  coreModel: string
  inferenceMode: string
}

export type PromptData = {
  text: string
  model: string
  tokens: number
  duration: number
}

export type ImageSettingsData = {
  creativityLevel: number
  qualitySteps: number
}

export type FinalResultsData = {
  images: string[]
  loading?: boolean
}

export type GenericNodeData = {
  title?: string
  body?: string
  tone?: string
}

export type MotionNodeData =
  | AiConfigData
  | PromptData
  | ImageSettingsData
  | FinalResultsData
  | GenericNodeData
  | BaseNodeData

export type MotionNode = {
  id: string
  type: NodeType
  position: Point
  data: MotionNodeData
  inputs: PortDefinition[]
  outputs: PortDefinition[]
}

export type MotionEdge = {
  id: string
  source: string
  sourcePort: string
  target: string
  targetPort: string
  animated: boolean
}

export type CanvasTransform = {
  offset: Point
  zoom: number
}

export type ToolbarTool =
  | 'cursor'
  | 'hand'
  | 'execute'
  | 'image'
  | 'text'
  | 'sparkles'
  | 'comment'
  | 'code'

export type ConnectionDraft = {
  sourceNodeId: string
  sourcePortId: string
  sourceType: string
  targetPoint: Point
} | null

export type ContextMenuState =
  | {
      type: 'canvas'
      screen: Point
      canvas: Point
    }
  | {
      type: 'node'
      screen: Point
      nodeId: string
    }
  | {
      type: 'edge'
      screen: Point
      edgeId: string
    }
  | null

export type NodeChrome = {
  title: string
  icon: ComponentType<LucideProps>
}

export type PortAnchor = Point

export type EdgeGeometry = {
  source: Point
  target: Point
  path: string
  mid: Point
}
