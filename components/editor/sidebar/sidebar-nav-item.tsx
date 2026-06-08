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
  collapsed?: boolean
}

// Shared 44px-min nav target with real button semantics and route/panel callbacks supplied by the shell.
export function SidebarNavItem({
  label,
  icon: Icon,
  active = false,
  onSelect,
  badge,
  ariaLabel,
  collapsed = false,
}: SidebarNavItemProps) {
  return (
    <button
      type="button"
      role="button"
      aria-label={ariaLabel ?? label}
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      title={label}
      className={cn(
        'group flex min-h-11 w-full items-center border-l-2 py-2 text-left font-sans text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        collapsed
          ? 'justify-center gap-0 px-0'
          : 'gap-3 px-4 group-data-[sidebar-state=closed]/editor-sidebar:justify-center group-data-[sidebar-state=closed]/editor-sidebar:gap-0 group-data-[sidebar-state=closed]/editor-sidebar:px-0',
        active
          ? 'border-accent-cyan bg-white/5 text-white'
          : 'border-transparent text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-white/60 group-hover:text-white')} aria-hidden="true" />
      <span className={cn('min-w-0 flex-1 truncate group-data-[sidebar-state=closed]/editor-sidebar:sr-only lg:max-xl:sr-only', collapsed && 'sr-only')}>
        {label}
      </span>
      {badge !== undefined && !collapsed && (
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] leading-none text-white/50">
          {badge}
        </span>
      )}
    </button>
  )
}
