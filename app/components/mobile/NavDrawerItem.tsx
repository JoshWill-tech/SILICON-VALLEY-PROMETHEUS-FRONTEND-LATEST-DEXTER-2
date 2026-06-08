'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavDrawerItemProps {
  badge?: string
  href?: string
  icon: LucideIcon
  label: string
  onSelect: (href?: string) => void
  thumbnailTone?: 'cyan' | 'indigo' | 'purple'
}

const thumbnailToneClass = {
  cyan: 'from-prometheus-accent-cyan/26 to-prometheus-accent-cyan/6',
  indigo: 'from-prometheus-accent-indigo/30 to-prometheus-accent-indigo/6',
  purple: 'from-prometheus-accent-purple/30 to-prometheus-accent-purple/6',
}

export function NavDrawerItem({ badge, href, icon: Icon, label, onSelect, thumbnailTone }: NavDrawerItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(href)}
      className="group flex min-h-11 w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-sm text-prometheus-text-secondary outline-none transition-colors duration-150 hover:border-prometheus-border-glass hover:bg-white/[0.045] hover:text-prometheus-text-primary focus-visible:border-prometheus-accent-purple/40 focus-visible:bg-white/[0.055] focus-visible:text-prometheus-text-primary"
    >
      {thumbnailTone ? (
        <span
          aria-hidden="true"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-prometheus-border-glass bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
            thumbnailToneClass[thumbnailTone]
          )}
        >
          <Icon className="h-4 w-4 text-prometheus-text-primary/80" />
        </span>
      ) : (
        <Icon className="h-4 w-4 shrink-0 text-prometheus-text-tertiary transition-colors group-hover:text-prometheus-accent-cyan" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="rounded-full border border-prometheus-border-glass bg-prometheus-bg-tertiary px-2 py-0.5 text-[11px] font-medium text-prometheus-text-tertiary">
          {badge}
        </span>
      ) : null}
    </button>
  )
}
