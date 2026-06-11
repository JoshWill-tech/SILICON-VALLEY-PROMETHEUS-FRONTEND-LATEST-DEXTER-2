'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HamburgerButtonProps {
  ariaControls?: string
  className?: string
  isOpen: boolean
  onToggle: () => void
}

const transition = {
  duration: 0.24,
  ease: [0.32, 0.72, 0, 1] as const,
}

export function HamburgerButton({
  ariaControls = 'prometheus-mobile-nav-drawer',
  className,
  isOpen,
  onToggle,
}: HamburgerButtonProps) {
  return (
    <button
      type="button"
      aria-controls={ariaControls}
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Close mobile navigation' : 'Open mobile navigation'}
      onClick={onToggle}
      className={cn(
        'relative z-50 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-prometheus-border-glass bg-prometheus-bg-secondary/80 text-prometheus-text-primary shadow-[0_14px_36px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors duration-200 hover:bg-prometheus-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-purple/70 md:hidden',
        className
      )}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <motion.path
          d={isOpen ? 'M6 6L18 18' : 'M5 7H19'}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          transition={transition}
        />
        <motion.path
          d="M5 12H19"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          initial={{ opacity: isOpen ? 0 : 1, pathLength: isOpen ? 0.2 : 1 }}
          animate={{ opacity: isOpen ? 0 : 1, pathLength: isOpen ? 0.2 : 1 }}
          transition={transition}
        />
        <motion.path
          d={isOpen ? 'M18 6L6 18' : 'M5 17H19'}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          transition={transition}
        />
      </svg>
    </button>
  )
}
