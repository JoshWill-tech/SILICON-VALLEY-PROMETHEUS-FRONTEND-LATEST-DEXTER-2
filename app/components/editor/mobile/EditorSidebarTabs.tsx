'use client'

import type { LucideIcon } from 'lucide-react'
import { Clapperboard, Download, Music2, Settings, Timer } from 'lucide-react'

import { cn } from '@/lib/utils'

export type EditorMobileTab = 'music' | 'timeline' | 'assets' | 'export' | 'settings'

export const EDITOR_MOBILE_TABS: Array<{
  description: string
  icon: LucideIcon
  key: EditorMobileTab
  label: string
}> = [
  { key: 'music', label: 'Music', description: 'Soundtrack search and AI match', icon: Music2 },
  { key: 'timeline', label: 'Timeline', description: 'Beats, transcript, animation cues', icon: Timer },
  { key: 'assets', label: 'Assets', description: 'Source clips and media bin', icon: Clapperboard },
  { key: 'export', label: 'Export', description: 'Platform and quality controls', icon: Download },
  { key: 'settings', label: 'Settings', description: 'Project format and polish', icon: Settings },
]

interface EditorSidebarTabsProps {
  activeTab: EditorMobileTab
  onChange: (tab: EditorMobileTab) => void
}

export function EditorSidebarTabs({ activeTab, onChange }: EditorSidebarTabsProps) {
  return (
    <nav className="space-y-1 px-3 py-3" aria-label="Editor mobile tools">
      {EDITOR_MOBILE_TABS.map((tab) => {
        const Icon = tab.icon
        const active = activeTab === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'group flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-purple/70',
              active ? 'bg-[#1a1a24]/80 text-[#f8fafc]' : 'text-[#94a3b8] hover:bg-white/[0.03] hover:text-white',
            )}
          >
            <span
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors',
                active ? 'border-prometheus-accent-purple/40 bg-prometheus-accent-purple/18 text-white' : 'border-white/8 bg-white/[0.03] text-white/58',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="mt-0.5 block truncate text-xs text-white/40">{tab.description}</span>
            </span>
            {active ? <span className="size-1.5 rounded-full bg-[#7c3aed] shadow-[0_0_12px_rgba(124,58,237,0.75)]" /> : null}
          </button>
        )
      })}
    </nav>
  )
}
