'use client'

import { Layers, Mic, Music, Palette, Sticker, Subtitles, Type, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type EditorTool = 'overlay' | 'text' | 'sound' | 'sticker' | 'voiceover' | 'captions' | 'canvas'

type ToolDef = {
  id: EditorTool
  label: string
  icon: LucideIcon
}

const TOOLS: ToolDef[] = [
  { id: 'overlay', label: 'Overlay', icon: Layers },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'sound', label: 'Sound', icon: Music },
  { id: 'sticker', label: 'Sticker', icon: Sticker },
  { id: 'voiceover', label: 'Voiceover', icon: Mic },
  { id: 'captions', label: 'Captions', icon: Subtitles },
  { id: 'canvas', label: 'Canvas', icon: Palette },
]

type BottomToolbarProps = {
  activeTool: EditorTool
  onToolSelect: (tool: EditorTool) => void
}

export function BottomToolbar({ activeTool, onToolSelect }: BottomToolbarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-white/10 bg-black/90 px-2 backdrop-blur-xl lg:right-[320px]">
      {TOOLS.map((tool) => {
        const Icon = tool.icon

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolSelect(tool.id)}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1 text-center transition-colors sm:px-3',
              activeTool === tool.id ? 'text-accent-cyan' : 'text-white/50 hover:text-white/80',
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="max-w-full truncate text-[10px] font-medium">{tool.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
