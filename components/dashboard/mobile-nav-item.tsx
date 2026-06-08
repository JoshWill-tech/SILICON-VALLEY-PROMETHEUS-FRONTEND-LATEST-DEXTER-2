'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MobileNavItemProps {
  label: string
  icon: LucideIcon
  active?: boolean
  destructive?: boolean
  onSelect: () => void
}

export function MobileNavItem({ label, icon: Icon, active = false, destructive = false, onSelect }: MobileNavItemProps) {
  return (
    <button
      type="button"
      role="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      className={cn(
        'group flex min-h-12 w-full items-center gap-3 border-l-2 px-4 py-3 text-left text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-cyan',
        active
          ? 'border-accent-cyan bg-white/[0.05] text-white'
          : 'border-transparent text-white/72 hover:bg-white/[0.08] hover:text-white',
        destructive && !active && 'text-white/58 hover:text-white/90'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-white/60 group-hover:text-white')} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  )
}
