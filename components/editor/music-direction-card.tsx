'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Music4,
  Zap,
  Activity,
  MicOff,
  ShieldCheck,
  Ban,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronRight,
  Wand2,
  Check,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MusicDirectionIntent } from '@/lib/types'

interface MusicDirectionCardProps {
  intent: MusicDirectionIntent
  onModify: (action: string) => void
  reasoning?: string
  className?: string
}

export function MusicDirectionCard({
  intent,
  onModify,
  reasoning,
  className
}: MusicDirectionCardProps) {
  const [locked, setLocked] = React.useState(false)

  const handleModify = (action: string) => {
    if (action === 'keep') {
      setLocked(true)
    }
    onModify(action)
  }

  return (
    <motion.div
      layout
      className={cn(
        "relative overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,rgba(16,18,24,0.95)_0%,rgba(10,10,14,0.98)_100%)] p-6 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.9)] backdrop-blur-2xl",
        locked ? "border-emerald-500/20" : "border-white/10",
        className
      )}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute -inset-px rounded-[28px] opacity-50 transition-opacity duration-500">
        <div className={cn(
          "absolute inset-x-0 -top-px mx-auto h-[1px] w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent",
          locked ? "via-emerald-400/50" : "via-white/30"
        )} />
      </div>

      {/* Top Badges */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[#7ff2d4]/20 bg-[#7ff2d4]/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[#7ff2d4]">
          <Award className="size-3.5" />
          Recommended for your brief
        </div>

        {intent.voiceoverSafe && (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium tracking-wide text-emerald-300">
            <ShieldCheck className="size-3.5" />
            Voiceover Safe
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start gap-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] shadow-inner shadow-white/5">
          <Music4 className="size-7 text-white/80" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-white/95">
            {intent.emotion} Direction
          </h3>
          {reasoning && (
            <p className="max-w-[90%] text-[13px] leading-relaxed text-white/60">
              {reasoning}
            </p>
          )}
        </div>
      </div>

      {/* Grid of Intent Details */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="col-span-1 space-y-4">
          <IntentMetric
            icon={Activity}
            label="Energy"
            value={intent.energy}
            color="amber"
          />
          <IntentMetric
            icon={Zap}
            label="Tempo"
            value={intent.bpmRange}
            sub="BPM"
            color="cyan"
          />
          <IntentMetric
            icon={MicOff}
            label="Vocals"
            value={intent.vocalPolicy.replace(/_/g, ' ')}
            color="rose"
          />
        </div>

        <div className="col-span-2 flex flex-col gap-4">
          <div className="flex-1 rounded-[20px] border border-white/6 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.03]">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
              Instrumentation
            </div>
            <div className="flex flex-wrap gap-2">
              {intent.instrumentation.map(item => (
                <span key={item} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] font-medium text-white/70">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {intent.avoid.length > 0 && (
            <div className="rounded-[20px] border border-rose-500/10 bg-rose-500/[0.02] p-4 transition-colors hover:bg-rose-500/[0.04]">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-rose-400/50">
                <Ban className="size-3.5" />
                Avoiding
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {intent.avoid.map(term => (
                  <span key={term} className="text-[12px] font-medium text-rose-200/60">
                    • {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">
            {locked ? 'Direction Locked' : 'Refine Soundtrack'}
          </span>
          {!locked && (
            <span className="text-[11px] text-white/40">
              Select an option to update the preview
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            icon={Check}
            label={locked ? "Direction Kept" : "Keep this"}
            primary
            active={locked}
            onClick={() => handleModify('keep')}
          />

          <div className="mx-2 h-8 w-px bg-white/10" />

          <ActionButton
            icon={Volume2}
            label="Softer"
            onClick={() => handleModify('softer')}
            disabled={locked}
          />
          <ActionButton
            icon={Sparkles}
            label="More cinematic"
            onClick={() => handleModify('cinematic')}
            disabled={locked}
          />
          <ActionButton
            icon={Zap}
            label="More energetic"
            onClick={() => handleModify('energetic')}
            disabled={locked}
          />
          <ActionButton
            icon={MicOff}
            label="Less distracting"
            onClick={() => handleModify('less-distracting')}
            disabled={locked}
          />

          <div className="mx-2 h-8 w-px bg-white/10" />

          <ActionButton
            icon={VolumeX}
            label="Remove music"
            danger
            onClick={() => handleModify('remove')}
            disabled={locked}
          />

          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModify('pick-another')}
            disabled={locked}
            className={cn(
              "ml-auto flex items-center gap-1.5 px-2 py-2 text-[12px] font-medium transition-colors",
              locked ? "text-white/20 cursor-not-allowed" : "text-white/40 hover:text-white/90"
            )}
          >
            Pick another direction
            <ChevronRight className="size-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function IntentMetric({
  icon: Icon,
  label,
  value,
  sub,
  color
}: {
  icon: any,
  label: string,
  value: string,
  sub?: string,
  color: 'amber' | 'cyan' | 'rose' | 'emerald'
}) {
  const colorClasses = {
    amber: "text-amber-400/80 bg-amber-400/5 border-amber-400/20 group-hover:bg-amber-400/10",
    cyan: "text-cyan-400/80 bg-cyan-400/5 border-cyan-400/20 group-hover:bg-cyan-400/10",
    rose: "text-rose-400/80 bg-rose-400/5 border-rose-400/20 group-hover:bg-rose-400/10",
    emerald: "text-emerald-400/80 bg-emerald-400/5 border-emerald-400/20 group-hover:bg-emerald-400/10"
  }

  return (
    <div className="group flex items-center gap-3 rounded-[16px] border border-white/6 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors", colorClasses[color])}>
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-white/30">{label}</span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-[13px] font-semibold capitalize text-white/85">{value}</span>
          {sub && <span className="text-[10px] font-medium text-white/30">{sub}</span>}
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary,
  danger,
  active,
  disabled
}: {
  icon: any,
  label: string,
  onClick: () => void,
  primary?: boolean,
  danger?: boolean,
  active?: boolean,
  disabled?: boolean
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-semibold transition-all duration-200",
        disabled && "opacity-50 cursor-not-allowed",
        primary
          ? active
            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:border-emerald-500/50 hover:bg-emerald-500/20"
          : danger
            ? "border-white/10 bg-white/5 text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10"
            : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
      )}
    >
      <Icon className={cn(
        "size-4 transition-colors",
        primary
          ? active ? "text-emerald-300" : "text-emerald-400"
          : danger
            ? "text-rose-400"
            : "text-white/40 group-hover:text-white/90"
      )} />
      {label}
    </motion.button>
  )
}
