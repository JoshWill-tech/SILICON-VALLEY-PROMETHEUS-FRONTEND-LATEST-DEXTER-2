'use client'

import React from 'react'
import { Layers, Type, Music, Smile, Mic, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOOLBAR_ITEMS = [
  { id: 'overlay', label: 'Overlay', icon: Layers },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'sound', label: 'Sound', icon: Music },
  { id: 'sticker', label: 'Sticker', icon: Smile },
  { id: 'voiceover', label: 'Voiceover', icon: Mic },
  { id: 'captions', label: 'Captions', icon: MessageSquare },
]

export const MobileToolbar: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] glass-panel rounded-none border-x-0 border-b-0 bg-void/90 backdrop-blur-3xl">
      <div className="flex items-center justify-between px-2 h-[72px] overflow-x-auto scrollbar-none">
        {TOOLBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            className="flex flex-col items-center justify-center min-w-[56px] h-[56px] gap-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          >
            <item.icon className="size-5" />
            <span className="text-[9px] font-medium tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
