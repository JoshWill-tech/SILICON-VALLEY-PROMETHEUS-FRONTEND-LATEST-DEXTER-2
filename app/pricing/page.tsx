import type { Metadata } from 'next'

import { LandingHeader } from '@/components/LandingHeader'
import { PricingSection } from '@/components/PricingSection'
import { PrometheusShell } from '@/components/prometheus-shell'

export const metadata: Metadata = {
  title: 'Pricing | Prometheus',
  description: 'Prometheus AI pricing for automated premium video editing and motion design infrastructure.',
}

export default function PricingPage() {
  return (
    <PrometheusShell header={<LandingHeader />}>
      <div className="relative min-h-screen overflow-hidden bg-[#07070a] px-4 py-28 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[-8rem] h-80 w-80 rounded-full bg-blue-500/10 blur-[140px]" />
          <div className="absolute bottom-[-10rem] right-[12%] h-96 w-96 rounded-full bg-violet-500/10 blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/34">
              Pricing
            </p>
            <h1 className="mt-4 text-4xl font-medium tracking-tight text-white sm:text-6xl">
              Premium video infrastructure, packaged for teams that ship.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/52 sm:text-lg">
              Choose a Prometheus AI plan for automated premium video editing, cinematic motion design, cloud-backed project storage, and export-ready rendering workflows.
            </p>
          </div>

          <PricingSection />
        </div>
      </div>
    </PrometheusShell>
  )
}
