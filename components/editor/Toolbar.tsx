'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Layers3, SlidersHorizontal } from 'lucide-react'
import { ViralClipTrigger } from '@/components/editor/viral-clip-trigger'
import { buildRevealVariants } from '@/lib/motion'
import type { HeaderNavMode } from '@/lib/types'

export interface ToolbarProps {
  activeWorkspaceTab: HeaderNavMode
  clipModeActive: boolean
  viralClipTriggerBusy: boolean
  onLockedHoverChange: (hovered: boolean) => void
  onGenerateViralClips: () => void
  onOpenAiLamp: () => void
}

export function Toolbar({
  activeWorkspaceTab,
  clipModeActive,
  viralClipTriggerBusy,
  onLockedHoverChange,
  onGenerateViralClips,
  onOpenAiLamp,
}: ToolbarProps) {
  if (activeWorkspaceTab === 'Music') return null

  return (
    <motion.div
      variants={buildRevealVariants({ delay: 0.08, distance: 12, blur: 8, duration: 0.26 })}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.45 }}
      className="shrink-0 border-b border-white/8 px-4 py-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 text-white/48">
          <ViralClipTrigger
            active={clipModeActive || viralClipTriggerBusy}
            processing={viralClipTriggerBusy}
            disabled={clipModeActive || viralClipTriggerBusy}
            onLockedHoverChange={onLockedHoverChange}
            onActivate={onGenerateViralClips}
          />
          <button
            type="button"
            onClick={onOpenAiLamp}
            aria-label="Open AI direction"
            className="grid size-9 place-items-center rounded-full border border-white/8 bg-white/[0.02] transition-colors hover:text-white/72"
          >
            <Sparkles className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-white/8 bg-white/[0.02] transition-colors hover:text-white/72"
          >
            <Layers3 className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-white/8 bg-white/[0.02] transition-colors hover:text-white/72"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
