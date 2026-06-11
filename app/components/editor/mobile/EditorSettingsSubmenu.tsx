'use client'

import { Accessibility, Gauge, Monitor, Palette } from 'lucide-react'

import { cn } from '@/lib/utils'

export type EditorSettingsPanelKey = 'appearance' | 'performance' | 'accessibility' | 'display'

const settingsItems: Array<{
  icon: React.ComponentType<{ className?: string }>
  key: EditorSettingsPanelKey
  label: string
}> = [
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'performance', label: 'Performance', icon: Gauge },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { key: 'display', label: 'Display', icon: Monitor },
]

interface EditorSettingsSubmenuProps {
  onSelect: (panel: EditorSettingsPanelKey) => void
  open: boolean
}

export function EditorSettingsSubmenu({ onSelect, open }: EditorSettingsSubmenuProps) {
  if (!open) return null

  return (
    <div className="ml-8 mt-1 space-y-1 border-l border-prometheus-border-subtle pl-4">
      {settingsItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={cn(
              'group flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-[#94a3b8] outline-none transition-colors duration-150 hover:bg-white/[0.03] hover:text-prometheus-text-primary focus-visible:ring-2 focus-visible:ring-prometheus-accent-purple/70',
            )}
          >
            <Icon className="size-4 shrink-0 text-white/48 transition-colors group-hover:text-white/78" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
