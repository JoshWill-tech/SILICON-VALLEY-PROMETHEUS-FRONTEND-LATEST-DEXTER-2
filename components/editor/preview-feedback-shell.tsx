'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, RefreshCw, MessageSquareDashed, Clock, Send, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeedbackSentiment = 'liked' | 'disliked' | 'try_again'
export type FeedbackState = 'idle' | 'prompt' | 'liked' | 'critique' | 'summary' | 'submitted' | 'try_again' | 'dismissed'

export interface PreviewFeedbackPayload {
  previewId?: string
  projectId?: string
  sentiment: FeedbackSentiment
  categories: string[]
  desiredChanges: string[]
  selectedQuestions: string[]
  nextVersionTone?: string[]
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
  'Visual hierarchy',
  'Too busy',
  'Too slow',
  'Too generic',
  'Not premium enough'
]

const CATEGORY_FOLLOW_UPS: Record<string, string[]> = {
  'Captions': [
    'Captions should be bolder',
    'Captions should be cleaner',
    'Captions should emphasize fewer words',
    'Captions should follow the speaker more tightly',
    'Captions should feel more premium',
    'Captions should not cover important visuals'
  ],
  'Pacing': [
    'Make the intro faster',
    'Add more breathing room',
    'Cut dead space',
    'Make transitions sharper',
    'Slow down important claims',
    'Add more pattern interrupts'
  ],
  'Music': [
    'Music should be more emotional',
    'Music should be less distracting',
    'Music should feel more premium',
    'Music should build more momentum',
    'Music should stay behind the voice'
  ],
  'B-roll': [
    'B-roll should prove the point',
    'B-roll should feel less random',
    'Use more product/context visuals',
    'Use more symbolic visuals',
    'Avoid generic stock-feeling inserts'
  ],
  'Motion': [
    'Motion should be more restrained',
    'Motion should feel more cinematic',
    'Motion should be sharper',
    'Motion should be less noisy',
    'More emphasis on key ideas only'
  ],
  'Hook': [
    'First 3 seconds need more tension',
    'Hook should be more direct',
    'Hook should create curiosity',
    'Hook should feel more premium',
    'Hook should show the payoff earlier'
  ]
}

const LOCATION_CHIPS = ['Intro', 'Middle', 'Ending', 'Specific timestamp']

const TONE_OPTIONS = [
  'More premium',
  'More energetic',
  'More cinematic',
  'More clear',
  'More emotional',
  'More authoritative',
  'More viral',
  'More restrained',
  'More human',
  'More polished'
]

const EDITOR_QUESTIONS = [
  'What should the viewer feel in the first 3 seconds?',
  'What should the viewer believe by the end?',
  'What moment should feel the most expensive?',
  'What should never be changed from the original?',
  'What part felt too AI-generated?',
  'What part felt too slow?',
  'What part felt too busy?',
  'Which moment lost your attention?',
  'Should the second pass be more restrained or more aggressive?',
  'Should captions lead the story or simply support it?',
  'Should music drive emotion or stay behind the voice?',
  'Should the edit feel more human, cinematic, luxury, or viral?',
  'Should we remove visual noise or add more energy?',
  'Should the hook create curiosity, authority, tension, or desire?',
  'What should the viewer remember after watching?',
  'Which moment needs more visual proof?',
  'Where should the edit breathe more?',
  'Where should the edit hit harder?',
  'What would make this feel more premium?',
  'What would make this feel less generic?'
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
  const [desiredChanges, setDesiredChanges] = React.useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([])
  const [timestampNote, setTimestampNote] = React.useState('')
  const [nextVersionTone, setNextVersionTone] = React.useState<string[]>([])
  const [selectedQuestions, setSelectedQuestions] = React.useState<string[]>([])
  const [freeformFeedback, setFreeformFeedback] = React.useState('')
  const [showAllQuestions, setShowAllQuestions] = React.useState(false)

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

  const toggleItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const handleQuestionSelect = (q: string) => {
    if (!selectedQuestions.includes(q)) {
      setSelectedQuestions((prev) => [...prev, q])
    }
  }

  const handleReviewSummary = () => {
    setState('summary')
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
      desiredChanges: sentiment === 'disliked' ? desiredChanges : [],
      selectedQuestions: sentiment === 'disliked' ? selectedQuestions : [],
      nextVersionTone: sentiment === 'disliked' ? nextVersionTone : undefined,
      timestampNote: sentiment === 'disliked' && (selectedLocations.includes('Specific timestamp') || timestampNote) ? timestampNote : undefined,
      freeformFeedback: sentiment === 'disliked' ? freeformFeedback : undefined,
      createdAt: new Date().toISOString(),
    }
    console.debug('[Preview Feedback Payload]', payload)
    onSubmitPayload?.(payload)
  }

  // Determine available follow-ups based on selected categories
  const availableFollowUps = React.useMemo(() => {
    const followUps: string[] = []
    selectedCategories.forEach(cat => {
      if (CATEGORY_FOLLOW_UPS[cat]) {
        followUps.push(...CATEGORY_FOLLOW_UPS[cat])
      }
    })
    return followUps
  }, [selectedCategories])

  if (!show || state === 'idle' || state === 'dismissed') return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="feedback-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md p-4',
          className
        )}
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Radial Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[80px]" />
        </div>

        <motion.div
          key="feedback-shell"
          layout
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative z-10 overflow-hidden rounded-[18px] border border-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl',
            (state === 'critique' || state === 'summary')
              ? 'w-full max-w-2xl bg-[#09090c]/90 flex flex-col max-h-full' // Centered large panel
              : 'w-full max-w-[420px] bg-[#09090c]/85 flex flex-col' // Centered medium prompt
          )}
        >
          {/* Header */}
          <motion.div layout="position" className="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/[0.02] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
              <span className="text-sm font-medium tracking-wide text-white/80">Creative Direction</span>
            </div>
            <button
              onClick={() => {
                setState('dismissed')
                onDismiss()
              }}
              className="flex size-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss feedback"
            >
              <X className="size-4" />
            </button>
          </motion.div>

          {/* Scrollable Content Area for Critique/Summary, normal padding otherwise */}
          <div className={cn('flex-1', (state === 'critique' || state === 'summary') ? 'overflow-y-auto overscroll-contain p-6' : 'p-5')}>
            <AnimatePresence mode="wait" initial={false}>
              {state === 'prompt' && (
                <motion.div
                  key="state-prompt"
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)', position: 'absolute' }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-5"
                >
                  <div className="space-y-1.5 text-center px-4 pt-2 pb-4">
                    <p className="text-lg font-semibold text-white/90">Is this the direction you had in mind?</p>
                    <p className="text-sm text-white/50 leading-relaxed">Lock this preview, request a sharper pass, or let Prometheus try another direction.</p>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={handleLike}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-[0.98]"
                    >
                      I like this
                    </button>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={handleDislike}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-transparent px-4 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.04] hover:text-white active:scale-[0.98]"
                      >
                        I don’t like this
                      </button>
                      <button
                        onClick={handleTryAgain}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-transparent px-4 py-3 text-sm font-medium text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 active:scale-[0.98]"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {state === 'liked' && (
                <motion.div
                  key="state-liked"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
                  >
                    <CheckCircle2 className="mb-5 size-12 text-emerald-400" strokeWidth={1.5} />
                  </motion.div>
                  <h4 className="mb-2.5 text-lg font-medium text-white">Direction locked</h4>
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
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <motion.div
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                  >
                    <RefreshCw className="mb-5 size-10 text-blue-400" strokeWidth={1.5} />
                  </motion.div>
                  <h4 className="mb-2.5 text-lg font-medium text-white">Got it.</h4>
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
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                   <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
                  >
                    <CheckCircle2 className="mb-5 size-12 text-white/80" strokeWidth={1.5} />
                  </motion.div>
                  <h4 className="mb-2.5 text-lg font-medium text-white">Notes received</h4>
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
                  className="flex flex-col gap-10"
                >
                  {/* Stage 1 */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-semibold text-white/90">1. What felt wrong?</h4>
                      <p className="mt-1 text-xs text-white/40">Select all areas that missed the mark.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CRITIQUE_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategories.includes(cat)
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleItem(cat, selectedCategories, setSelectedCategories)}
                            className={cn(
                              'rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95',
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
                  </div>

                  {/* Stage 2 (Conditional) */}
                  <AnimatePresence>
                    {availableFollowUps.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div>
                          <h4 className="text-base font-semibold text-white/90">2. What should change?</h4>
                          <p className="mt-1 text-xs text-white/40">Specific instructions for your selected categories.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableFollowUps.map((change) => {
                            const isSelected = desiredChanges.includes(change)
                            return (
                              <button
                                key={change}
                                onClick={() => toggleItem(change, desiredChanges, setDesiredChanges)}
                                className={cn(
                                  'rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95',
                                  isSelected
                                    ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-100 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white'
                                )}
                              >
                                {change}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stage 3 */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-semibold text-white/90">{availableFollowUps.length > 0 ? '3' : '2'}. Where did you notice it?</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {LOCATION_CHIPS.map((loc) => {
                        const isSelected = selectedLocations.includes(loc)
                        return (
                          <button
                            key={loc}
                            onClick={() => toggleItem(loc, selectedLocations, setSelectedLocations)}
                            className={cn(
                              'rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95',
                              isSelected
                                ? 'border-white/30 bg-white/10 text-white'
                                : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white'
                            )}
                          >
                            {loc}
                          </button>
                        )
                      })}
                    </div>
                    
                    <AnimatePresence>
                      {selectedLocations.includes('Specific timestamp') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative max-w-[200px] overflow-hidden pt-2"
                        >
                          <Clock className="absolute left-3 top-[18px] size-4 text-white/30" />
                          <input
                            type="text"
                            placeholder="e.g. 0:15 or 1:20-1:30"
                            value={timestampNote}
                            onChange={(e) => setTimestampNote(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Stage 4 */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-semibold text-white/90">{availableFollowUps.length > 0 ? '4' : '3'}. What should the next version feel like?</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TONE_OPTIONS.map((tone) => {
                        const isSelected = nextVersionTone.includes(tone)
                        return (
                          <button
                            key={tone}
                            onClick={() => toggleItem(tone, nextVersionTone, setNextVersionTone)}
                            className={cn(
                              'rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95',
                              isSelected
                                ? 'border-purple-500/50 bg-purple-500/20 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white'
                            )}
                          >
                            {tone}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Stage 5 & Editor Questions */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-semibold text-white/90">{availableFollowUps.length > 0 ? '5' : '4'}. Editor questions that help the second pass</h4>
                      <p className="mt-1 text-xs text-white/40">Select a question to add it to your notes, then answer it below.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(showAllQuestions ? EDITOR_QUESTIONS : EDITOR_QUESTIONS.slice(0, 6)).map((q) => {
                        const isSelected = selectedQuestions.includes(q)
                        return (
                          <button
                            key={q}
                            onClick={() => handleQuestionSelect(q)}
                            disabled={isSelected}
                            className={cn(
                              'rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-all text-left',
                              isSelected
                                ? 'border-white/5 bg-white/[0.02] text-white/30 cursor-not-allowed'
                                : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white active:scale-95'
                            )}
                          >
                            {q}
                          </button>
                        )
                      })}
                      {!showAllQuestions && (
                        <button
                          onClick={() => setShowAllQuestions(true)}
                          className="flex items-center gap-1 rounded-xl border border-transparent px-4 py-2.5 text-[13px] font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                        >
                          See more questions
                          <ChevronRight className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {selectedQuestions.length > 0 && (
                      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Selected Questions</h5>
                        <ul className="space-y-2">
                          {selectedQuestions.map((q) => (
                            <li key={q} className="flex items-start gap-2 text-sm text-white/80">
                              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue-500/50" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="relative mt-6">
                      <MessageSquareDashed className="absolute left-4 top-4 size-5 text-white/30" />
                      <textarea
                        placeholder="Tell Prometheus exactly what felt off..."
                        value={freeformFeedback}
                        onChange={(e) => setFreeformFeedback(e.target.value)}
                        rows={5}
                        className="w-full resize-none rounded-xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="sticky bottom-0 -mx-6 -mb-6 mt-4 flex items-center justify-end gap-3 border-t border-white/5 bg-[#09090c]/95 px-6 py-4 backdrop-blur-xl">
                    <button
                      onClick={() => setState('prompt')}
                      className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReviewSummary}
                      disabled={selectedCategories.length === 0 && !freeformFeedback.trim() && desiredChanges.length === 0 && nextVersionTone.length === 0 && selectedQuestions.length === 0}
                      className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      Review summary
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {state === 'summary' && (
                <motion.div
                  key="state-summary"
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)', position: 'absolute' }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col"
                >
                  <div className="space-y-1.5 text-center px-4 pt-2 pb-6">
                    <p className="text-xl font-semibold text-white/90">Revision brief ready</p>
                    <p className="text-sm text-white/50 leading-relaxed">Prometheus will use this to guide the next pass.</p>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">What felt wrong</h5>
                      {selectedCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCategories.map(cat => (
                            <span key={cat} className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1 text-xs text-white/70">{cat}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-white/30 italic">Not specified</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">What should change</h5>
                      {desiredChanges.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {desiredChanges.map(change => (
                            <span key={change} className="rounded-md border border-indigo-500/10 bg-indigo-500/5 px-2.5 py-1 text-xs text-indigo-200/80">{change}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-white/30 italic">Not specified</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Where it happened</h5>
                      {(selectedLocations.length > 0 || timestampNote) ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedLocations.map(loc => (
                            <span key={loc} className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1 text-xs text-white/70">{loc}</span>
                          ))}
                          {timestampNote && (
                            <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/90">
                              <Clock className="size-3" /> {timestampNote}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-white/30 italic">Not specified</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Desired next-version tone</h5>
                      {nextVersionTone.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {nextVersionTone.map(tone => (
                            <span key={tone} className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-200/80">{tone}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-white/30 italic">Not specified</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Selected editor questions</h5>
                      {selectedQuestions.length > 0 ? (
                        <ul className="space-y-1.5">
                          {selectedQuestions.map(q => (
                            <li key={q} className="flex items-start gap-2 text-xs text-white/60">
                              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-500/50" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-white/30 italic">Not specified</div>
                      )}
                    </div>

                    <div className="space-y-2 pb-4">
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Final notes</h5>
                      {freeformFeedback ? (
                        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-sm text-white/70 italic">
                          &quot;{freeformFeedback}&quot;
                        </div>
                      ) : (
                        <div className="text-sm text-white/30 italic">Not specified</div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="sticky bottom-0 -mx-6 -mb-6 mt-8 flex items-center justify-between border-t border-white/5 bg-[#09090c]/95 px-6 py-4 backdrop-blur-xl">
                    <button
                      onClick={() => setState('prompt')}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/40 transition-colors hover:text-white"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setState('critique')}
                        className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        Edit feedback
                      </button>
                      <button
                        onClick={submitCritique}
                        className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-95"
                      >
                        Confirm revision brief
                        <Send className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
