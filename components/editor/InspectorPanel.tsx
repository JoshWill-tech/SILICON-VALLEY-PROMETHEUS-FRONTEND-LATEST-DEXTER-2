'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, Settings2 } from 'lucide-react'
import { LuxuryVignette } from '@/components/editor/luxury-vignette'
import { buildRevealVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PREVIEW_FRAME_PRESETS } from '@/lib/constants'
import type {
  Project,
  ProcessingJob,
  PreviewFramePreset,
  BottomMode,
  PreviewMediaKind,
  AnimationPlan
} from '@/lib/types'

export interface InspectorPanelProps {
  inspectorViewportRef: React.RefObject<HTMLDivElement | null>
  project: Project | null
  job: ProcessingJob | null
  previewFramePreset: PreviewFramePreset
  clipModeActive: boolean
  fitMode: 'fill' | 'fit'
  scale: number
  offsetX: number
  offsetY: number
  sourceMetrics: any
  hasSourceAsset: boolean
  sourceStageError: string | null
  previewKind: PreviewMediaKind
  transportTime: string
  promptText: string
  previewOverlayPlan: AnimationPlan | null
  bottomMode: BottomMode
  onSetViralClipSplitPreviewActive: (active: boolean) => void
  onSetPreviewFramePreset: (preset: PreviewFramePreset) => void
  onPreviewFrameLabel: (preset: PreviewFramePreset) => string
  onSetFitMode: (mode: 'fill' | 'fit') => void
  onSetScale: (scale: number) => void
  onSetOffsetX: (offset: number) => void
  onSetOffsetY: (offset: number) => void
  onPickSource: () => void
}

export function InspectorPanel({
  inspectorViewportRef,
  project,
  job,
  previewFramePreset,
  clipModeActive,
  fitMode,
  hasSourceAsset,
  onSetViralClipSplitPreviewActive,
  onSetPreviewFramePreset,
  onPreviewFrameLabel,
  onSetFitMode,
  onPickSource,
}: InspectorPanelProps) {
  return (
    <motion.aside
      layout
      className="glass-panel relative flex h-full min-h-0 flex-col overflow-hidden border-y-0 border-r-0 rounded-none bg-abyss/40 backdrop-blur-2xl overscroll-contain lg:col-span-2 xl:col-span-1"
    >
      <LuxuryVignette tone="cool" />
      
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-purple/10 text-accent-purple">
            <BrainCircuit className="size-4" />
          </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Motion Brain</h2>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Frame Controls</p>
        </div>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-white/20 transition-colors hover:bg-white/5 hover:text-white">
          <Settings2 className="size-4" />
        </button>
      </div>

      <div
        ref={inspectorViewportRef}
        className="premium-scroll-mask flex-1 overflow-y-auto px-6 py-6"
      >
        <motion.div
          variants={buildRevealVariants({ delay: 0.1, distance: 20, blur: 10, duration: 0.4 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.052)_0%,rgba(255,255,255,0.026)_100%)] p-4 shadow-[0_28px_70px_-48px_rgba(0,0,0,0.92)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(38,125,255,0.16)_0%,rgba(38,125,255,0)_42%),radial-gradient(circle_at_90%_100%,rgba(159,246,227,0.09)_0%,rgba(159,246,227,0)_44%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">Output frame</div>
              <div className="mt-1 text-sm font-medium text-white/82">{clipModeActive ? 'Short-form cutdown' : 'Canvas format'}</div>
            </div>
            {!hasSourceAsset ? (
              <button
                type="button"
                onClick={onPickSource}
                className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-white/72 transition-colors hover:bg-white/[0.09] hover:text-white"
              >
                Add source
              </button>
            ) : null}
          </div>

          <div className="relative mt-4 grid grid-cols-5 gap-2">
            {PREVIEW_FRAME_PRESETS.map((framePreset) => (
              <button
                key={framePreset}
                type="button"
                onClick={() => {
                  onSetViralClipSplitPreviewActive(false)
                  onSetPreviewFramePreset(framePreset)
                }}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-[16px] border text-[11px] font-bold transition-[border-color,background-color,color,box-shadow] duration-200',
                  previewFramePreset === framePreset
                    ? 'border-[#9ff6e3]/70 bg-[#9ff6e3]/12 text-[#dffdf8] shadow-[0_0_26px_rgba(159,246,227,0.18)]'
                    : 'border-white/8 bg-black/24 text-white/42 hover:border-white/18 hover:text-white/78',
                )}
              >
                {onPreviewFrameLabel(framePreset)}
              </button>
            ))}
          </div>

          <div className="relative mt-3 grid grid-cols-2 gap-2 rounded-[16px] border border-white/8 bg-black/24 p-1">
            {(['fill', 'fit'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onSetFitMode(mode)}
                className={cn(
                  'rounded-[13px] py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-[background-color,color] duration-200',
                  fitMode === mode ? 'bg-white/12 text-white' : 'text-white/34 hover:text-white/68',
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.aside>
  )
}

