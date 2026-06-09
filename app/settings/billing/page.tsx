import { Suspense } from 'react'

import { BillingDashboard } from '@/components/billing/billing-dashboard'
import { PageHeader } from '@/components/page-header'
import { PrometheusShell } from '@/components/prometheus-shell'

export default function SettingsBillingPage() {
  return (
    <PrometheusShell
      header={
        <PageHeader
          title="Workspace Billing & Plans"
          description="Production Capability"
          showBackButton
        />
      }
    >
      <Suspense fallback={null}>
        <BillingDashboard />
      </Suspense>
    </PrometheusShell>
  )
}
