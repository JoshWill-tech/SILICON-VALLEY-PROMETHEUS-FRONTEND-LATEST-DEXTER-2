'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Settings2, Sparkles } from 'lucide-react'
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
      className="premium-ambient-panel premium-vignette-surface flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#131317] overscroll-contain lg:col-span-2 xl:col-span-1"
    >
      <LuxuryVignette tone="cool" />
      <motion.div
        variants={buildRevealVariants({ delay: 0.1, distance: 12, blur: 8, duration: 0.26 })}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.45 }}
        className="flex items-center justify-between border-b border-white/8 px-4 py-4"
      >
        <div>
          <TextReveal as="div" text="Video" delay={0.04} className="text-sm text-white" />
          <TextReveal
            as="div"
            text="Transform and frame the current source."
            delay={0.08}
            className="mt-1 text-xs text-white/38"
          />
        </div>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full border border-white/8 bg-white/[0.03] text-white/42 transition-colors hover:text-white/72"
        >
          <Settings2 className="size-4" />
        </button>
      </motion.div>

      <div
        ref={inspectorViewportRef}
        className="premium-scroll-mask min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      >
        <motion.div
          variants={buildRevealVariants({ delay: 0.14, distance: 14, blur: 10, duration: 0.28 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
          className="rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
        >
          <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Frame</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {PREVIEW_FRAME_PRESETS.map((framePreset) => (
              <button
                key={framePreset}
                type="button"
                onClick={() => {
                  onSetViralClipSplitPreviewActive(false)
                  onSetPreviewFramePreset(framePreset)
                }}
                className={cn(
                  'rounded-[12px] border px-3 py-2 text-left text-sm transition-colors',
                  previewFramePreset === framePreset
                    ? 'border-[#267dff]/45 bg-[#267dff]/12 text-white'
                    : 'border-white/8 bg-white/[0.03] text-white/58 hover:border-white/14 hover:bg-white/[0.05] hover:text-white/82',
                )}
              >
                <div className="font-medium text-white/88">{onPreviewFrameLabel(framePreset)}</div>
                <div className="mt-1 text-[11px] text-white/42">
                  {framePreset === 'source' ? 'Uses the source shape.' : `${framePreset} output frame.`}
                </div>
              </button>
            ))}
          </div>
          {clipModeActive ? (
            <div className="mt-3 rounded-[14px] border border-[#9ff6e3]/16 bg-[#9ff6e3]/[0.06] px-3 py-2 text-[11px] leading-5 text-[#dffdf5]">
              Viral clip mode is armed. This preview is stress-testing the cut in a 9:16 delivery frame.
            </div>
          ) : null}
        </motion.div>

        <motion.div
          variants={buildRevealVariants({ delay: 0.18, distance: 14, blur: 10, duration: 0.28 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
          className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
        >
          <div className="text-[10px] uppercase tracking-[0.32em] text-[#c9b7ff]/68">Transform</div>

          <div className="mt-4 rounded-[14px] border border-white/8 bg-[#0d0d12] p-1">
            <div className="grid grid-cols-2 gap-1">
              {(['fill', 'fit'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSetFitMode(mode)}
                  className={cn(
                    'rounded-[10px] px-3 py-2 text-sm transition-colors',
                    fitMode === mode ? 'bg-white/[0.12] text-white' : 'text-white/44 hover:text-white/74',
                  )}
                >
                  {mode === 'fill' ? 'Fill' : 'Fit'}
                </button>
              ))}
            </div>
          </div>

          <InspectorField
            label="Scale"
            value={`${Math.round(scale)}%`}
            viewportRoot={inspectorViewportRef}
            revealDelay={0.18}
          >
            <input
              type="range"
              min={80}
              max={130}
              value={scale}
              onChange={(event) => onSetScale(Number(event.target.value))}
              className="h-1.5 w-full accent-white"
            />
          </InspectorField>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <InspectorNumberField
              label="Offset X"
              value={offsetX}
              onChange={onSetOffsetX}
              viewportRoot={inspectorViewportRef}
              revealDelay={0.22}
            />
            <InspectorNumberField
              label="Offset Y"
              value={offsetY}
              onChange={onSetOffsetY}
              viewportRoot={inspectorViewportRef}
              revealDelay={0.26}
            />
          </div>
        </motion.div>

        <motion.div
          variants={buildRevealVariants({ delay: 0.24, distance: 14, blur: 10, duration: 0.28 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
          className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
        >
          <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Source Profile</div>
          {project?.sourceProfile ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/8 bg-[#0d0d12] px-3 py-1 text-[11px] text-white/74">
                  {formatAspectFamily(project.sourceProfile.aspectFamily)}
                </span>
                <span className="rounded-full border border-white/8 bg-[#0d0d12] px-3 py-1 text-[11px] text-white/74">
                  {formatTimeProfile(project.sourceProfile.timeProfile)}
                </span>
                <span className="rounded-full border border-white/8 bg-[#0d0d12] px-3 py-1 text-[11px] text-white/74">
                  {formatProcessingClass(project.sourceProfile.processingClass)}
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                <InspectorMeta
                  label="Resolution"
                  value={sourceMetrics?.resolution ?? 'Unknown resolution'}
                  viewportRoot={inspectorViewportRef}
                  revealDelay={0.26}
                />
                <InspectorMeta
                  label="Duration"
                  value={sourceMetrics?.duration ?? 'Unknown duration'}
                  viewportRoot={inspectorViewportRef}
                  revealDelay={0.3}
                />
                <InspectorMeta
                  label="Weight"
                  value={formatWeightBucket(project.sourceProfile.weightBucket)}
                  viewportRoot={inspectorViewportRef}
                  revealDelay={0.34}
                />
                <InspectorMeta
                  label="Bucket"
                  value={formatDurationBucket(project.sourceProfile.durationBucket)}
                  viewportRoot={inspectorViewportRef}
                  revealDelay={0.38}
                />
              </div>
            </>
          ) : hasSourceAsset ? (
            <div className="mt-3 rounded-[14px] border border-white/8 bg-[#0d0d12] p-4">
              <div className="text-sm font-medium text-white/88">Source staged</div>
              <div className="mt-1 text-xs leading-5 text-white/46">
                The frame is live. Local profiling will fill in richer source details as they become available.
              </div>
              <button
                type="button"
                onClick={onPickSource}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-3 py-2 text-[11px] font-medium text-black transition-transform hover:scale-[1.01]"
              >
                <Sparkles className="size-3.5" />
                Replace video
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-[14px] border border-white/8 bg-[#0d0d12] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/88">No source attached yet</div>
                  <div className="mt-1 text-xs leading-5 text-white/46">
                    Stage a video in the main frame and the preview will wake up in place.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onPickSource}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white px-3 py-2 text-[11px] font-medium text-black transition-transform hover:scale-[1.01]"
                >
                  <Sparkles className="size-3.5" />
                  Choose video
                </button>
              </div>
              {sourceStageError ? (
                <div className="mt-3 rounded-[12px] border border-rose-400/16 bg-rose-500/8 px-3 py-2 text-[11px] leading-5 text-rose-100/92">
                  {sourceStageError}
                </div>
              ) : null}
            </div>
          )}
        </motion.div>

        <motion.div
          variants={buildRevealVariants({ delay: 0.32, distance: 14, blur: 10, duration: 0.28 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
          className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
        >
          <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Source</div>
          <div className="mt-4 space-y-3 text-sm text-white/68">
            <InspectorMeta
              label="Type"
              value={previewKind === 'image' ? 'Image' : 'Video'}
              viewportRoot={inspectorViewportRef}
              revealDelay={0.34}
            />
            <InspectorMeta
              label="Status"
              value={hasSourceAsset ? (job?.status === 'completed' ? 'Ready' : 'Staging') : 'No source'}
              viewportRoot={inspectorViewportRef}
              revealDelay={0.38}
            />
            <InspectorMeta
              label="Duration"
              value={transportTime}
              viewportRoot={inspectorViewportRef}
              revealDelay={0.42}
            />
            <InspectorMeta
              label="Prompt"
              value={promptText.slice(0, 48)}
              viewportRoot={inspectorViewportRef}
              revealDelay={0.46}
            />
          </div>
        </motion.div>

        <motion.div
          variants={buildRevealVariants({ delay: 0.35, distance: 14, blur: 10, duration: 0.28 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
          className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
        >
          <div className="text-[10px] uppercase tracking-[0.32em] text-[#f4eb72]/72">Preview Rendering</div>
          <div className="mt-3 rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white/84">
                {previewOverlayPlan ? 'Live edit overlay' : 'Direct source preview only'}
              </span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/36">
                {previewOverlayPlan ? 'streaming edit pass' : 'overlays off'}
              </span>
            </div>
            <div className="mt-2 text-xs leading-5 text-white/46">
              {previewOverlayPlan
                ? 'The backend edit stream is painting typographic beats and preset assets directly onto the imported video.'
                : 'Cinematic captions, explainer panels, background washes, and other generated preview treatments will attach here once an edit job starts.'}
            </div>
          </div>

          <div className="mt-3 rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 py-3 text-sm text-white/72">
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/42">Current view</span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                {bottomMode.toLowerCase()}
              </span>
            </div>
            <div className="mt-2 font-medium text-white/88">
              {previewOverlayPlan
                ? 'The editor is rendering the live style lane on top of the uploaded media.'
                : 'The editor is showing the uploaded media without generated video edits.'}
            </div>
            <div className="mt-2 text-xs leading-5 text-white/46">
              {previewOverlayPlan
                ? 'Use the frame controls, crop and fit controls, and playback controls as usual. The style lane is active on top of the imported clip.'
                : 'Use the frame controls, crop and fit controls, and playback controls as usual. The auto-styled cinematic layer is no longer applied on top.'}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={buildRevealVariants({ delay: 0.38, distance: 14, blur: 10, duration: 0.28 })}
          initial="hidden"
          whileInView="visible"
          viewport={{ root: inspectorViewportRef, once: false, amount: 0.4 }}
          className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] p-4"
        >
          <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Queue</div>
          <div className="mt-4 space-y-2">
            {(job?.steps ?? []).map((step, index) => (
              <motion.div
                key={step.key}
                variants={buildRevealVariants({ delay: 0.42 + index * 0.04, distance: 10, blur: 6, duration: 0.24 })}
                initial="hidden"
                whileInView="visible"
                viewport={{ root: inspectorViewportRef, once: false, amount: 0.35 }}
                className="rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/78">{step.title}</span>
                  <span className="text-white/40">{Math.round(step.progress * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-white/[0.54]"
                    style={{ width: `${Math.max(6, Math.round(step.progress * 100))}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.aside>
  )
}

function InspectorField({
  label,
  value,
  children,
  viewportRoot,
  revealDelay = 0,
}: {
  label: string
  value: string
  children: React.ReactNode
  viewportRoot?: React.RefObject<HTMLDivElement | null>
  revealDelay?: number
}) {
  const reduceMotion = useStableReducedMotion()
  return (
    <motion.div
      variants={buildRevealVariants({ delay: revealDelay, distance: 12, blur: 8, duration: 0.26 })}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={reduceMotion ? undefined : { root: viewportRoot, once: false, amount: 0.4 }}
      className="mt-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-white/42">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      {children}
    </motion.div>
  )
}

function InspectorNumberField({
  label,
  value,
  onChange,
  viewportRoot,
  revealDelay = 0,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  viewportRoot?: React.RefObject<HTMLDivElement | null>
  revealDelay?: number
}) {
  const reduceMotion = useStableReducedMotion()
  return (
    <motion.label
      variants={buildRevealVariants({ delay: revealDelay, distance: 12, blur: 8, duration: 0.26 })}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={reduceMotion ? undefined : { root: viewportRoot, once: false, amount: 0.4 }}
      className="block"
    >
      <div className="mb-2 text-xs text-white/42">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 text-sm text-white outline-none transition-colors focus:border-white/16"
      />
    </motion.label>
  )
}

function InspectorMeta({
  label,
  value,
  viewportRoot,
  revealDelay = 0,
}: {
  label: string
  value: string
  viewportRoot?: React.RefObject<HTMLDivElement | null>
  revealDelay?: number
}) {
  const reduceMotion = useStableReducedMotion()
  return (
    <motion.div
      variants={buildRevealVariants({ delay: revealDelay, distance: 10, blur: 6, duration: 0.24 })}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={reduceMotion ? undefined : { root: viewportRoot, once: false, amount: 0.4 }}
      className="flex items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-[#0d0d12] px-3 py-3"
    >
      <span className="text-white/42">{label}</span>
      <span className="max-w-[60%] truncate text-right text-white/78">{value}</span>
    </motion.div>
  )
}
