'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { TextReveal } from '@/components/editor/text-reveal'
import { buildRevealVariants } from '@/lib/motion'

export interface SecondaryPanelProps {
  title: string
  description: string
  items: string[]
}

export function SecondaryPanel({ title, description, items }: SecondaryPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden px-4 py-6">
      <motion.div
        variants={buildRevealVariants({ distance: 12, blur: 8, duration: 0.26 })}
        initial="hidden"
        animate="visible"
      >
        <TextReveal as="h2" text={title} className="text-lg font-medium text-white" />
        <p className="mt-2 text-sm leading-relaxed text-white/46">{description}</p>

        <div className="mt-8 space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item}
              variants={buildRevealVariants({ delay: 0.1 + index * 0.04, distance: 8, blur: 4, duration: 0.22 })}
              initial="hidden"
              animate="visible"
              className="rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/68"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
