'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useBillingData } from './use-billing-data'

export function useBillingGate() {
  const router = useRouter()
  const pathname = usePathname()
  const { subscription, isLoading, error } = useBillingData()
  const [isGated, setIsGated] = useState(false)

  useEffect(() => {
    if (isLoading) return

    // If there is an error fetching billing, we might want to fail-safe or fail-closed.
    // For a paywall, we usually fail-closed (gate it) or allow a grace period.
    // Let's assume if no subscription is found, it's gated.
    const hasAccess = subscription?.status === 'active' || subscription?.status === 'trialing'

    if (!hasAccess) {
      setIsGated(true)
    } else {
      setIsGated(false)
    }
  }, [subscription, isLoading, error, router, pathname])

  return { isGated, isLoading, subscription }
}
