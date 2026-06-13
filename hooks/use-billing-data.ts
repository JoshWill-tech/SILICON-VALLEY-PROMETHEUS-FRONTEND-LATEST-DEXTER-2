'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStorageLimit, getStorageTierFromPlan } from '@/lib/storage-limits'

export type SubscriptionData = {
  status: string
  plan_id: string
  tier?: string
  paddle_subscription_id: string | null
  dodo_subscription_id?: string | null
  dodo_customer_id?: string | null
  next_billing_date: string | null
  current_period_start?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean
  price_cents?: number
  currency?: string
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

export type PaymentMethodData = {
  id: string
  type: string
  last_four: string | null
  brand: string | null
  expiry_month: number | null
  expiry_year: number | null
  is_default: boolean
}

export type InvoiceData = {
  id: string
  status: string
  amount: string
  amount_cents?: number
  amount_display?: string
  currency: string
  date: string
  description?: string
  receiptUrl: string | null
  invoice_url?: string | null
}

export function useBillingData() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData>({
    renders: 0,
    renderLimit: 10,
    storageBytes: 0,
    storageLimit: getStorageLimit('free'),
  })
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubscription(null)
        setInvoices([])
        setPaymentMethods([])
        setUsage({
          renders: 0,
          renderLimit: 10,
          storageBytes: 0,
          storageLimit: getStorageLimit('free'),
        })
        setIsLoading(false)
        return
      }

      // 1. Fetch Dodo subscription
      const { data: subData, error: subError } = await supabase
        .from('dodo_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subError) throw subError

      // 2. Fetch Dodo credits
      const { data: creditData, error: creditError } = await supabase
        .from('dodo_credits')
        .select('total_allocated,total_used,total_remaining,period_start,period_end')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (creditError) throw creditError

      // 3. Fetch usage: Renders as a fallback for free-tier display
      const { count: renderCount, error: renderError } = await supabase
        .from('renders')
        .select('id, projects!inner(user_id)', { count: 'exact', head: true })
        .eq('projects.user_id', user.id)
        .eq('status', 'success')

      if (renderError) throw renderError

      // 4. Fetch usage: Storage
      const { data: assets, error: assetsError } = await supabase
        .from('source_assets')
        .select('size_bytes')
        .eq('user_id', user.id)

      if (assetsError) throw assetsError
      const totalBytes = (assets ?? []).reduce((acc, asset) => acc + (asset.size_bytes || 0), 0)

      // 5. Limits based on plan
      const renderLimits: Record<string, number> = {
        creator: 150,
        studio: 600,
        cinema: 2000,
        free: 10,
      }
      const storageTier = getStorageTierFromPlan(subData?.tier || 'free')
      const mappedSubscription: SubscriptionData | null = subData ? {
        status: subData.status,
        plan_id: subData.tier,
        tier: subData.tier,
        paddle_subscription_id: null,
        dodo_subscription_id: subData.dodo_subscription_id,
        dodo_customer_id: subData.dodo_customer_id,
        next_billing_date: subData.current_period_end,
        current_period_start: subData.current_period_start,
        current_period_end: subData.current_period_end,
        cancel_at_period_end: subData.cancel_at_period_end,
        price_cents: subData.price_cents,
        currency: subData.currency,
        card_brand: null,
        card_last_4: null,
        card_expiry_month: null,
        card_expiry_year: null,
      } : null

      setSubscription(mappedSubscription)

      setUsage({
        renders: creditData?.total_used ?? renderCount ?? 0,
        renderLimit: creditData?.total_allocated ?? renderLimits[storageTier],
        storageBytes: totalBytes,
        storageLimit: getStorageLimit(storageTier)
      })

      // 6. Fetch saved payment methods and Dodo invoices from server routes.
      try {
        const methodsResponse = await fetch('/api/dodo/payment-methods', { cache: 'no-store' })
        if (methodsResponse.ok) {
          const methodsData = await methodsResponse.json()
          const methods = Array.isArray(methodsData) ? methodsData : []
          setPaymentMethods(methods)

          const defaultMethod = methods.find((method: PaymentMethodData) => method.is_default) ?? methods[0]
          if (mappedSubscription && defaultMethod) {
            setSubscription({
              ...mappedSubscription,
              card_brand: defaultMethod.brand,
              card_last_4: defaultMethod.last_four,
              card_expiry_month: defaultMethod.expiry_month,
              card_expiry_year: defaultMethod.expiry_year,
            })
          }
        }
      } catch (methodErr) {
        console.error('Failed to fetch Dodo payment methods:', methodErr)
      }

      try {
        const invResponse = await fetch('/api/dodo/invoices', { cache: 'no-store' })
        if (invResponse.ok) {
          const invData = await invResponse.json()
          const invoiceRows = Array.isArray(invData) ? invData : []
          setInvoices(invoiceRows.map((invoice: any) => ({
            id: invoice.id,
            status: invoice.status,
            amount: typeof invoice.amount_display === 'string'
              ? invoice.amount_display.replace(`${invoice.currency} `, '')
              : ((invoice.amount_cents ?? 0) / 100).toFixed(2),
            amount_cents: invoice.amount_cents,
            amount_display: invoice.amount_display,
            currency: invoice.currency,
            date: invoice.date,
            description: invoice.description,
            receiptUrl: invoice.invoice_url ?? null,
            invoice_url: invoice.invoice_url ?? null,
          })))
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

  return { subscription, usage, invoices, paymentMethods, isLoading, error, refresh: fetchData }
}
