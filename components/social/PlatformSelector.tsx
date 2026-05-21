'use client'

import React from 'react'
import { SocialPlatform } from '@/lib/social/types'
import { motion } from 'framer-motion'
import { Youtube, Instagram, Twitter, Linkedin, Music2, Facebook } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlatformSelectorProps {
  selectedPlatforms: SocialPlatform[]
  onToggle: (platform: SocialPlatform) => void
}

const PLATFORMS: { id: SocialPlatform; label: string; icon: any; color: string }[] = [
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'hover:text-red-500' },
  { id: 'tiktok', label: 'TikTok', icon: Music2, color: 'hover:text-cyan-400' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'hover:text-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'hover:text-blue-500' },
  { id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'hover:text-sky-400' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'hover:text-blue-600' },
]

export function PlatformSelector({ selectedPlatforms, onToggle }: PlatformSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {PLATFORMS.map((platform) => {
        const isSelected = selectedPlatforms.includes(platform.id)
        const Icon = platform.icon
        
        return (
          <motion.button
            key={platform.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(platform.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
              "border backdrop-blur-md",
              isSelected 
                ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10"
            )}
          >
            <Icon className={cn(
              "w-4 h-4 transition-colors",
              isSelected ? "text-white" : "text-zinc-500",
              !isSelected && platform.color
            )} />
            <span>{platform.label}</span>
            
            {isSelected && (
              <motion.div
                layoutId="active-dot"
                className="w-1.5 h-1.5 rounded-full bg-lime-400"
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
