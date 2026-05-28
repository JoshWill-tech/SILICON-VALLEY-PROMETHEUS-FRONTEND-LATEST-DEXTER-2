'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { LOADING_FACTS, getRandomLoadingFact } from '@/lib/loading-facts'
import { cn } from '@/lib/utils'

type PremiumLoaderProps = {
  className?: string
  factClassName?: string
  label?: string
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'screen' | 'panel' | 'inline'
}

const SIZE_CLASS_NAMES = {
  sm: 'h-16 w-28',
  md: 'h-24 w-40',
  lg: 'h-32 w-56',
} as const

export function PremiumLoader({
  className,
  factClassName,
  label = 'Loading...',
  message,
  size = 'md',
  variant = 'panel',
}: PremiumLoaderProps) {
  const glowFilterId = React.useId()
  const [fact, setFact] = React.useState(() => getRandomLoadingFact())

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setFact((current) => {
        if (LOADING_FACTS.length <= 1) return current
        let next = getRandomLoadingFact()
        while (next === current) {
          next = getRandomLoadingFact()
        }
        return next
      })
    }, 8000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden text-center text-white',
        variant === 'screen' && 'min-h-[100dvh] bg-[#050505] px-6',
        variant === 'panel' && 'rounded-[28px] border border-white/8 bg-[#050505] px-6 py-10 shadow-[0_34px_90px_-58px_rgba(0,0,0,0.95)]',
        variant === 'inline' && 'bg-transparent px-4 py-5',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-[62%] rounded-full bg-[#6366f1]/18 blur-[46px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-56 -translate-x-1/2 -translate-y-[60%] rounded-full border border-white/[0.04] bg-white/[0.025] blur-[1px]"
      />

      <div className={cn('relative', SIZE_CLASS_NAMES[size])}>
        <svg viewBox="0 0 220 120" className="h-full w-full overflow-visible" fill="none">
          <defs>
            <filter id={glowFilterId} x="-30%" y="-60%" width="160%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.388 0 0 0 0 0.4 0 0 0 0 0.945 0 0 0 0.82 0"
              />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M36 60C36 37 54 24 75 24C101 24 119 96 145 96C166 96 184 83 184 60C184 37 166 24 145 24C119 24 101 96 75 96C54 96 36 83 36 60Z"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <motion.path
            d="M36 60C36 37 54 24 75 24C101 24 119 96 145 96C166 96 184 83 184 60C184 37 166 24 145 24C119 24 101 96 75 96C54 96 36 83 36 60Z"
            stroke="#6366f1"
            strokeWidth="8"
            strokeLinecap="round"
            filter={`url(#${glowFilterId})`}
            strokeDasharray="92 270"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -362 }}
            transition={{ duration: 1.9, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        </svg>
      </div>

      <div className="relative mt-5 text-sm font-medium text-white/78">{label}</div>
      {message ? <div className="relative mt-2 max-w-[32rem] text-xs leading-5 text-white/44">{message}</div> : null}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={fact}
          initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={cn('relative mt-4 max-w-[36rem] text-balance text-xs leading-5 text-white/38', factClassName)}
        >
          {fact}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function PremiumLoadingScreen(props: Omit<PremiumLoaderProps, 'variant'>) {
  return <PremiumLoader {...props} variant="screen" />
}
