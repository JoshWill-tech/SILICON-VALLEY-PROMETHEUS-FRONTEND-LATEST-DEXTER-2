// components/chat/ChatInput.tsx
'use client'

import * as React from 'react'
import { Paperclip, Mic, Send, Plus, History, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PresetId } from '@/lib/presets/daily-preset'
import { ParallaxInputCard } from '../effects/ParallaxInputCard'
import { VoiceWaveform } from '../effects/VoiceWaveform'

interface ChatInputProps {
  variant: PresetId
  placeholder?: string
  onSend?: (message: string) => void
}

export function ChatInput({ variant, placeholder, onSend }: ChatInputProps) {
  const [message, setMessage] = React.useState('')
  const [isVoiceActive, setIsVoiceActive] = React.useState(false)

  const handleSend = () => {
    if (message.trim()) {
      onSend?.(message)
      setMessage('')
    }
  }

  const baseStyles = "relative w-full transition-all duration-300"
  
  const variants = {
    zus: {
      container: "rounded-full bg-white/5 border border-white/10 px-4 py-2 flex items-center gap-3 backdrop-blur-xl",
      input: "bg-transparent border-none focus:ring-0 text-white placeholder-white/40 flex-1 py-2 text-sm",
      button: "size-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shrink-0 hover:scale-105 transition-transform",
      placeholder: placeholder || "Ask ZusGPT..."
    },
    alien: {
      container: "rounded-2xl bg-[#1a1d26] border border-white/10 p-4 flex flex-col gap-4 shadow-2xl",
      input: "bg-transparent border-none focus:ring-0 text-white placeholder-white/30 flex-1 text-sm resize-none min-h-[40px]",
      button: "px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors self-end",
      placeholder: placeholder || "Ask or search for anything use @ to tag a specific assistant"
    },
    opera: {
      container: "rounded-2xl bg-white/5 border border-white/10 px-6 py-4 flex items-center gap-4 backdrop-blur-2xl max-w-4xl mx-auto",
      input: "bg-transparent border-none focus:ring-0 text-white placeholder-white/30 flex-1 py-2 text-lg",
      button: "size-12 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0 hover:scale-110 transition-transform",
      placeholder: placeholder || "Ask Neon to make something for you..."
    },
    logipsum: {
      container: "rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-4 backdrop-blur-md",
      input: "bg-transparent border-none focus:ring-0 text-white placeholder-white/30 flex-1 text-base resize-none min-h-[60px]",
      button: "size-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 hover:bg-white/20 transition-colors self-end",
      placeholder: placeholder || "Message AI chat..."
    }
  }

  const active = variants[variant]

  return (
    <div className={cn("w-full max-w-4xl mx-auto px-4 pb-8", variant === 'opera' && "max-w-none")}>
      <ParallaxInputCard>
        <div className={cn(active.container, "relative")}>
          <AnimatePresence>
            {isVoiceActive && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-md rounded-[inherit] flex flex-col items-center justify-center p-4"
              >
                <VoiceWaveform active={isVoiceActive} className="w-full max-w-xs" />
                <button 
                  onClick={() => setIsVoiceActive(false)}
                  className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white"
                >
                  Tap to stop
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {variant === 'zus' && <Paperclip className="size-5 text-white/40 cursor-pointer hover:text-white/60 transition-colors" />}
          
          {variant === 'alien' || variant === 'logipsum' ? (
            <textarea
              className={active.input}
              placeholder={active.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
          ) : (
            <input
              type="text"
              className={active.input}
              placeholder={active.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend()
                }
              }}
            />
          )}

          {variant === 'alien' && (
             <div className="flex items-center justify-between mt-1">
               <div className="flex gap-2">
                 <Paperclip className="size-4 text-white/30 cursor-pointer hover:text-white/50" />
                 <Mic 
                   onClick={() => setIsVoiceActive(true)}
                   className="size-4 text-white/30 cursor-pointer hover:text-white/50" 
                 />
               </div>
               <button onClick={handleSend} className={active.button}>
                 Send
               </button>
             </div>
          )}

          {variant === 'logipsum' && (
             <div className="flex items-center justify-between mt-1">
               <div className="flex gap-3">
                  <button className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60">
                     <div className="size-4 rounded border border-white/20" /> Search
                  </button>
                  <button className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60">
                     <div className="size-4 rounded border border-white/20" /> Create Image
                  </button>
               </div>
               <div className="flex gap-2">
                  <Mic 
                    onClick={() => setIsVoiceActive(true)}
                    className="size-4 text-white/30 cursor-pointer hover:text-white/50" 
                  />
                  <button onClick={handleSend} className={active.button}>
                    <Send className="size-4" />
                  </button>
               </div>
             </div>
          )}

          {variant === 'zus' && (
            <button onClick={handleSend} className={active.button}>
              <Send className="size-5" />
            </button>
          )}

          {variant === 'opera' && (
            <>
              <div className="flex gap-4">
                <Paperclip className="size-6 text-white/30 cursor-pointer hover:text-white/50" />
                <Mic 
                  onClick={() => setIsVoiceActive(true)}
                  className="size-6 text-white/30 cursor-pointer hover:text-white/50" 
                />
              </div>
              <button onClick={handleSend} className={active.button}>
                <Send className="size-6" />
              </button>
            </>
          )}
        </div>
      </ParallaxInputCard>

      {variant === 'zus' && (
        <div className="flex items-center justify-center gap-6 mt-4">
          <button className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60">
            <Plus className="size-4" /> New Chat
          </button>
          <button className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60">
            <History className="size-4" /> History
          </button>
          <button className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 bg-white/5 px-2 py-1 rounded border border-white/10">
            GPT-4o <ChevronDown className="size-3" />
          </button>
        </div>
      )}
    </div>
  )
}
