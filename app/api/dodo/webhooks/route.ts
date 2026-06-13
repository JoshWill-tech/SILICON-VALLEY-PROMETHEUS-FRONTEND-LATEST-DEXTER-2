import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { getDodoClient } from '@/lib/dodo/client'
import {
  normalizePaymentAmount,
  normalizePaymentCurrency,
  normalizePaymentCustomerId,
  normalizePaymentInvoiceUrl,
  normalizePaymentRecordId,
  normalizePaymentStatus,
  normalizePaymentSubscriptionId,
  normalizeSubscriptionCustomerId,
  normalizeSubscriptionPeriod,
  recordInvoiceFromPayment,
  resetCreditsForSubscription,
  resolvePaymentUserId,
  syncPaymentMethodsForCustomer,
  upsertDodoSubscriptionFromEvent,
} from '@/lib/dodo/subscriptions'
import { getDodoWebhookHeaders, unwrapDodoWebhookEvent } from '@/lib/dodo/webhooks'

export const runtime = 'nodejs'

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration for Dodo webhooks.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function markWebhookStatus(eventId: string, status: 'processed' | 'failed', errorMessage?: string) {
  const supabase = getSupabaseAdminClient()
  await supabase
    .from('dodo_webhook_events')
    .update({
      status,
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('event_id', eventId)
}

export async function POST(request: Request) {
  const payload = await request.text()
  const headers = getDodoWebhookHeaders(request)

  if (!headers) {
    return NextResponse.json({ error: 'Missing Dodo webhook signature headers.' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  try {
    const event = unwrapDodoWebhookEvent(payload, headers)
    const eventId = headers['webhook-id']

    const { data: existing } = await supabase
      .from('dodo_webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existing?.id) {
      return new NextResponse('Already processed', { status: 200 })
    }

    await supabase.from('dodo_webhook_events').insert({
      event_id: eventId,
      event_type: event.type,
      payload: event,
    })

    const data = event.data as unknown as Record<string, unknown>

    switch (event.type) {
      case 'subscription.active':
      case 'subscription.updated':
      case 'subscription.cancelled':
      case 'subscription.on_hold':
      case 'subscription.failed':
      case 'subscription.expired': {
        const { userId } = await upsertDodoSubscriptionFromEvent(data)
        const customerId = normalizeSubscriptionCustomerId(data)

        if (userId && customerId) {
          const methods = await getDodoClient().customers.retrievePaymentMethods(customerId)
          await syncPaymentMethodsForCustomer(userId, customerId, methods.items)
        }
        break
      }

      case 'subscription.renewed': {
        const { userId, subscriptionDbId, tier } = await upsertDodoSubscriptionFromEvent(data)
        const { start: periodStart, end: periodEnd } = normalizeSubscriptionPeriod(data)
        await resetCreditsForSubscription({ userId, subscriptionDbId, tier, periodStart, periodEnd })
        break
      }

      case 'payment.succeeded': {
        const userId = await resolvePaymentUserId(data)
        const customerId = normalizePaymentCustomerId(data)

        await recordInvoiceFromPayment({
          userId,
          paymentId: normalizePaymentRecordId(data),
          subscriptionId: normalizePaymentSubscriptionId(data),
          amountCents: normalizePaymentAmount(data),
          currency: normalizePaymentCurrency(data),
          status: normalizePaymentStatus(data, 'succeeded'),
          invoiceUrl: normalizePaymentInvoiceUrl(data),
        })

        if (userId && customerId) {
          const methods = await getDodoClient().customers.retrievePaymentMethods(customerId)
          await syncPaymentMethodsForCustomer(userId, customerId, methods.items)
        }
        break
      }

      case 'payment.failed': {
        await recordInvoiceFromPayment({
          userId: await resolvePaymentUserId(data),
          paymentId: normalizePaymentRecordId(data),
          subscriptionId: normalizePaymentSubscriptionId(data),
          amountCents: normalizePaymentAmount(data),
          currency: normalizePaymentCurrency(data),
          status: normalizePaymentStatus(data, 'failed'),
          invoiceUrl: normalizePaymentInvoiceUrl(data),
        })
        break
      }
    }

    await markWebhookStatus(eventId, 'processed')
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[dodo webhook error]', error)
    await supabase.from('dodo_webhook_events').upsert({
      event_id: headers['webhook-id'],
      event_type: 'unknown',
      payload: payload ? { raw: payload } : {},
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Dodo webhook failed.',
    }, { onConflict: 'event_id' })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dodo webhook failed.' },
      { status: 400 },
    )
  }
}
