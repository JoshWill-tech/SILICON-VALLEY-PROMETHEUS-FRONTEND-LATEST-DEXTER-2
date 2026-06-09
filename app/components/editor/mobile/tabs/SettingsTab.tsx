'use client'

import { Palette, Ratio, Settings2, TimerReset } from 'lucide-react'

const settings = [
  { label: 'Project name', value: 'Untitled Project', icon: Settings2 },
  { label: 'Duration', value: '00:42', icon: TimerReset },
  { label: 'Aspect ratio', value: '9:16 vertical', icon: Ratio },
  { label: 'Color grade', value: 'Cinematic clean', icon: Palette },
]

export function SettingsTab() {
  return (
    <section className="space-y-4 px-4 pb-5 pt-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/36">Project Settings</div>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Format controls</h2>
      </div>
      <div className="space-y-2">
        {settings.map((setting) => {
          const Icon = setting.icon
          return (
            <button key={setting.label} type="button" className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-left transition-colors hover:bg-white/[0.055]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-white/60">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white/86">{setting.label}</span>
                <span className="mt-1 block text-xs text-white/46">{setting.value}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
