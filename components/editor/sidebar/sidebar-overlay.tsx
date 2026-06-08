'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SidebarOverlayProps {
  overlayRef?: React.RefObject<HTMLButtonElement | null>
  defaultOpen?: boolean
  onClose: () => void
  className?: string
}

export function SidebarOverlay({ overlayRef, defaultOpen = false, onClose, className }: SidebarOverlayProps) {
  return (
    <button
      ref={overlayRef}
      type="button"
      tabIndex={-1}
      aria-hidden={!defaultOpen}
      aria-label="Close editor sidebar"
      onClick={onClose}
      className={cn(
        'pointer-events-none fixed inset-0 z-[55] opacity-0 outline-none transition-opacity duration-[200ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none lg:hidden',
        defaultOpen && 'pointer-events-auto opacity-100',
        className
      )}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.48)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    />
  )
}
