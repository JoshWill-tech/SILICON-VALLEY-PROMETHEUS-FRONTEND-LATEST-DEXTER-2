// components/chat/presets/ZusPreset.tsx
'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { LineChart, Search, PlaySquare } from 'lucide-react'
import { ChatInput } from '../ChatInput'

const FEATURES = [
  { title: "Create a Graph", icon: LineChart, color: "emerald" },
  { title: "Web Search", icon: Search, color: "violet" },
  { title: "Analyze YouTube Video", icon: PlaySquare, color: "orange" },
]

export function ZusPreset() {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-semibold mb-3">What would you like to explore?</h1>
          <p className="text-white/50">Exploring new technologies enhances creativity and problem-solving skills</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 cursor-pointer overflow-hidden transition-all"
            >
              <div className={`absolute inset-0 bg-${feature.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity`} />
              <feature.icon className={`size-8 mb-4 text-${feature.color}-400`} />
              <h3 className="text-lg font-medium">{feature.title}</h3>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center">
         <ChatInput variant="zus" />
      </div>
    </div>
  )
}
