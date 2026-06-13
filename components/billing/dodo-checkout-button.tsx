'use client'

import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

type DodoCheckoutButtonProps = {
  ctaLabel: string
  className?: string
  disabled?: boolean
  onClick: () => void
}

export function DodoCheckoutButton({
  ctaLabel,
  className,
  disabled,
  onClick,
}: DodoCheckoutButtonProps) {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className="w-full"
    >
      <Button
        size="lg"
        disabled={disabled}
        className={cn(
          'relative h-12 w-full overflow-hidden rounded-[18px] text-[15px] font-semibold tracking-tight text-white transition-all duration-300',
          !disabled
            ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]'
            : 'bg-white/5 text-white/20 border-white/5 shadow-none opacity-50',
          'border border-white/10',
          !disabled && 'hover:border-white/25 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_100%)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)]',
          className,
        )}
        onClick={onClick}
      >
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-inherit">
          <motion.div
            animate={{
              translateX: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: 1,
            }}
            className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] skew-x-[-20deg]"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center gap-2">
          <span>{ctaLabel}</span>
          <motion.div
            initial={{ x: 0, y: 0 }}
            whileHover={{ x: 2, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <ArrowUpRight className="size-4" />
          </motion.div>
        </div>
      </Button>
    </motion.div>
  )
}
