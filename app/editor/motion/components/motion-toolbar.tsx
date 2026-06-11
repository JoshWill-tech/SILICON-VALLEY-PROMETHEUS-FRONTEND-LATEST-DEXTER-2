'use client'

import { Code2, Hand, ImageIcon, MessageCircle, MousePointer2, Sparkles, Type, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

import type { ToolbarTool } from '../types/motion-editor'
import { useNodeGraph } from '../hooks/use-node-graph'

const tools: Array<{ id: ToolbarTool; label: string; icon: LucideIcon }> = [
  { id: 'cursor', label: 'Cursor', icon: MousePointer2 },
  { id: 'hand', label: 'Pan', icon: Hand },
  { id: 'execute', label: 'Execute', icon: Zap },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'sparkles', label: 'Prompt', icon: Sparkles },
  { id: 'comment', label: 'Comment', icon: MessageCircle },
  { id: 'code', label: 'Code', icon: Code2 },
]

export function MotionToolbar() {
  const { activeTool, executePipeline, setActiveTool } = useNodeGraph()

  return (
    <motion.div
      className="absolute bottom-6 left-1/2 z-40 flex h-11 -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-white/[0.055] px-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md"
      initial={{ opacity: 0, y: 18, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      transition={{ delay: 0.5, duration: 0.42, ease: 'easeOut' }}
      role="toolbar"
    >
      {tools.map((tool) => {
        const Icon = tool.icon
        const active = activeTool === tool.id

        return (
          <button
            aria-label={tool.label}
            className={cn(
              'grid size-8 place-items-center rounded-full text-white/58 outline-none transition hover:bg-white/[0.075] hover:text-white',
              active && 'bg-white/[0.105] text-white',
            )}
            key={tool.id}
            onClick={() => {
              setActiveTool(tool.id)
              if (tool.id === 'execute') executePipeline()
            }}
            title={tool.label}
            type="button"
          >
            <Icon className="size-[18px]" aria-hidden />
          </button>
        )
      })}
    </motion.div>
  )
}
