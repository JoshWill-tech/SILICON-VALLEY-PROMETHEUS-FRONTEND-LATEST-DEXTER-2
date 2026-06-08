'use client'

import * as React from 'react'
import { PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarToggleProps {
  buttonRef?: React.RefObject<HTMLButtonElement | null>
  onToggle: () => void
  defaultExpanded?: boolean
  className?: string
}

export function SidebarToggle({ buttonRef, onToggle, defaultExpanded = true, className }: SidebarToggleProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="button"
      aria-label="Toggle editor sidebar"
      aria-controls="editor-sidebar-v2"
      aria-expanded={defaultExpanded}
      data-sidebar-state={defaultExpanded ? 'open' : 'closed'}
      onClick={onToggle}
      className={cn(
        'fixed left-3 top-3 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.45)] outline-none transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-cyan',
        className
      )}
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      }}
    >
      <PanelLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
