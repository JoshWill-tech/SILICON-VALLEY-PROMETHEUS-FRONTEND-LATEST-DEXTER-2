'use client'

import { ExternalLink, Moon, Waves, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export function MotionHeader() {
  return (
    <motion.header
      className="absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-between px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-center gap-3">
        <motion.span
          className="grid size-8 place-items-center rounded-lg bg-white/[0.045] text-white"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
        >
          <Zap className="size-5 fill-white/10" aria-hidden />
        </motion.span>
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.35 }}
        >
          <h1 className="text-[15px] font-medium tracking-normal text-white">Visual Mood Experiment</h1>
          <span className="size-2 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.85)]" />
        </motion.div>
      </div>

      <motion.div
        className="flex items-center gap-3 text-white"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.35 }}
      >
        <button className="grid size-8 place-items-center rounded-lg text-white/72 transition hover:bg-white/[0.06] hover:text-white" type="button" aria-label="Night mode">
          <Moon className="size-[18px]" aria-hidden />
        </button>
        <button className="grid size-8 place-items-center rounded-lg text-white/72 transition hover:bg-white/[0.06] hover:text-white" type="button" aria-label="Share">
          <ExternalLink className="size-[18px]" aria-hidden />
        </button>
        <div className="flex items-center -space-x-2">
          {['#c7f9cc', '#ffe5a3', '#9be7ff'].map((color, index) => (
            <span
              className="grid size-7 place-items-center rounded-full border border-[#0a0a0a] text-[10px] font-semibold text-black/65"
              key={color}
              style={{ backgroundColor: color, zIndex: 3 - index }}
            >
              {['A', 'M', 'R'][index]}
            </span>
          ))}
          <span className="grid h-7 min-w-8 place-items-center rounded-full border border-[#0a0a0a] bg-[#171717] px-2 text-[10px] font-semibold text-white">
            +2
          </span>
        </div>
        <div className="flex h-8 w-9 items-center justify-center gap-0.5 text-[#22c55e]" aria-label="Audio active">
          {[0, 1, 2, 3].map((bar) => (
            <span
              className="motion-audio-bar w-1 rounded-full bg-[#22c55e]"
              key={bar}
              style={{ animationDelay: `${bar * 0.12}s` }}
            />
          ))}
          <Waves className="sr-only" />
        </div>
      </motion.div>
    </motion.header>
  )
}
