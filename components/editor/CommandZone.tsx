'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Command, Download, Sparkles, Wand2 } from 'lucide-react'

const quickActions = [
  { id: 'interrogate', label: 'Interrogate', icon: Sparkles, shortcut: '⌘I', command: 'ai' },
  { id: 'enhance', label: 'Enhance', icon: Wand2, shortcut: '⌘E', command: 'enhance' },
  { id: 'export', label: 'Export', icon: Download, shortcut: '⌘⇧E', command: 'export' },
]

function dispatchEditorCommand(command: string) {
  window.dispatchEvent(new CustomEvent('prometheus:editor-command', { detail: { command } }))
}

export function CommandZone() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const openZone = () => setOpen(true)
    const closeZone = () => setOpen(false)
    const toggleZone = () => setOpen((nextOpen) => !nextOpen)

    window.addEventListener('prometheus:command-zone-open', openZone)
    window.addEventListener('prometheus:command-zone-close', closeZone)
    window.addEventListener('prometheus:command-zone-toggle', toggleZone)

    return () => {
      window.removeEventListener('prometheus:command-zone-open', openZone)
      window.removeEventListener('prometheus:command-zone-close', closeZone)
      window.removeEventListener('prometheus:command-zone-toggle', toggleZone)
    }
  }, [])

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-panel mb-3 flex max-w-[calc(100vw-2rem)] gap-2 overflow-x-auto rounded-2xl border border-border-subtle p-2"
          >
            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => dispatchEditorCommand(action.command)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-text-secondary transition-all hover:bg-white/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                  <kbd className="ml-1 rounded bg-surface-floating px-1.5 py-0.5 text-xs text-text-tertiary">
                    {action.shortcut}
                  </kbd>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((nextOpen) => !nextOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-accent-cyan/30 bg-accent-cyan-glow text-accent-cyan shadow-glow-cyan transition-all hover:scale-105 hover:shadow-glow-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        aria-expanded={open}
        aria-label={open ? 'Close command zone' : 'Open command zone'}
      >
        <Command className="h-5 w-5" />
      </button>
    </div>
  )
}
