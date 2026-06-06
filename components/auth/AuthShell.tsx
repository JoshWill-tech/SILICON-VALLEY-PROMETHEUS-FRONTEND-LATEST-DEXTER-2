'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { GradientBackground } from './GradientBackground'
import { cn } from '@/lib/utils'

interface AuthShellProps {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  const [phase, setPhase] = useState<'static' | 'full'>('static')

  useEffect(() => {
    // Phase 1 & 2: Hydrate premium effects after load
    if (document.readyState === 'complete') {
      setPhase('full')
    } else {
      const handleLoad = () => setPhase('full')
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  return (
    <div className={cn(
      "relative min-h-screen w-full flex flex-col items-center justify-center p-4 transition-colors duration-700",
      phase === 'static' ? "bg-abyss" : "bg-transparent"
    )}>
      {/* Phase 1: Background Animation */}
      <AnimatePresence>
        {phase === 'full' && <GradientBackground />}
      </AnimatePresence>

      {/* Back to Home Button */}
      <Link 
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors z-20 group"
      >
        <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ChevronLeft className="size-4" />
        </div>
        <span className="text-sm font-medium">Home</span>
      </Link>

      {/* Auth Card Container */}
      <motion.div
        initial={false}
        animate={{
          opacity: 1,
          scale: 1,
          backdropFilter: phase === 'full' ? "blur(40px) saturate(180%)" : "blur(0px) saturate(100%)",
        }}
        className={cn(
          "relative z-10 w-full max-w-[440px] p-8 md:p-12",
          phase === 'full' ? "auth-card auth-card-border" : "bg-void/80 border border-white/10 rounded-[32px]"
        )}
      >
        {children}
      </motion.div>
    </div>
  )
}
