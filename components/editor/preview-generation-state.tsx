'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface PreviewGenerationStateProps {
  isVisible: boolean
  title?: string
  steps?: string[]
  durationMs?: number
  onComplete?: () => void
  className?: string
}

const DEFAULT_STEPS = [
  'Reading your creative brief...',
  'Mapping creative intent...',
  'Analyzing transcript cues...',
  'Applying cinematic direction...',
  'Preparing sample preview...'
]

export function PreviewGenerationState({
  isVisible,
  title = 'Sharpening your Edit DNA',
  steps = DEFAULT_STEPS,
  durationMs = 10000,
  onComplete,
  className,
}: PreviewGenerationStateProps) {
  const [currentStep, setCurrentStep] = React.useState(0)

  React.useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0)
      return
    }

    const stepDuration = durationMs / steps.length

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, stepDuration)

    const timeout = setTimeout(() => {
      onComplete?.()
    }, durationMs)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isVisible, steps.length, durationMs, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md',
            className
          )}
        >
          {/* Cinematic Animated Orb */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-70"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute h-[50vh] w-[50vh] max-h-[400px] max-w-[400px] rounded-full bg-blue-500/20 blur-[100px]"
            />
            <div className="absolute h-[40vh] w-[40vh] max-h-[300px] max-w-[300px] translate-x-12 translate-y-12 rounded-full bg-indigo-500/20 blur-[80px]" />
            <div className="absolute h-[35vh] w-[35vh] max-h-[250px] max-w-[250px] -translate-x-12 -translate-y-12 rounded-full bg-cyan-400/10 blur-[60px]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full max-w-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#09090c]/80 p-6 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Sparkles className="size-5 text-blue-400" />
            </div>

            <h3 className="mb-2 text-base font-semibold text-white/90">
              {title}
            </h3>

            <div className="relative flex h-6 w-full items-center justify-center overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full text-sm text-white/50"
                >
                  {steps[currentStep]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Subtle Progress Bar */}
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: durationMs / 1000, ease: 'linear' }}
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
