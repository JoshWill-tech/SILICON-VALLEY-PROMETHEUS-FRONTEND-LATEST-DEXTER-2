'use client'

import { Settings, Sparkles } from 'lucide-react'

export function NavDrawerHeader() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 rounded-lg border border-prometheus-border-glass bg-white/[0.035] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-prometheus-accent-purple to-prometheus-accent-indigo text-sm font-semibold text-prometheus-text-primary shadow-[0_0_28px_rgba(124,58,237,0.25)]">
          JW
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-prometheus-text-primary">Joshua Wilson</p>
          <p className="truncate text-xs text-prometheus-text-tertiary">Prometheus Studio</p>
        </div>
        <button
          type="button"
          aria-label="Open settings"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-prometheus-text-tertiary transition-colors hover:bg-white/[0.06] hover:text-prometheus-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-purple/70"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-prometheus-accent-purple to-prometheus-accent-indigo px-4 py-3 text-sm font-semibold text-prometheus-text-primary shadow-[0_18px_42px_-24px_rgba(124,58,237,0.8)] transition-transform duration-200 hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-cyan/70 active:translate-y-0"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>Upgrade Plan</span>
      </button>
    </div>
  )
}
