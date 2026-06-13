'use client'

import { useBillingData } from './use-billing-data'

export function useBillingGate() {
  const { subscription, isLoading } = useBillingData()

  const hasAccess = subscription?.status === 'active'
  const isGated = !isLoading && !hasAccess

  return { isGated, isLoading, subscription }
}
