'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavDrawerItemProps {
  href: string
  icon: LucideIcon
  isActive: boolean
  label: string
  onSelect: (href: string) => void
}

export function NavDrawerItem({ href, icon: Icon, isActive, label, onSelect }: NavDrawerItemProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onSelect(href)}
      className={cn(
        'group relative flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-prometheus-accent-purple/70',
        isActive
          ? 'bg-[#1a1a24]/80 text-[#f8fafc] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
          : 'text-[#94a3b8] hover:bg-white/[0.03] hover:text-prometheus-text-primary',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-150',
          isActive
            ? 'border-white/10 bg-white/[0.05] text-white/86'
            : 'border-white/8 bg-white/[0.03] text-white/58 group-hover:border-white/14 group-hover:bg-white/[0.05] group-hover:text-white/82',
        )}
      >
        <Icon className="size-[17px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate tracking-[0.01em]">{label}</span>
      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute right-4 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[#7c3aed] shadow-[0_0_12px_rgba(124,58,237,0.75)]"
        />
      ) : null}
    </button>
  )
}
