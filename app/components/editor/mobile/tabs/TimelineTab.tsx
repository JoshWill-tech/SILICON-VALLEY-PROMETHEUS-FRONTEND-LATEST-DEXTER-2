'use client'

import { Gauge, Timer } from 'lucide-react'

const beats = [
  { label: 'Hook impact', time: '0:07', detail: 'Punch zoom + bass accent' },
  { label: 'Caption reveal', time: '0:14', detail: 'Kinetic title split' },
  { label: 'Product beat', time: '0:24', detail: 'Slow push with shimmer' },
  { label: 'CTA resolve', time: '0:37', detail: 'Hold frame and fade' },
]

export function TimelineTab() {
  return (
    <section className="space-y-4 px-4 pb-5 pt-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/36">Timeline / Beat Mapping</div>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Edit rhythm</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/82">
          <Gauge className="size-4 text-prometheus-accent-cyan" />
          GSAP animation beats
        </div>
        <div className="space-y-2">
          {beats.map((beat) => (
            <div key={beat.label} className="flex gap-3 rounded-xl border border-white/8 bg-black/20 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-xs tabular-nums text-white/72">{beat.time}</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white/86">{beat.label}</span>
                <span className="mt-1 block text-xs text-white/46">{beat.detail}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/82">
          <Timer className="size-4 text-prometheus-accent-purple" />
          Transcript segments
        </div>
        <p className="text-sm leading-6 text-white/52">Segment transcript by hook, proof, demonstration, and CTA before sending motion notes to the editor.</p>
      </div>
    </section>
  )
}
