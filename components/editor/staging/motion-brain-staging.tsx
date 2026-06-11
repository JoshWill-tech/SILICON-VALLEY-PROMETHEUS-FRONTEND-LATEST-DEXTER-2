'use client'

import * as React from 'react'
import { Activity, Bell, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MotionBrainStagingProps {
  onNotify?: () => void
  className?: string
}

export function MotionBrainStaging({ onNotify, className }: MotionBrainStagingProps) {
  return (
    <section
      aria-labelledby="motion-brain-staging-title"
      className={cn(
        'flex h-full min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/[0.28] text-white shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)]',
        className,
      )}
    >
      <header className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-cyan/25 bg-accent-cyan/10 text-accent-cyan">
            <Brain className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="motion-brain-staging-title" className="text-base font-semibold text-white">
              Motion Brain
            </h2>
            <p className="mt-1 text-sm text-white/52">AI-powered animation intelligence</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="relative mb-8 h-24 w-52 overflow-hidden rounded-full border border-white/10 bg-white/[0.025]">
          <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 items-end justify-between gap-1" aria-hidden>
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                className="w-1 rounded-full bg-accent-cyan/50 motion-safe:animate-pulse"
                style={{ height: `${18 + ((index * 11) % 48)}px`, animationDelay: `${index * 70}ms` }}
              />
            ))}
          </div>
          <Activity className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-white/70" />
        </div>

        <p className="max-w-md text-sm leading-7 text-white/62">
          Motion Brain is coming soon. It will analyze your transcript and generate GSAP animation beats automatically.
        </p>

        {onNotify ? (
          <button
            type="button"
            onClick={onNotify}
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-accent-cyan/25 bg-accent-cyan/10 px-5 text-sm font-medium text-accent-cyan outline-none transition-colors hover:bg-accent-cyan/15 focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            Notify me when ready
          </button>
        ) : null}
      </div>
    </section>
  )
}
