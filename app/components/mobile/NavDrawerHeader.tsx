'use client'

import Image from 'next/image'

export function NavDrawerHeader() {
  return (
    <div className="border-b border-prometheus-border-subtle px-5 pb-5 pt-6">
      <div className="flex items-center">
        <Image
          src="/branding/prometheus-logo-no-bg.png"
          alt="Prometheus"
          width={20}
          height={20}
          className="size-5 object-contain"
          priority
        />
        <p
          className="ml-1 text-[10px] font-bold uppercase tracking-[0.32em] text-white/92"
          style={{ fontFamily: 'var(--font-mono), ui-sans-serif, system-ui, sans-serif' }}
        >
          rometheus
        </p>
      </div>
    </div>
  )
}
