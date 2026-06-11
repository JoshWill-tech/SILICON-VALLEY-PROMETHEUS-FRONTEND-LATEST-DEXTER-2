'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ActionPlan } from '@/lib/agents/social-agent/action-planner'
import { motion } from 'framer-motion'
import { Share2, Globe, Clock, Rocket, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmPostModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  plan: ActionPlan
}

export function ConfirmPostModal({ isOpen, onClose, onConfirm, plan }: ConfirmPostModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-white/10 text-white overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-6 space-y-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-lime-400/10 flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6 text-lime-400" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">Confirm Distribution</DialogTitle>
            <DialogDescription className="text-zinc-400">
              You&apos;re about to broadcast <span className="text-white font-medium">&quot;{plan.videoTitle}&quot;</span> to {plan.posts.length} platforms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Broadcast Summary</h4>
              <div className="flex flex-wrap gap-2">
                {plan.posts.map((post) => (
                  <div 
                    key={post.platform}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-zinc-300"
                  >
                    <CheckCircle2 className="w-3 h-3 text-lime-400" />
                    <span className="capitalize">{post.platform}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Engagement Engine</h4>
                <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 font-mono">
                  OPTIMIZED
                </div>
              </div>
              <p className="text-xs text-zinc-400 italic line-clamp-2">
                &quot;{plan.posts[0]?.caption}&quot;
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Globe className="w-4 h-4 text-zinc-500" />
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Visibility</div>
                <div className="text-xs text-white">Public</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Clock className="w-4 h-4 text-zinc-500" />
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Schedule</div>
                <div className="text-xs text-white">Immediate</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-zinc-900/50 p-6 gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl border-white/5 hover:bg-white/5 text-zinc-400"
          >
            Review Draft
          </Button>
          <Button 
            onClick={onConfirm}
            className="rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-semibold gap-2 shadow-[0_0_20px_rgba(163,230,53,0.2)]"
          >
            <Rocket className="w-4 h-4" />
            Launch Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
