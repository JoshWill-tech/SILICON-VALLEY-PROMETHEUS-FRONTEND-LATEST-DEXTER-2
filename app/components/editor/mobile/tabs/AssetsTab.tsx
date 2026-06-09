'use client'

import { Clapperboard, FileVideo2, ImageIcon, UploadCloud } from 'lucide-react'

const assets = [
  { label: 'Primary source', meta: '9:16 / 00:42', icon: FileVideo2 },
  { label: 'Brand logo', meta: 'Transparent PNG', icon: ImageIcon },
  { label: 'B-roll cutaway', meta: 'R2 asset / 4K', icon: Clapperboard },
]

export function AssetsTab() {
  return (
    <section className="space-y-4 px-4 pb-5 pt-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/36">Assets / Media</div>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Media bin</h2>
      </div>
      <button type="button" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] text-sm font-medium text-white/76 transition-colors hover:bg-white/[0.065]">
        <UploadCloud className="size-4" />
        Upload media
      </button>
      <div className="space-y-2">
        {assets.map((asset) => {
          const Icon = asset.icon
          return (
            <div key={asset.label} className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.05] text-white/60">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-white/86">{asset.label}</span>
                <span className="mt-1 block text-xs text-white/46">{asset.meta}</span>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
