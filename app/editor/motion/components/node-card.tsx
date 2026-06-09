'use client'

import {
  Bot,
  Code2,
  FileText,
  Grid2X2,
  ImageIcon,
  MessageCircle,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

import { useAnimationSequence } from '../hooks/use-animation-sequence'
import { useNodeDrag } from '../hooks/use-node-drag'
import { NODE_SIZE } from '../lib/motion-utils'
import type { GenericNodeData, MotionNode, NodeChrome } from '../types/motion-editor'
import { ConnectionPort } from './connection-port'
import { AiConfigNode } from './node-types/ai-config-node'
import { ExecuteNode } from './node-types/execute-node'
import { FinalResultsNode } from './node-types/final-results-node'
import { ImageSettingsNode } from './node-types/image-settings-node'
import { PromptNode } from './node-types/prompt-node'
import { useNodeGraph } from '../hooks/use-node-graph'

const nodeChrome: Record<MotionNode['type'], NodeChrome> = {
  'ai-config': { title: 'AI Configuration', icon: Bot },
  prompt: { title: 'Prompt', icon: Sparkles },
  'image-settings': { title: 'Image Settings', icon: SlidersHorizontal },
  execute: { title: 'Execute', icon: Zap },
  'final-results': { title: 'Final Results', icon: Grid2X2 },
  image: { title: 'Image', icon: ImageIcon },
  text: { title: 'Text', icon: FileText },
  comment: { title: 'Comment', icon: MessageCircle },
  code: { title: 'Code', icon: Code2 },
}

export function NodeCard({ node }: { node: MotionNode }) {
  const { nodeEntranceDelays } = useAnimationSequence()
  const { onPointerDown } = useNodeDrag(node)
  const { selectedNodeId, setContextMenu, setSelectedNode } = useNodeGraph()
  const chrome = nodeChrome[node.type]
  const Icon = chrome.icon
  const size = NODE_SIZE[node.type]
  const selected = selectedNodeId === node.id

  if (node.type === 'execute') {
    return (
      <motion.div
        className="absolute cursor-grab active:cursor-grabbing"
        data-node-id={node.id}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: selected ? 1.04 : 1 }}
        whileHover={{ scale: selected ? 1.04 : 1.02 }}
        transition={{
          delay: nodeEntranceDelays[node.id] ?? 0,
          scale: { type: 'spring', stiffness: 390, damping: 17 },
          opacity: { duration: 0.28 },
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setSelectedNode(node.id)
          setContextMenu({ type: 'node', nodeId: node.id, screen: { x: event.clientX, y: event.clientY } })
        }}
        onPointerDown={onPointerDown}
        style={{
          height: size.height,
          left: node.position.x,
          top: node.position.y,
          width: size.width,
        }}
      >
        <ExecuteNode />
        {node.inputs.map((port) => (
          <ConnectionPort direction="input" key={port.id} node={node} port={port} />
        ))}
        {node.outputs.map((port) => (
          <ConnectionPort direction="output" key={port.id} node={node} port={port} />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.article
      className={cn(
        'absolute cursor-grab rounded-xl border bg-white/[0.052] p-4 text-white shadow-[0_4px_24px_rgba(0,0,0,0.42),0_1px_2px_rgba(0,0,0,0.32)] backdrop-blur-md transition-colors active:cursor-grabbing',
        selected
          ? 'border-[#22c55e]/70 shadow-[0_0_0_1px_rgba(34,197,94,0.22),0_8px_32px_rgba(0,0,0,0.52)]'
          : 'border-white/[0.085] hover:border-white/[0.15]',
      )}
      data-node-id={node.id}
      initial={{ opacity: 0, scale: 0.9, x: entranceX(node.type), y: entranceY(node.type) }}
      animate={{ opacity: 1, scale: selected ? 1.02 : 1, x: 0, y: 0 }}
      transition={{ delay: nodeEntranceDelays[node.id] ?? 0.18, duration: 0.48, ease: [0.2, 0.78, 0.2, 1] }}
      onClick={(event) => {
        event.stopPropagation()
        setSelectedNode(node.id)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setSelectedNode(node.id)
        setContextMenu({ type: 'node', nodeId: node.id, screen: { x: event.clientX, y: event.clientY } })
      }}
      onPointerDown={onPointerDown}
      style={{
        minHeight: size.height,
        left: node.position.x,
        top: node.position.y,
        width: size.width,
      }}
    >
      <div className="pointer-events-none absolute right-3 top-3 size-1.5 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.85)] motion-status-dot" />
      <header className="mb-4 flex items-center gap-2 pr-5">
        <span className="grid size-6 place-items-center rounded-md bg-white/[0.055] text-white/72">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="text-[14px] font-medium leading-none tracking-normal text-white">{chrome.title}</h2>
      </header>
      {renderNodeContent(node)}
      {node.inputs.map((port) => (
        <ConnectionPort direction="input" key={port.id} node={node} port={port} />
      ))}
      {node.outputs.map((port) => (
        <ConnectionPort direction="output" key={port.id} node={node} port={port} />
      ))}
    </motion.article>
  )
}

function renderNodeContent(node: MotionNode) {
  if (node.type === 'ai-config') return <AiConfigNode node={node} />
  if (node.type === 'prompt') return <PromptNode node={node} />
  if (node.type === 'image-settings') return <ImageSettingsNode node={node} />
  if (node.type === 'final-results') return <FinalResultsNode node={node} />

  const data = node.data as GenericNodeData

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-[12px] leading-5 text-white/65">
        {data.body ?? 'Route some data through here. Revolutionary.'}
      </div>
      {node.type === 'image' ? (
        <div className="h-20 rounded-lg bg-[radial-gradient(circle_at_34%_28%,rgba(250,216,117,0.8),transparent_28%),linear-gradient(135deg,#1e4327,#8bbf63_52%,#f4ca77)]" />
      ) : null}
      {node.type === 'code' ? (
        <pre className="overflow-hidden rounded-lg bg-black/30 p-3 text-[11px] leading-5 text-[#86efac]">
          <code>{data.body ?? 'return input'}</code>
        </pre>
      ) : null}
    </div>
  )
}

function entranceX(type: MotionNode['type']) {
  if (type === 'ai-config') return -28
  if (type === 'final-results') return 28
  return 0
}

function entranceY(type: MotionNode['type']) {
  if (type === 'prompt') return -28
  if (type === 'image-settings') return 28
  return 0
}
