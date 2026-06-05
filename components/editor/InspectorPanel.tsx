'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Settings2, Sparkles, BrainCircuit, Activity, Zap } from 'lucide-react'
import { TextReveal } from '@/components/editor/text-reveal'
import { LuxuryVignette } from '@/components/editor/luxury-vignette'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { buildRevealVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PREVIEW_FRAME_PRESETS } from '@/lib/constants'
import {
  formatAspectFamily,
  formatTimeProfile,
  formatProcessingClass,
  formatWeightBucket,
  formatDurationBucket,
} from '@/lib/media/source-profile'
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
  scale,
  offsetX,
  offsetY,
  sourceMetrics,
  hasSourceAsset,
  sourceStageError,
  previewKind,
  transportTime,
  promptText,
  previewOverlayPlan,
  bottomMode,
  onSetViralClipSplitPreviewActive,
  onSetPreviewFramePreset,
  onPreviewFrameLabel,
  onSetFitMode,
  onSetScale,
  onSetOffsetX,
  onSetOffsetY,
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
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Configuration Node</p>
          </div>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-white/20 transition-colors hover:bg-white/5 hover:text-white">
          <Settings2 className="size-4" />
        </button>
      </div>

      <div
        ref={inspectorViewportRef}
        className="premium-scroll-mask flex-1 overflow-y-auto px-6 py-6 space-y-8"
      >
        {/* Prompt Node */}
        <motion.div
          variants={buildRevealVariants({ delay: 0.1, distance: 20, blur: 10, duration: 0.4 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative rounded-2xl border border-accent-cyan/20 bg-accent-cyan/5 p-5 shadow-[0_0_30px_rgba(0,240,255,0.05)]"
        >
          <div className="absolute -top-3 left-4 px-2 py-0.5 bg-void border border-accent-cyan/30 rounded text-[9px] font-bold uppercase tracking-widest text-accent-cyan flex items-center gap-1.5">
            <Zap className="size-2.5 fill-current" />
            Prompt Node
          </div>
          
          <div className="text-sm leading-relaxed text-white/90 italic">
            &ldquo;{promptText.slice(0, 120)}{promptText.length > 120 ? '...' : ''}&rdquo;
          </div>
          
          {/* Node Connection Line */}
          <div className="absolute left-1/2 -bottom-8 w-px h-8 bg-gradient-to-b from-accent-cyan/30 to-white/5" />
        </motion.div>

        {/* Settings Node */}
        <motion.div
          variants={buildRevealVariants({ delay: 0.2, distance: 20, blur: 10, duration: 0.4 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 pt-8"
        >
          <div className="absolute -top-3 left-4 px-2 py-0.5 bg-void border border-white/10 rounded text-[9px] font-bold uppercase tracking-widest text-white/40">
            Settings Node
          </div>

          <div className="space-y-6">
            {/* Frame Section */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Output Frame</label>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {PREVIEW_FRAME_PRESETS.map((framePreset) => (
                  <button
                    key={framePreset}
                    onClick={() => {
                      onSetViralClipSplitPreviewActive(false)
                      onSetPreviewFramePreset(framePreset)
                    }}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center rounded-lg border text-[10px] font-bold transition-all',
                      previewFramePreset === framePreset
                        ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'border-white/5 bg-white/[0.02] text-white/30 hover:border-white/20 hover:text-white/60'
                    )}
                  >
                    {onPreviewFrameLabel(framePreset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Transform Section */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Spatial Transform</label>
              
              <div className="grid grid-cols-2 gap-2 p-1 bg-void/60 rounded-xl border border-white/5">
                {(['fill', 'fit'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onSetFitMode(mode)}
                    className={cn(
                      'rounded-lg py-2 text-[11px] font-bold uppercase tracking-widest transition-all',
                      fitMode === mode ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <InspectorField label="Global Scale" value={`${Math.round(scale)}%`}>
                <input
                  type="range"
                  min={80}
                  max={130}
                  value={scale}
                  onChange={(e) => onSetScale(Number(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
                />
              </InspectorField>

              <div className="grid grid-cols-2 gap-4">
                <InspectorNumberField label="Offset X" value={offsetX} onChange={onSetOffsetX} />
                <InspectorNumberField label="Offset Y" value={offsetY} onChange={onSetOffsetY} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final Result / Profile Node */}
        <motion.div
          variants={buildRevealVariants({ delay: 0.3, distance: 20, blur: 10, duration: 0.4 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative rounded-2xl border border-white/5 bg-void/60 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Source Intelligence</label>
            <Activity className="size-3 text-accent-cyan animate-pulse" />
          </div>

          <div className="space-y-2">
            <InspectorMeta label="Res" value={sourceMetrics?.resolution ?? '---'} />
            <InspectorMeta label="Dur" value={sourceMetrics?.duration ?? '---'} />
            <InspectorMeta label="Codec" value="H.264 High 10" />
            <InspectorMeta label="FPS" value="23.976" />
          </div>
        </motion.div>
      </div>
    </motion.aside>
  )
}

function InspectorField({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40 font-medium">{label}</span>
        <span className="text-[10px] font-mono text-accent-cyan">{value}</span>
      </div>
      {children}
    </div>
  )
}

function InspectorNumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] text-white/40 font-medium">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-full rounded-lg border border-white/5 bg-void px-3 font-mono text-xs text-white outline-none focus:border-white/20 transition-colors"
      />
    </div>
  )
}

function InspectorMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
      <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">{label}</span>
      <span className="text-[10px] font-mono text-white/80">{value}</span>
    </div>
  )
}

