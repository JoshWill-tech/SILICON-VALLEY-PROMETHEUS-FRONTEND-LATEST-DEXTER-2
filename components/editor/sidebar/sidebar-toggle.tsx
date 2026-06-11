'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarToggleProps {
  buttonRef?: React.RefObject<HTMLButtonElement | null>
  onToggle: () => void
  defaultExpanded?: boolean
  className?: string
}

// No local state. This button delegates to useSidebarState, which mutates refs directly.
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
        'group flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/78 outline-none transition-colors duration-150 hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        className
      )}
    >
      <ChevronLeft className="h-4 w-4 group-data-[sidebar-state=closed]:hidden" aria-hidden="true" />
      <ChevronRight className="hidden h-4 w-4 group-data-[sidebar-state=closed]:block" aria-hidden="true" />
    </button>
  )
}
