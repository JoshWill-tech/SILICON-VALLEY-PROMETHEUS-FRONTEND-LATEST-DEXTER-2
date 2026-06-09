'use client'

const versions = [
  { label: 'Current edit', value: 'Live draft' },
  { label: 'Checkpoint', value: 'Music pass' },
  { label: 'Previous export', value: '1080p social cut' },
]

export function VersionsPanel() {
  return (
    <section className="space-y-2" aria-label="Version history">
      {versions.map((version) => (
        <button key={version.label} type="button" className="flex min-h-14 w-full items-center justify-between rounded-xl border border-prometheus-border-subtle bg-white/[0.025] px-3 text-left transition-colors hover:bg-white/[0.045]">
          <span className="text-sm text-prometheus-text-primary">{version.label}</span>
          <span className="text-xs text-prometheus-text-tertiary">{version.value}</span>
        </button>
      ))}
    </section>
  )
}
