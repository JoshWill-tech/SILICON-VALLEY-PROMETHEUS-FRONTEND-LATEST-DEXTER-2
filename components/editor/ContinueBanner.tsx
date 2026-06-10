'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useEditor } from './EditorContext'

export const ContinueBanner: React.FC = () => {
  const { currentTime, projectId } = useEditor()
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem('prometheus_continue_banner_dismissed') === 'true',
  )
  const dismissTimerRef = useRef<number | null>(null)

  const dismiss = useCallback(() => {
    window.sessionStorage.setItem('prometheus_continue_banner_dismissed', 'true')
    setDismissed(true)
  }, [])

  const resetDismissTimer = useCallback(() => {
    if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = window.setTimeout(dismiss, 8000)
  }, [dismiss])

  useEffect(() => {
    if (dismissed) return
    resetDismissTimer()
    return () => {
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current)
    }
  }, [dismissed, resetDismissTimer])

  const handleCopyLink = () => {
    const url = new URL(window.location.origin)
    url.pathname = '/continue'
    if (projectId) url.searchParams.set('session_id', projectId)
    url.searchParams.set('timestamp', currentTime.toString())

    navigator.clipboard.writeText(url.toString())
    setCopied(true)
    
    // Convert to mm:ss
    const mins = Math.floor(currentTime / 60)
    const secs = Math.floor(currentTime % 60).toString().padStart(2, '0')
    toast.success(`Link copied. Resume on desktop from ${mins}:${secs}.`)
    
    setTimeout(() => setCopied(false), 2000)
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-6 left-4 right-4 z-30 flex items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-[linear-gradient(135deg,#1a1a2e_0%,#0a0a1f_100%)] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-[20px]"
        onMouseEnter={resetDismissTimer}
        onPointerDown={resetDismissTimer}
      >
        <p className="max-w-[min(58vw,24rem)] text-xs leading-relaxed text-white/80">
          Complex motion editing works better on desktop. Copy link to continue seamlessly.
        </p>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex h-9 items-center justify-center gap-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 px-3 text-xs font-bold uppercase tracking-widest text-accent-blue transition-colors hover:bg-accent-blue/20"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          
          <button 
            onClick={dismiss}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
