'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Monitor, 
  Smartphone, 
  Users, 
  Zap, 
  Check, 
  X,
  MessageSquare,
  ChevronRight,
  Target
} from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { chamberEase, chamberSpring } from '@/lib/chamber-motion'
import { cn } from '@/lib/utils'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import type { CreativeMetadata } from '@/lib/editorial-frame/types'

const MOODS = [
  { id: 'epic', label: 'Epic', icon: Zap },
  { id: 'intimate', label: 'Intimate', icon: Users },
  { id: 'fast', label: 'Fast-paced', icon: Sparkles },
  { id: 'cinematic', label: 'Cinematic', icon: Target },
]

const PLATFORMS = [
  { id: 'instagram_reels', label: 'Reels/TikTok', icon: Smartphone, aspect: '9:16' },
  { id: 'youtube', label: 'YouTube', icon: Monitor, aspect: '16:9' },
  { id: 'linkedin', label: 'Professional', icon: Users, aspect: '4:5' },
]

const AUDIENCES = [
  { id: 'general', label: 'General' },
  { id: 'tech', label: 'Tech/SaaS' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'educational', label: 'Educational' },
]

const INTENSITIES: { id: CreativeMetadata['intensity']; label: string }[] = [
  { id: 'subtle', label: 'Subtle' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'bold', label: 'Bold' },
  { id: 'maximum', label: 'Maximum' },
]

interface CommandOverlayShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { prompt: string; metadata: CreativeMetadata }) => void
  initialPrompt?: string
}

export function CommandOverlayShell({
  open,
  onOpenChange,
  onSubmit,
  initialPrompt = '',
}: CommandOverlayShellProps) {
  const reduceMotion = useStableReducedMotion()
  const [prompt, setPrompt] = React.useState(initialPrompt)
  const [mood, setMood] = React.useState<string | undefined>()
  const [platform, setPlatform] = React.useState<string | undefined>()
  const [audience, setAudience] = React.useState<string | undefined>()
  const [styleId, setStyleId] = React.useState<string | undefined>()
  const [intensity, setIntensity] = React.useState<CreativeMetadata['intensity']>('balanced')
  const [rememberPreference, setRememberPreference] = React.useState(false)
  const [optionalNotes, setOptionalNotes] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setPrompt(initialPrompt)
    }
  }, [open, initialPrompt])

  const handleApply = () => {
    onSubmit({
      prompt,
      metadata: {
        mood,
        platform,
        audience,
        styleId,
        intensity,
        rememberPreference,
        optionalNotes: optionalNotes.trim() || undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] overflow-hidden border-white/10 bg-[#040611]/98 p-0 shadow-[0_40px_120px_-48px_rgba(0,0,0,0.98)]">
        <div className="relative overflow-hidden">
          {/* Premium Background Effects */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(146,163,255,0.12)_0%,rgba(127,242,212,0.06)_24%,rgba(4,6,17,0)_56%),linear-gradient(180deg,rgba(5,8,18,0.72)_0%,rgba(4,6,17,1)_56%)]"
          />
          
          <div className="relative flex flex-col p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#7ff2d4]">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-medium tracking-tight text-white">
                    Creative Direction
                  </DialogTitle>
                  <DialogDescription className="text-white/40 text-sm">
                    Shape the cinematic intent of your project.
                  </DialogDescription>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full hover:bg-white/5 text-white/30 hover:text-white"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="grid gap-8">
              {/* Primary Instruction */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
                  <MessageSquare className="size-3" />
                  Primary Instruction
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the overall vision or specific edits..."
                  className="min-h-[120px] resize-none border-white/10 bg-white/[0.03] text-lg italic tracking-tight text-white placeholder:text-white/20 focus:border-white/20 focus:ring-0"
                  style={{
                    fontFamily: 'var(--font-newsreader), "Iowan Old Style", "Palatino Linotype", serif',
                  }}
                />
              </section>

              <div className="grid sm:grid-cols-2 gap-8">
                {/* Mood Selection */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
                    <Zap className="size-3" />
                    Mood & Tone
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMood(m.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm",
                          mood === m.id 
                            ? "border-[#7ff2d4]/40 bg-[#7ff2d4]/10 text-white shadow-[0_0_20px_rgba(127,242,212,0.1)]" 
                            : "border-white/5 bg-white/[0.02] text-white/50 hover:border-white/15 hover:bg-white/[0.04]"
                        )}
                      >
                        <m.icon className={cn("size-4", mood === m.id ? "text-[#7ff2d4]" : "text-white/30")} />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Platform Selection */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
                    <Target className="size-3" />
                    Target Platform
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm",
                          platform === p.id 
                            ? "border-blue-400/40 bg-blue-400/10 text-white shadow-[0_0_20px_rgba(96,165,250,0.1)]" 
                            : "border-white/5 bg-white/[0.02] text-white/50 hover:border-white/15 hover:bg-white/[0.04]"
                        )}
                      >
                        <p.icon className={cn("size-4", platform === p.id ? "text-blue-400" : "text-white/30")} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                {/* Audience Selection */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
                    <Users className="size-3" />
                    Target Audience
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {AUDIENCES.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAudience(a.id)}
                        className={cn(
                          "flex items-center justify-center px-3 py-2.5 rounded-xl border transition-all text-sm",
                          audience === a.id 
                            ? "border-amber-400/40 bg-amber-400/10 text-white" 
                            : "border-white/5 bg-white/[0.02] text-white/50 hover:border-white/15 hover:bg-white/[0.04]"
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Intensity Selection */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
                    <Zap className="size-3" />
                    Edit Intensity
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTENSITIES.map((i) => (
                      <button
                        key={i.id}
                        onClick={() => setIntensity(i.id)}
                        className={cn(
                          "px-4 py-2 rounded-full border transition-all text-xs font-medium tracking-wide",
                          intensity === i.id 
                            ? "border-white/40 bg-white text-black" 
                            : "border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60"
                        )}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* Optional Detail */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
                  Optional Details
                </div>
                <input
                  type="text"
                  value={optionalNotes}
                  onChange={(e) => setOptionalNotes(e.target.value)}
                  placeholder="e.g. Avoid rapid cuts at the start, use specific brand color #FF3300"
                  className="w-full bg-white/[0.02] border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:border-white/15 focus:ring-0 outline-none"
                />
              </section>

              {/* Remember Preference */}
              <section className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRememberPreference(!rememberPreference)}
                  className={cn(
                    "flex size-5 items-center justify-center rounded border transition-colors",
                    rememberPreference ? "border-[#7ff2d4] bg-[#7ff2d4] text-black" : "border-white/10 bg-white/5"
                  )}
                >
                  {rememberPreference && <Check className="size-3.5" />}
                </button>
                <span className="text-sm text-white/40">Remember these creative preferences for future edits</span>
              </section>
            </div>

            <div className="mt-10 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-full text-white/40 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="h-12 px-8 rounded-full bg-white text-black hover:bg-white/90 font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-12px_rgba(255,255,255,0.2)]"
              >
                Apply Creative Direction
                <ChevronRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
