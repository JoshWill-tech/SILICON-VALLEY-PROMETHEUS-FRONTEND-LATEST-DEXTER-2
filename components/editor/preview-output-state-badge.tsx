'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileVideo,
  Sparkles,
  PlayCircle,
  CheckCircle2,
  History,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type PreviewOutputState =
  | 'source'
  | 'building'
  | 'sample_ready'
  | 'revision_requested'
  | 'export_ready'

interface BadgeConfig {
  icon: React.ElementType
  title: string
  subtitle: string
  accentClass: string
}

const STATE_CONFIGS: Record<PreviewOutputState, BadgeConfig> = {
  source: {
    icon: FileVideo,
    title: 'Source video',
    subtitle: 'Original upload. Creative direction has not been applied yet.',
    accentClass: 'text-blue-400'
  },
  building: {
    icon: Zap,
    title: 'Sharpening your Edit DNA',
    subtitle: 'Mapping your creative direction into a sample preview.',
    accentClass: 'text-amber-400'
  },
  sample_ready: {
    icon: PlayCircle,
    title: 'Preview direction sample',
    subtitle: 'A short sample to review pacing, captions, motion, and tone.',
    accentClass: 'text-[#9ff6e3]'
  },
  revision_requested: {
    icon: History,
    title: 'Revision brief captured',
    subtitle: 'Your feedback is ready to guide the next pass.',
    accentClass: 'text-purple-400'
  },
  export_ready: {
    icon: CheckCircle2,
    title: 'Ready for export',
    subtitle: 'This state will activate once backend rendering is connected.',
    accentClass: 'text-emerald-400'
  }
}

interface PreviewOutputStateBadgeProps {
  state: PreviewOutputState
  className?: string
}

export function PreviewOutputStateBadge({ state, className }: PreviewOutputStateBadgeProps) {
  const config = STATE_CONFIGS[state]
  const Icon = config.icon

  return (
    <div className={cn('pointer-events-none select-none', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]"
        >
          <div className={cn('shrink-0 rounded-full bg-white/5 p-2', config.accentClass)}>
            <Icon className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-[13px] font-semibold tracking-tight text-white/90">
              {config.title}
            </h4>
            <p className="text-[11px] leading-tight text-white/45">
              {config.subtitle}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
