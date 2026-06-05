'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Sparkles, Wand2, Film, Music, Type, Box, Search } from 'lucide-react'

import { TextReveal } from '@/components/editor/text-reveal'
import { Plan, type PlanItem } from '@/components/ui/agent-plan'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { STYLE_TEMPLATES, type StyleTemplate } from '@/lib/styles/style-templates'
import type { ProcessingJob } from '@/lib/types'
import { cn } from '@/lib/utils'

interface EditWorkflowPanelProps {
  projectTitle: string
  sourceLabel: string | null
  job: ProcessingJob | null
}

const CATEGORIES = [
  { id: 'clips', label: 'Clips', icon: Film },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'assets', label: 'Assets', icon: Box },
]

export function EditWorkflowPanel({ projectTitle, sourceLabel, job }: EditWorkflowPanelProps) {
  const [activeCategory, setActiveCategory] = React.useState('clips')
  const reduceMotion = useStableReducedMotion()
  
  const planItems = React.useMemo<PlanItem[]>(
    () =>
      (job?.steps ?? []).map((step) => ({
        id: step.key,
        title: step.title,
        status:
          step.status === 'error'
            ? 'error'
            : step.status === 'running'
              ? 'running'
              : step.status === 'completed'
                ? 'completed'
                : 'pending',
        progress: step.progress,
        meta: step.key.replace(/-/g, ' '),
      })),
    [job?.steps],
  )

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: -20 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      className="glass-panel relative flex h-full min-h-0 flex-col overflow-hidden border-y-0 border-l-0 rounded-none bg-abyss/40 backdrop-blur-2xl"
    >
      {/* Category Sidebar */}
      <div className="flex h-full min-h-0">
        <div className="flex w-16 flex-col items-center gap-4 border-r border-white/5 py-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                activeCategory === cat.id
                  ? 'bg-accent-blue/10 text-accent-blue shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                  : 'text-white/20 hover:bg-white/5 hover:text-white/40'
              )}
              title={cat.label}
            >
              <cat.icon className="size-5" />
              {activeCategory === cat.id && (
                <motion.div
                  layoutId="active-cat-indicator"
                  className="absolute -right-[1px] h-6 w-0.5 bg-accent-blue"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-white/20 hover:bg-white/5 hover:text-white transition-colors">
              <Search className="size-4" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeCategory === 'clips' && (
              <>
                {/* Source Clip Card */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative aspect-video w-24 overflow-hidden rounded-lg border border-white/10 bg-black">
                      <Film className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-white/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-white/90">
                        {sourceLabel ?? 'Primary Source'}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                        Source Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Lane Status */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Current Pipeline</label>
                    <div className="flex items-center gap-1.5 rounded-full border border-accent-green/20 bg-accent-green/5 px-2 py-0.5 text-[9px] font-bold text-accent-green uppercase tracking-widest">
                      <Sparkles className="size-2.5" />
                      Ready
                    </div>
                  </div>
                  
                  {job ? (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/34 mb-4">
                        <CheckCircle2 className="size-3.5" />
                        Refinement Pass
                      </div>
                      <Plan items={planItems} className="scale-95 origin-top-left" />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                      <p className="text-[11px] leading-relaxed text-white/30">
                        Describe an edit to start the AI refinement pipeline.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeCategory !== 'clips' && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center opacity-40">
                <Box className="size-8" />
                <p className="text-xs uppercase tracking-widest">No {activeCategory} available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Ambient Info */}
      <div className="border-t border-white/5 bg-void/20 px-6 py-3">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-white/20 font-bold">
          <span>Project: {projectTitle}</span>
          <span>v1.0.4</span>
        </div>
      </div>
    </motion.div>
  )
}

