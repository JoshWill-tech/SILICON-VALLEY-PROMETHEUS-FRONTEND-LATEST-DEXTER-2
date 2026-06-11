'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Trash2, 
  Send, 
  AlertCircle,
  Clock,
  MessageSquare,
  BarChart3
} from 'lucide-react'
import { useEditor, SavedSegment } from './EditorContext'
import { cn } from '@/lib/utils'

interface IterationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const IterationModal: React.FC<IterationModalProps> = ({ isOpen, onClose }) => {
  const { savedSegments, removeSavedSegment, updateSavedSegment } = useEditor()

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="iteration-modal flex flex-col glass-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-medium text-white">Iteration Manifest</h2>
            <p className="text-sm text-white/40 mt-1">Review and prioritize segments for Motion Brain processing.</p>
          </div>
          <button 
            onClick={onClose}
            className="size-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {savedSegments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <AlertCircle className="size-8 text-white/20" />
              </div>
              <p className="text-white/40">No segments saved for iteration yet.</p>
            </div>
          ) : (
            savedSegments.map((seg) => (
              <div key={seg.id} className="group relative flex gap-6 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                {/* Thumbnail */}
                <div className="size-24 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0">
                   <div className="size-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                      <Clock className="size-6 text-white/10" />
                   </div>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">
                           {formatTime(seg.startTime)} – {formatTime(seg.endTime)}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">
                           {Math.round(seg.endTime - seg.startTime)}s Duration
                        </span>
                     </div>
                     <button 
                       onClick={() => removeSavedSegment(seg.id)}
                       className="p-1.5 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                     >
                       <Trash2 className="size-3.5" />
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-2">
                           <MessageSquare className="size-2.5" /> Note
                        </label>
                        <input 
                          type="text" 
                          value={seg.note}
                          onChange={(e) => updateSavedSegment({ ...seg, note: e.target.value })}
                          className="w-full bg-void/50 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none focus:border-white/20"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-2">
                           <BarChart3 className="size-2.5" /> Priority
                        </label>
                        <select 
                          value={seg.priority}
                          onChange={(e) => updateSavedSegment({ ...seg, priority: e.target.value as any })}
                          className="w-full bg-void/50 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none focus:border-white/20 appearance-none"
                        >
                           <option value="Low">Low Priority</option>
                           <option value="Medium">Medium Priority</option>
                           <option value="High">High Priority</option>
                        </select>
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-between">
           <button 
             onClick={onClose}
             className="px-6 py-2 text-sm text-white/40 hover:text-white transition-colors"
           >
             Cancel
           </button>
           <button 
             disabled={savedSegments.length === 0}
             className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent-cyan text-void text-sm font-bold shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale disabled:scale-100"
           >
             Send to Motion Brain <Send className="size-4" />
           </button>
        </div>
      </motion.div>
    </div>
  )
}
