'use client'

import { Download, Instagram, Youtube } from 'lucide-react'

const platforms = ['YouTube', 'TikTok', 'Instagram', 'X'] as const

interface ExportTabProps {
  onRequestClose?: () => void
}

export function ExportTab({ onRequestClose }: ExportTabProps) {
  return (
    <section className="space-y-4 px-4 pb-5 pt-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/36">Export Settings</div>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Delivery targets</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {platforms.map((platform) => (
          <button key={platform} type="button" className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
            {platform}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white/82">
          <Youtube className="size-4 text-red-300" />
          4K UHD / MP4
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-white/82">
          <Instagram className="size-4 text-pink-300" />
          Captions burned in
        </div>
      </div>
      <button
        type="button"
        onClick={onRequestClose}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-prometheus-accent-purple/55 bg-prometheus-accent-purple px-4 text-sm font-semibold text-white shadow-[0_18px_54px_-24px_rgba(124,58,237,0.9)] transition-transform active:scale-[0.98]"
      >
        <Download className="size-4" />
        Export
      </button>
    </section>
  )
}
