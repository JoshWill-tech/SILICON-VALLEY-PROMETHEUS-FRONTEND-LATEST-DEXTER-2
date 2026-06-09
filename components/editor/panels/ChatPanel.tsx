'use client'

import { MessageSquare } from 'lucide-react'

export function ChatPanel() {
  return (
    <section className="space-y-3" aria-label="Editor chat">
      <div className="rounded-xl border border-prometheus-border-subtle bg-white/[0.025] p-4">
        <MessageSquare className="mb-3 size-5 text-prometheus-accent-cyan" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-prometheus-text-primary">Project-aware chat</h3>
        <p className="mt-2 text-sm leading-6 text-prometheus-text-secondary">
          Ask for captions, cuts, soundtrack changes, export prep, or platform-specific posting notes.
        </p>
      </div>
      <textarea
        className="min-h-24 w-full resize-none rounded-xl border border-prometheus-border-subtle bg-black/24 p-3 text-sm text-prometheus-text-primary outline-none placeholder:text-prometheus-text-tertiary focus:border-prometheus-accent-cyan/60"
        placeholder="Tell Prometheus what to change..."
      />
    </section>
  )
}
