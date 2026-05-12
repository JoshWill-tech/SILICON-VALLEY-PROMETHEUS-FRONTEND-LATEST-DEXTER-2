'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, RefreshCw, MessageSquareDashed, Clock, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeedbackSentiment = 'liked' | 'disliked' | 'try_again'
export type FeedbackState = 'idle' | 'prompt' | 'liked' | 'critique' | 'submitted' | 'try_again' | 'dismissed'

export interface PreviewFeedbackPayload {
  previewId?: string
  projectId?: string
  sentiment: FeedbackSentiment
  categories: string[]
  timestampNote?: string
  freeformFeedback?: string
  createdAt: string
}

interface PreviewFeedbackShellProps {
  previewId?: string
  projectId?: string
  show: boolean
  onDismiss: () => void
  onSubmitPayload?: (payload: PreviewFeedbackPayload) => void
  className?: string
}

const CRITIQUE_CATEGORIES = [
  'Captions',
  'Typography',
  'Pacing',
  'Music',
  'B-roll',
  'Motion',
  'Color',
  'Hook',
  'Ending',
  'Overall tone',
]

export function PreviewFeedbackShell({
  previewId,
  projectId,
  show,
  onDismiss,
  onSubmitPayload,
  className,
}: PreviewFeedbackShellProps) {
  const [state, setState] = React.useState<FeedbackState>('prompt')
  
  // Critique Form State
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [timestampNote, setTimestampNote] = React.useState('')
  const [freeformFeedback, setFreeformFeedback] = React.useState('')

  // Reset state when newly shown
  React.useEffect(() => {
    if (show && state === 'idle') {
      setState('prompt')
    }
  }, [show, state])

  // Prevent parent click-through (e.g. toggling video playback)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
  }

  const handleLike = () => {
    setState('liked')
    emitPayload('liked')
  }

  const handleDislike = () => {
    setState('critique')
  }

  const handleTryAgain = () => {
    setState('try_again')
    emitPayload('try_again')
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const submitCritique = () => {
    setState('submitted')
    emitPayload('disliked')
  }

  const emitPayload = (sentiment: FeedbackSentiment) => {
    const payload: PreviewFeedbackPayload = {
      previewId,
      projectId,
      sentiment,
      categories: sentiment === 'disliked' ? selectedCategories : [],
      timestampNote: sentiment === 'disliked' ? timestampNote : undefined,
      freeformFeedback: sentiment === 'disliked' ? freeformFeedback : undefined,
      createdAt: new Date().toISOString(),
    }
    console.debug('[Preview Feedback Payload]', payload)
    onSubmitPayload?.(payload)
  }

  if (!show || state === 'idle' || state === 'dismissed') return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="feedback-shell"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'absolute bottom-6 right-6 z-40 w-full max-w-[340px] overflow-hidden rounded-[18px] border border-white/10 bg-[#09090c]/85 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
            <span className="text-xs font-medium tracking-wide text-white/70">Creative Direction</span>
          </div>
          <button
            onClick={() => {
              setState('dismissed')
              onDismiss()
            }}
            className="flex size-6 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dismiss feedback"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait" initial={false}>
            {state === 'prompt' && (
              <motion.div
                key="state-prompt"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)', position: 'absolute' }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4"
              >
                <p className="text-sm font-medium text-white/90">Does this direction feel right?</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleLike}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-[0.98]"
                  >
                    I like this
                  </button>
                  <button
                    onClick={handleDislike}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/5 bg-transparent px-4 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.04] hover:text-white active:scale-[0.98]"
                  >
                    I don’t like this
                  </button>
                  <button
                    onClick={handleTryAgain}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/5 bg-transparent px-4 py-2.5 text-sm font-medium text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 active:scale-[0.98]"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}

            {state === 'liked' && (
              <motion.div
                key="state-liked"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
                >
                  <CheckCircle2 className="mb-4 size-10 text-emerald-400" strokeWidth={1.5} />
                </motion.div>
                <h4 className="mb-2 text-base font-medium text-white">Direction locked</h4>
                <p className="text-sm text-white/50 leading-relaxed">
                  This preview is ready for export when you are.
                </p>
              </motion.div>
            )}

            {state === 'try_again' && (
              <motion.div
                key="state-try-again"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <motion.div
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <RefreshCw className="mb-4 size-8 text-blue-400" strokeWidth={1.5} />
                </motion.div>
                <h4 className="mb-2 text-base font-medium text-white">Got it.</h4>
                <p className="text-sm text-white/50 leading-relaxed">
                  We’ll prepare another direction.
                </p>
              </motion.div>
            )}

            {state === 'submitted' && (
              <motion.div
                key="state-submitted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                 <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
                >
                  <CheckCircle2 className="mb-4 size-10 text-white/80" strokeWidth={1.5} />
                </motion.div>
                <h4 className="mb-2 text-base font-medium text-white">Notes received</h4>
                <p className="text-sm text-white/50 leading-relaxed">
                  We’ll apply these changes to the next revision.
                </p>
              </motion.div>
            )}

            {state === 'critique' && (
              <motion.div
                key="state-critique"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)', position: 'absolute' }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h4 className="mb-1 text-sm font-medium text-white">What exactly needs to change?</h4>
                  <p className="text-xs text-white/50">Select all that apply.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {CRITIQUE_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat)
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95',
                          isSelected
                            ? 'border-blue-500/50 bg-blue-500/20 text-blue-100 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                            : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white'
                        )}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 size-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="Timestamp (e.g. 0:15)"
                      value={timestampNote}
                      onChange={(e) => setTimestampNote(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>

                  <div className="relative">
                    <MessageSquareDashed className="absolute left-3 top-3 size-4 text-white/30" />
                    <textarea
                      placeholder="Additional notes..."
                      value={freeformFeedback}
                      onChange={(e) => setFreeformFeedback(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setState('prompt')}
                    className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-transparent px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCritique}
                    disabled={selectedCategories.length === 0 && !freeformFeedback.trim()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-white px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
                  >
                    Send notes
                    <Send className="size-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
