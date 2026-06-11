'use client'

import { Gauge } from 'lucide-react'

import type { EditorSidebarPanelKey } from '@/components/editor/EditorHamburgerSidebar'

const rows: Array<{ label: string; value: string }> = [
  { label: 'Scene intelligence', value: '7 beats mapped' },
  { label: 'Suggested move', value: 'Push-in reveal' },
  { label: 'Animation engine', value: 'GSAP ready' },
]

export function MotionBrainPanel({ onSelectPanel }: { onSelectPanel: (panel: EditorSidebarPanelKey) => void }) {
  return (
    <section className="space-y-3" aria-label="Motion Brain">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-xl border border-prometheus-border-subtle bg-white/[0.025] px-3 py-3">
          <span className="text-sm text-prometheus-text-secondary">{row.label}</span>
          <span className="text-sm font-medium text-prometheus-text-primary">{row.value}</span>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onSelectPanel('music')}
        className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-prometheus-accent-purple/25 bg-prometheus-accent-purple/10 px-4 text-sm font-medium text-prometheus-accent-purple transition-colors hover:bg-prometheus-accent-purple/15"
      >
        <Gauge className="size-4" aria-hidden="true" />
        Match music to this edit
      </button>
    </section>
  )
}
