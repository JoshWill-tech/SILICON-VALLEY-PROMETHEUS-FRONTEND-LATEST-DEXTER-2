'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Wand2, Clock } from 'lucide-react'
import { useEditor } from './EditorContext'

export const SceneEditor: React.FC = () => {
  const { segments, setSelection, setShowCommandBubble } = useEditor()

  if (typeof window !== 'undefined' && window.innerWidth >= 1024) return null

  const handleSceneTap = (seg: (typeof segments)[0]) => {
    setSelection({ startTime: seg.startTime, endTime: seg.endTime, startX: 0, endX: 0 })
    setShowCommandBubble(true)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full border-t border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl max-h-64 overflow-y-auto">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/40">Scenes</span>
          <span className="text-[10px] text-white/30">{segments.length} segments</span>
        </div>
        {segments.map((seg, idx) => (
          <motion.button
            key={seg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleSceneTap(seg)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:scale-[0.98] transition-colors text-left group"
          >
            <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-cyan-500/15 to-purple-500/15 flex items-center justify-center border border-white/[0.06] group-hover:border-cyan-500/25 transition-colors">
              <span className="text-sm font-bold text-white/20">{idx + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/80 truncate">{seg.label}</span>
                {seg.aiGenerated && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-white/40">
                <Clock size={10} />
                <span className="text-[11px] font-mono">{formatTime(seg.startTime)} — {formatTime(seg.endTime)}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/15 transition-colors">
              <Wand2 size={14} className="text-white/40 group-hover:text-cyan-400 transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
