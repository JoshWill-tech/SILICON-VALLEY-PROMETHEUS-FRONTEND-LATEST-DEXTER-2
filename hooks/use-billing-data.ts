'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SubscriptionData = {
  status: string
  plan_id: string
  paddle_subscription_id: string | null
  next_billing_date: string | null
  card_brand: string | null
  card_last_4: string | null
  card_expiry_month: number | null
  card_expiry_year: number | null
}

export type UsageData = {
  renders: number
  renderLimit: number
  storageBytes: number
  storageLimit: number
}

export type InvoiceData = {
  id: string
  status: string
  amount: string
  currency: string
  date: string
  receiptUrl: string | null
}

export function useBillingData() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData>({ renders: 0, renderLimit: 0, storageBytes: 0, storageLimit: 0 })
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // 1. Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (subError) throw subError
      setSubscription(subData)

      // 2. Fetch usage: Renders
      const { count: renderCount, error: renderError } = await supabase
        .from('renders')
        .select('id, projects!inner(user_id)', { count: 'exact', head: true })
        .eq('projects.user_id', user.id)
        .eq('status', 'success')

      if (renderError) throw renderError

      // 3. Fetch usage: Storage
      const { data: assets, error: assetsError } = await supabase
        .from('source_assets')
        .select('size_bytes')
        .eq('user_id', user.id)

      if (assetsError) throw assetsError
      const totalBytes = assets.reduce((acc, asset) => acc + (asset.size_bytes || 0), 0)

      // 4. Limits based on plan
      const planLimits: Record<string, { renders: number; storage: number }> = {
        creator: { renders: 400, storage: 50 * 1024 * 1024 * 1024 }, // 50GB
        studio: { renders: 5000, storage: 500 * 1024 * 1024 * 1024 }, // 500GB
        cinema: { renders: 30000, storage: 2 * 1024 * 1024 * 1024 * 1024 }, // 2TB
        free: { renders: 10, storage: 1 * 1024 * 1024 * 1024 }, // 1GB
      }

      const limits = planLimits[subData?.plan_id || 'free']

      setUsage({
        renders: renderCount || 0,
        renderLimit: limits.renders,
        storageBytes: totalBytes,
        storageLimit: limits.storage
      })

      // 5. Fetch invoices (we'll create an API for this since it needs server-side Paddle SDK)
      try {
        const invResponse = await fetch('/api/billing/invoices')
        if (invResponse.ok) {
          const invData = await invResponse.json()
          setInvoices(invData)
        }
      } catch (invErr) {
        console.error('Failed to fetch invoices:', invErr)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { subscription, usage, invoices, isLoading, error, refresh: fetchData }
}
