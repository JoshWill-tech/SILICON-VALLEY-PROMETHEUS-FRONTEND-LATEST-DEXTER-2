'use client'

import React, { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CaptionEditorProps {
  value: string
  onChange: (value: string) => void
  suggestions?: string[]
  maxLength?: number
}

export function CaptionEditor({ value, onChange, suggestions = [], maxLength = 2200 }: CaptionEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  
  const charCount = value.length
  const isNearLimit = charCount > maxLength * 0.9
  const isOverLimit = charCount > maxLength

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Type className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Caption</span>
        </div>
        <div className={cn(
          "text-[10px] font-mono px-2 py-0.5 rounded-full border",
          isOverLimit ? "text-red-400 border-red-400/20 bg-red-400/10" : 
          isNearLimit ? "text-amber-400 border-amber-400/20 bg-amber-400/10" : 
          "text-zinc-500 border-white/5 bg-white/5"
        )}>
          {charCount} / {maxLength}
        </div>
      </div>

      <div className="relative group">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Write a compelling caption..."
          className={cn(
            "min-h-[140px] bg-white/5 border-white/5 focus:border-lime-400/50 focus:ring-lime-400/20",
            "resize-none transition-all duration-300 rounded-2xl p-4 text-sm leading-relaxed text-zinc-200",
            isFocused && "bg-white/[0.08]"
          )}
        />
        
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-4 h-4 text-lime-400/40" />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest px-1">
            <Sparkles className="w-3 h-3 text-lime-400" />
            <span>AI Suggestions</span>
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onChange(suggestion)}
                className="text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-xs text-zinc-300 line-clamp-2"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
