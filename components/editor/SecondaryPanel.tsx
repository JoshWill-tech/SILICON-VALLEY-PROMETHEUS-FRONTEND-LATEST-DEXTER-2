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
    <div className="flex h-full flex-col overflow-hidden px-6 py-6">
      <motion.div
        variants={buildRevealVariants({ distance: 12, blur: 8, duration: 0.26 })}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
            {title}
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-white/30 uppercase tracking-widest">
            {description}
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item}
              variants={buildRevealVariants({ delay: 0.1 + index * 0.04, distance: 8, blur: 4, duration: 0.22 })}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group relative rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-white/60 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white"
            >
              <div className="flex items-center justify-between">
                <span>{item}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

