'use client'

import { Zap } from 'lucide-react'
import { motion } from 'framer-motion'

import { useNodeGraph } from '../../hooks/use-node-graph'

export function ExecuteNode() {
  const { executePipeline, isExecuting } = useNodeGraph()

  return (
    <motion.button
      aria-label="Execute pipeline"
      className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white shadow-[0_4px_24px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.03)] outline-none transition hover:border-[#22c55e]/50 hover:bg-[#22c55e]/10"
      onClick={(event) => {
        event.stopPropagation()
        executePipeline()
      }}
      animate={{
        boxShadow: isExecuting
          ? '0 0 0 1px rgba(34,197,94,0.55), 0 0 34px rgba(34,197,94,0.42), 0 10px 30px rgba(0,0,0,0.5)'
          : '0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03)',
        scale: isExecuting ? [1, 1.08, 1] : 1,
      }}
      transition={{ duration: 0.8, repeat: isExecuting ? Infinity : 0 }}
      type="button"
    >
      <Zap className="size-7 fill-white/10" aria-hidden />
    </motion.button>
  )
}
