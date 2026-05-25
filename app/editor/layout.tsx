'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

import { useBillingGate } from '@/hooks/use-billing-gate'
import { buildBillingHref } from '@/lib/billing'
import { BillingRequiredDialog } from '@/components/billing/billing-required-dialog'
import { EditorLoadingScreen } from '@/components/editor/editor-loading-screen'

const DISABLE_EDITOR_BILLING_GATE = process.env.NEXT_PUBLIC_DISABLE_EDITOR_BILLING_GATE === 'true'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isGated, isLoading } = useBillingGate()

  if (isLoading && !DISABLE_EDITOR_BILLING_GATE) {
    return <EditorLoadingScreen caption="Checking billing access..." />
  }

  if (isGated && !DISABLE_EDITOR_BILLING_GATE) {
    return (
      <>
        <EditorLoadingScreen caption="Billing required before editing..." />
        <BillingRequiredDialog open redirectHref={buildBillingHref(pathname)} contextLabel="Editor access" />
      </>
    )
  }

  return <>{children}</>
}
