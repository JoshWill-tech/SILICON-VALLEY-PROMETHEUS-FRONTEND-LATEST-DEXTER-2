'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

type GlassCardTag = 'div' | 'article' | 'section'

export interface GlassCardProps {
  as?: GlassCardTag
  children: React.ReactNode
  className?: string
  contentClassName?: string
  hoverable?: boolean
  staggerChildren?: boolean
  [key: string]: unknown
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24 } },
}

export function GlassCard({
  as = 'div',
  children,
  className,
  contentClassName,
  hoverable = true,
  staggerChildren = false,
  ...props
}: GlassCardProps) {
  const MotionTag = as === 'article' ? motion.article : as === 'section' ? motion.section : motion.div

  const content = staggerChildren
    ? React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={staggerItem}>
          {child}
        </motion.div>
      ))
    : children

  return (
    <div className="glass-card-shell [perspective:1000px]">
      <MotionTag
        initial={staggerChildren ? 'hidden' : false}
        whileInView={staggerChildren ? 'visible' : undefined}
        viewport={staggerChildren ? { once: true, amount: 0.15 } : undefined}
        variants={staggerChildren ? staggerContainer : undefined}
        className={cn(
          'glass-card-premium relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl',
          hoverable && 'glass-card-hover',
          className,
        )}
        {...props}
      >
        <div className={cn('relative z-10', contentClassName)}>{content}</div>
      </MotionTag>
    </div>
  )
}
