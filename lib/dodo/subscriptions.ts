import { createClient } from '@supabase/supabase-js'

import type { BillingPlanId } from '@/lib/billing'
import { DODO_TIER_CREDITS, inferTierFromProductId, getDodoTierPriceCents } from '@/lib/dodo/plans'

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration for Dodo subscriptions.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function normalizeTier(productId: string | null | undefined, metadata?: Record<string, unknown>) {
  const fromMetadata = typeof metadata?.tier === 'string' ? metadata.tier : null
  if (fromMetadata === 'creator' || fromMetadata === 'studio' || fromMetadata === 'cinema') return fromMetadata
  return inferTierFromProductId(productId)
}

function normalizeUserId(metadata?: Record<string, unknown>) {
  return typeof metadata?.userId === 'string' ? metadata.userId : null
}

function normalizeCustomerId(data: Record<string, unknown>) {
  if (typeof data.customer_id === 'string') return data.customer_id
  const customer = typeof data.customer === 'object' && data.customer ? data.customer as Record<string, unknown> : null
  return typeof customer?.customer_id === 'string' ? customer.customer_id : null
}

function getPeriodBounds(data: Record<string, unknown>) {
  const start = typeof data.current_period_start === 'string'
    ? data.current_period_start
    : typeof data.previous_billing_date === 'string'
      ? data.previous_billing_date
      : typeof data.period_start === 'string'
        ? data.period_start
        : typeof data.created_at === 'string'
          ? data.created_at
          : null
  const end = typeof data.current_period_end === 'string'
    ? data.current_period_end
    : typeof data.next_billing_date === 'string'
      ? data.next_billing_date
      : typeof data.period_end === 'string'
        ? data.period_end
        : null

  return { start, end }
}

function normalizeSubscriptionStatus(status: string | null) {
  if (
    status === 'active' ||
    status === 'on_hold' ||
    status === 'cancelled' ||
    status === 'expired' ||
    status === 'pending' ||
    status === 'failed'
  ) {
    return status
  }

  return 'pending'
}

function normalizeBillingInterval(data: Record<string, unknown>) {
  return typeof data.payment_frequency_interval === 'string'
    ? data.payment_frequency_interval
    : typeof data.subscription_period_interval === 'string'
      ? data.subscription_period_interval
      : typeof data.recurring_interval === 'string'
        ? data.recurring_interval
        : 'month'
}

export function normalizeSubscriptionCustomerId(data: Record<string, unknown>) {
  return normalizeCustomerId(data)
}

export function normalizeSubscriptionPeriod(data: Record<string, unknown>) {
  return getPeriodBounds(data)
}

export function normalizePaymentCustomerId(data: Record<string, unknown>) {
  return normalizeCustomerId(data)
}

export function normalizePaymentSubscriptionId(data: Record<string, unknown>) {
  return typeof data.subscription_id === 'string' ? data.subscription_id : null
}

export function normalizePaymentAmount(data: Record<string, unknown>) {
  return typeof data.total_amount === 'number' ? data.total_amount : 0
}

export function normalizePaymentCurrency(data: Record<string, unknown>) {
  return typeof data.currency === 'string' ? data.currency : 'USD'
}

export function normalizePaymentInvoiceUrl(data: Record<string, unknown>) {
  return typeof data.invoice_url === 'string' ? data.invoice_url : null
}

export function normalizePaymentRecordId(data: Record<string, unknown>) {
  return typeof data.payment_id === 'string' ? data.payment_id : crypto.randomUUID()
}

export function normalizePaymentStatus(data: Record<string, unknown>, fallback: string) {
  return typeof data.status === 'string' ? data.status : fallback
}

export function normalizeDodoPaymentMethods(items: Array<{
  payment_method: string
  payment_method_id: string
  card?: {
    card_network?: string | null
    expiry_month?: string | null
    expiry_year?: string | null
    last4_digits?: string | null
  } | null
}>) {
  return items.map((item, index) => ({
    id: item.payment_method_id,
    type: item.payment_method,
    last_four: item.card?.last4_digits ?? null,
    brand: item.card?.card_network ?? null,
    expiry_month: item.card?.expiry_month ? Number.parseInt(item.card.expiry_month, 10) : null,
    expiry_year: item.card?.expiry_year ? Number.parseInt(item.card.expiry_year, 10) : null,
    is_default: index === 0,
  }))
}

export async function findUserIdBySubscriptionId(subscriptionId: string | null) {
  if (!subscriptionId) return null
  const supabase = getSupabaseAdminClient()

  const { data } = await supabase
    .from('dodo_subscriptions')
    .select('user_id')
    .eq('dodo_subscription_id', subscriptionId)
    .maybeSingle()

  return data?.user_id ?? null
}

export async function findUserIdByCustomerId(customerId: string | null) {
  if (!customerId) return null
  const supabase = getSupabaseAdminClient()

  const { data } = await supabase
    .from('dodo_subscriptions')
    .select('user_id')
    .eq('dodo_customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.user_id ?? null
}

export async function resolvePaymentUserId(data: Record<string, unknown>) {
  const metadata = typeof data.metadata === 'object' && data.metadata ? (data.metadata as Record<string, unknown>) : undefined
  const metadataUserId = normalizeUserId(metadata)

  return metadataUserId
    ?? await findUserIdBySubscriptionId(normalizePaymentSubscriptionId(data))
    ?? await findUserIdByCustomerId(normalizePaymentCustomerId(data))
}

export async function upsertDodoSubscriptionFromEvent(data: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient()
  const metadata = typeof data.metadata === 'object' && data.metadata ? (data.metadata as Record<string, unknown>) : undefined
  const productId = typeof data.product_id === 'string' ? data.product_id : null
  const userId = normalizeUserId(metadata)
  const tier = normalizeTier(productId, metadata)
  const subscriptionId = typeof data.subscription_id === 'string' ? data.subscription_id : typeof data.id === 'string' ? data.id : null
  const customerId = normalizeCustomerId(data)
  const status = normalizeSubscriptionStatus(typeof data.status === 'string' ? data.status : null)

  if (!userId || !tier || !subscriptionId || !customerId || !status || !productId) {
    throw new Error('Dodo webhook payload is missing required subscription fields.')
  }

  const { start, end } = getPeriodBounds(data)
  const priceCents = typeof data.recurring_pre_tax_amount === 'number'
    ? data.recurring_pre_tax_amount
    : typeof data.total_amount === 'number'
      ? data.total_amount
      : getDodoTierPriceCents(tier)

  const { data: existing } = await supabase
    .from('dodo_subscriptions')
    .select('id')
    .eq('dodo_subscription_id', subscriptionId)
    .maybeSingle()

  const payload = {
    user_id: userId,
    dodo_subscription_id: subscriptionId,
    dodo_customer_id: customerId,
    product_id: productId,
    status,
    tier,
    price_cents: priceCents,
    currency: typeof data.currency === 'string' ? data.currency : 'USD',
    billing_interval: normalizeBillingInterval(data),
    current_period_start: start,
    current_period_end: end,
    cancel_at_period_end: Boolean(data.cancel_at_next_billing_date),
    updated_at: new Date().toISOString(),
  }

  const { data: subscription, error } = await supabase
    .from('dodo_subscriptions')
    .upsert(payload, { onConflict: 'dodo_subscription_id' })
    .select('id')
    .single()

  if (error) throw error

  if (!existing?.id) {
    await resetCreditsForSubscription({
      userId,
      subscriptionDbId: subscription.id,
      tier,
      periodStart: start,
      periodEnd: end,
    })
  }

  return { userId, subscriptionDbId: subscription.id, tier }
}

export async function resetCreditsForSubscription(input: {
  userId: string
  subscriptionDbId: string
  tier: BillingPlanId
  periodStart: string | null
  periodEnd: string | null
}) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from('dodo_credits')
    .insert({
      user_id: input.userId,
      subscription_id: input.subscriptionDbId,
      total_allocated: DODO_TIER_CREDITS[input.tier],
      total_used: 0,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}

export async function syncPaymentMethodsForCustomer(userId: string, customerId: string, items: Array<{
  payment_method: string
  payment_method_id: string
  card?: {
    card_network?: string | null
    expiry_month?: string | null
    expiry_year?: string | null
    last4_digits?: string | null
  } | null
}>) {
  const supabase = getSupabaseAdminClient()

  const { error: deleteError } = await supabase.from('dodo_payment_methods').delete().eq('user_id', userId)
  if (deleteError) throw deleteError

  if (items.length === 0) return

  const rows = items.map((item, index) => ({
    user_id: userId,
    dodo_customer_id: customerId,
    dodo_payment_method_id: item.payment_method_id,
    type: item.payment_method,
    last_four: item.card?.last4_digits ?? null,
    brand: item.card?.card_network ?? null,
    expiry_month: item.card?.expiry_month ? Number.parseInt(item.card.expiry_month, 10) : null,
    expiry_year: item.card?.expiry_year ? Number.parseInt(item.card.expiry_year, 10) : null,
    is_default: index === 0,
  }))

  const { error } = await supabase.from('dodo_payment_methods').insert(rows)
  if (error) throw error
}

export async function recordInvoiceFromPayment(input: {
  userId: string | null
  paymentId: string
  subscriptionId: string | null
  amountCents: number
  currency: string
  status: string
  invoiceUrl: string | null
}) {
  if (!input.userId) return

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from('dodo_invoices').upsert({
    user_id: input.userId,
    dodo_payment_id: input.paymentId,
    dodo_subscription_id: input.subscriptionId,
    amount_cents: input.amountCents,
    currency: input.currency,
    status: input.status,
    invoice_url: input.invoiceUrl,
  }, { onConflict: 'dodo_payment_id' })

  if (error) throw error
}
