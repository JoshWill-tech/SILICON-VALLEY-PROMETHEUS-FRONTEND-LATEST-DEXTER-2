// components/chat/presets/LogipsumPreset.tsx
'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { ChatInput } from '../ChatInput'

const CHIPS = [
  "AI script writer", "Coding Assistant", "Essay writer", 
  "Business", "Translate", "YouTube summaries", 
  "AI Email writing", "AI pdf chat", "Research assistant"
]

export function LogipsumPreset() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#020617] to-[#0f172a] text-white overflow-hidden relative">
      <div className="absolute top-6 right-8">
        <button className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors">
          Model 2.5 <ChevronDown className="size-3" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold mb-12"
        >
          What's on your mind today?
        </motion.h1>

        <div className="w-full mb-8">
           <ChatInput variant="logipsum" />
        </div>

        <motion.div 
          className="flex flex-wrap justify-center gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          {CHIPS.map((chip) => (
            <motion.button
              key={chip}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60 transition-all"
            >
              {chip}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
