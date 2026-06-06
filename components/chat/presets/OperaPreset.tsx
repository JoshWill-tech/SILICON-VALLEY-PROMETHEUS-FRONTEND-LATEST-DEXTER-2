// components/chat/presets/OperaPreset.tsx
'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, CheckSquare, Wand2 } from 'lucide-react'
import { ChatInput } from '../ChatInput'

export function OperaPreset() {
  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 size-[800px] bg-blue-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 size-[800px] bg-purple-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 size-[600px] bg-orange-500/5 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex h-full">
        {/* Minimal Sidebar Labels */}
        <div className="w-20 border-r border-white/5 flex flex-col items-center py-12 gap-12 text-white/40 font-medium text-[10px] uppercase tracking-[0.2em]">
           <div className="flex flex-col items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <MessageSquare className="size-5" />
              <span>Chat</span>
           </div>
           <div className="flex flex-col items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <CheckSquare className="size-5" />
              <span>Do</span>
           </div>
           <div className="flex flex-col items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <Wand2 className="size-5" />
              <span>Make</span>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
           <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-5xl font-light mb-16 tracking-tight text-center"
           >
              What can <span className="text-orange-400 font-normal">Neon</span> make for you?
           </motion.h1>

           <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="w-full max-w-4xl"
           >
              <ChatInput variant="opera" />
           </motion.div>
        </div>
      </div>
    </div>
  )
}
