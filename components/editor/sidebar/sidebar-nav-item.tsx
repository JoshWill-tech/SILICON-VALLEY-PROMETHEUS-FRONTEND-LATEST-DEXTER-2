'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarNavItemProps {
  label: string
  icon: LucideIcon
  active?: boolean
  onSelect: () => void
  badge?: string | number
  ariaLabel?: string
}

// Shared 44px-min nav target with real button semantics and route/panel callbacks supplied by the shell.
export function SidebarNavItem({
  label,
  icon: Icon,
  active = false,
  onSelect,
  badge,
  ariaLabel,
}: SidebarNavItemProps) {
  return (
    <button
      type="button"
      role="button"
      aria-label={ariaLabel ?? label}
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      className={cn(
        'group flex min-h-11 w-full items-center gap-3 border-l-2 px-4 py-2 text-left font-sans text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-cyan',
        active
          ? 'border-accent-cyan bg-white/5 text-white'
          : 'border-transparent text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-white/60 group-hover:text-white')} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] leading-none text-white/50">
          {badge}
        </span>
      )}
    </button>
  )
}
