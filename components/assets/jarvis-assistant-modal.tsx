'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  Zap,
  ArrowRight,
  Send,
  Users,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCreatorRecommendations } from '@/lib/creators/creator-recommendations'
import { useVoiceCompanion } from '@/hooks/use-voice-companion'

export interface JarvisAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  currentQuery?: string
  activeBrandName?: string
  onApplyBrandSpirit?: (brandName: string, queryOrUrl: string) => void
  onSelectRelatedCreator?: (creatorName: string) => void
  className?: string
}

export function JarvisAssistantModal({
  isOpen,
  onClose,
  currentQuery = '',
  activeBrandName = '',
  onApplyBrandSpirit,
  onSelectRelatedCreator,
  className,
}: JarvisAssistantModalProps) {
  const targetSubject = currentQuery.trim() || activeBrandName || 'Neil Patel'
  const recommendations = React.useMemo(() => {
    return getCreatorRecommendations(targetSubject)
  }, [targetSubject])

  const [chatMessages, setChatMessages] = React.useState<Array<{ role: 'jarvis' | 'user'; text: string }>>([])
  const [textInput, setTextInput] = React.useState('')
  const [isVoiceActive, setIsVoiceActive] = React.useState(false)

  // Voice Companion hook integration
  const companion = useVoiceCompanion()

  // Initialize Jarvis opening response when modal opens
  React.useEffect(() => {
    if (!isOpen) {
      setIsVoiceActive(false)
      return
    }

    const matched = recommendations.matchedCreator || targetSubject
    const initialGreeting = recommendations.jarvisInsight ||
      `Greetings. I am Jarvis, your Creative Intelligence Assistant. I have analyzed ${matched}. I can calibrate your video output suite with their signature pacing, typography accents, and high-retention frameworks.`

    setChatMessages([
      {
        role: 'jarvis',
        text: initialGreeting,
      },
    ])
  }, [isOpen, targetSubject, recommendations])

  // ESC key to close
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = textInput.trim()
    if (!text) return

    setChatMessages((prev) => [...prev, { role: 'user', text }])
    setTextInput('')

    // Synthesize Jarvis response
    setTimeout(() => {
      const lower = text.toLowerCase()
      let reply = ''
      if (lower.includes('calibrate') || lower.includes('apply') || lower.includes('spirit') || lower.includes('suit')) {
        const creator = recommendations.matchedCreator || targetSubject
        const topPlatform = recommendations.platformOptions[0]?.handleOrUrl || `https://youtube.com/@${creator.toLowerCase().replace(/\s+/g, '')}`
        onApplyBrandSpirit?.(creator, topPlatform)
        reply = `Understood. Calibrating Prometheus video generation suite and AI cut engines to ${creator}'s brand spirit. Pacing set to 1.8s retention hooks, bold modern typography, and signature visual accents.`
      } else if (lower.includes('related') || lower.includes('who else') || lower.includes('inspire') || lower.includes('channel')) {
        const names = recommendations.relatedCreators.map((c) => c.name).join(', ')
        reply = `In the orbit of ${recommendations.matchedCreator || targetSubject}, I recommend inspecting: ${names}. Click any creator below to ingest their visual DNA into the archive.`
      } else if (lower.includes('dna') || lower.includes('style') || lower.includes('pace') || lower.includes('hook')) {
        const dna = recommendations.suggestedStyleDNA
        reply = `Style DNA for ${recommendations.matchedCreator || targetSubject}: Tone is ${dna?.tone || 'authoritative'}, Pacing is ${dna?.pacing || 'rapid micro-cuts'}, and Typography is ${dna?.typography || 'clean modern sans'}.`
      } else {
        reply = `Affirmative. I've logged that direction for ${recommendations.matchedCreator || targetSubject}. You can calibrate your video outputs directly or select related creators to expand the archive.`
      }

      setChatMessages((prev) => [...prev, { role: 'jarvis', text: reply }])
    }, 450)
  }

  const toggleVoiceMode = () => {
    if (isVoiceActive) {
      companion.disconnect()
      setIsVoiceActive(false)
    } else {
      companion.connect()
      setIsVoiceActive(true)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'relative z-10 flex w-full max-w-[640px] flex-col overflow-hidden rounded-3xl',
            'border border-[#55ff9b]/30 bg-[#040805]/95 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95),0_0_50px_rgba(85,255,155,0.15)] text-white backdrop-blur-2xl',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#55ff9b]/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex size-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55ff9b] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#55ff9b]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#63ffa4]">
                    JARVIS // CREATIVE INTELLIGENCE
                  </h3>
                  <span className="rounded-full border border-[#55ff9b]/40 bg-[#55ff9b]/15 px-2 py-0.2 text-[9px] font-mono text-[#63ffa4]">
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-white/50">
                  Autonomous Brand Spirit & Video Pacing Director
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Jarvis"
              className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Center Holographic Voice Orb & Waveform */}
          <div className="relative flex flex-col items-center justify-center border-b border-white/10 bg-gradient-to-b from-black/60 to-black/30 py-6">
            <div className="relative flex size-24 items-center justify-center">
              {/* Animated outer glowing rings */}
              <div className="absolute inset-0 animate-spin-slow rounded-full border border-[#55ff9b]/30" />
              <div className="absolute -inset-2 rounded-full border border-dashed border-[#55ff9b]/20 animate-pulse" />

              {/* Core Orb */}
              <div
                className={cn(
                  'relative grid size-16 place-items-center rounded-full shadow-[0_0_30px_rgba(85,255,155,0.4)] transition-all duration-300',
                  isVoiceActive
                    ? 'border-2 border-[#55ff9b] bg-[radial-gradient(circle_at_30%_30%,#a855f7,#55ff9b_60%,#000)] scale-110'
                    : 'border border-[#55ff9b]/60 bg-[radial-gradient(circle_at_30%_30%,#06b6d4,#55ff9b_70%,#000)]'
                )}
              >
                {isVoiceActive ? (
                  <Volume2 className="size-7 text-white animate-pulse" />
                ) : (
                  <Sparkles className="size-7 text-white" />
                )}
              </div>
            </div>

            {/* Status indicator line */}
            <div className="mt-3 flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#63ffa4]">
                {isVoiceActive ? 'Listening to voice stream...' : `Target Context: ${recommendations.matchedCreator || targetSubject}`}
              </span>
            </div>

            {/* Voice toggle button */}
            <button
              type="button"
              onClick={toggleVoiceMode}
              className={cn(
                'mt-3.5 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all shadow-md',
                isVoiceActive
                  ? 'border border-rose-500/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                  : 'border border-[#55ff9b]/50 bg-[#55ff9b]/15 text-[#63ffa4] hover:bg-[#55ff9b]/30'
              )}
            >
              {isVoiceActive ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
              <span>{isVoiceActive ? 'Mute Microphone' : 'Start Voice Conversation'}</span>
            </button>
          </div>

          {/* Dialogue Log */}
          <div className="flex max-h-56 flex-col gap-3 overflow-y-auto p-5 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex flex-col rounded-2xl p-3.5 leading-relaxed',
                  msg.role === 'jarvis'
                    ? 'border border-[#55ff9b]/25 bg-[#55ff9b]/[0.06] text-white/90 shadow-sm'
                    : 'self-end border border-white/10 bg-white/[0.08] text-white max-w-[85%]'
                )}
              >
                <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#63ffa4]">
                  {msg.role === 'jarvis' ? 'JARVIS AI' : 'USER'}
                </div>
                <div>{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Quick Action Pills */}
          <div className="border-t border-white/10 bg-black/40 px-5 py-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
              Instant Intelligence Actions
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const creator = recommendations.matchedCreator || targetSubject
                  const topPlatform = recommendations.platformOptions[0]?.handleOrUrl || `https://youtube.com/@${creator.toLowerCase().replace(/\s+/g, '')}`
                  onApplyBrandSpirit?.(creator, topPlatform)
                  onClose()
                }}
                className="flex items-center gap-1.5 rounded-full border border-[#55ff9b]/40 bg-[#55ff9b]/15 px-3 py-1.5 text-xs font-semibold text-[#63ffa4] transition hover:bg-[#55ff9b]/30"
              >
                <Zap className="size-3" />
                <span>Calibrate Video Suite to {recommendations.matchedCreator || targetSubject}</span>
              </button>

              {recommendations.relatedCreators.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const firstRelated = recommendations.relatedCreators[0]
                    if (firstRelated) {
                      onSelectRelatedCreator?.(firstRelated.name)
                      onClose()
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <Users className="size-3 text-[#63ffa4]" />
                  <span>Show Related ({recommendations.relatedCreators[0]?.name})</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Input text prompt */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 border-t border-white/10 bg-[#040805] p-3 sm:px-5"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Ask Jarvis about ${recommendations.matchedCreator || targetSubject} or video pacing...`}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white outline-none placeholder:text-white/40 focus:border-[#55ff9b]/50"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="grid size-8 place-items-center rounded-full border border-[#55ff9b]/40 bg-[#55ff9b]/20 text-[#63ffa4] transition hover:bg-[#55ff9b]/30 disabled:opacity-40"
              aria-label="Send message to Jarvis"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
