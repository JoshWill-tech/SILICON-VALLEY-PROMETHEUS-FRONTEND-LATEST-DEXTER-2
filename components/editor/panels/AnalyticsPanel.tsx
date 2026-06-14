'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const rows = [
  { label: 'Hook strength', value: '92%' },
  { label: 'Retention forecast', value: '+18%' },
  { label: 'Export health', value: 'Ready' },
]

export function AnalyticsPanel() {
  return (
    <section className="space-y-3" aria-label="Analytics">
      <Link
        href="/analytics"
        className="premium-liquid-pill flex items-center justify-between rounded-2xl border border-[#7ff2d4]/16 bg-[#7ff2d4]/[0.055] px-3 py-3 text-sm font-medium text-white/82"
      >
        Open full analytics
        <ArrowUpRight className="size-4" />
      </Link>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-xl border border-prometheus-border-subtle bg-white/[0.025] px-3 py-3">
          <span className="text-sm text-prometheus-text-secondary">{row.label}</span>
          <span className="text-sm font-medium text-prometheus-text-primary">{row.value}</span>
        </div>
      ))}
    </section>
  )
}
