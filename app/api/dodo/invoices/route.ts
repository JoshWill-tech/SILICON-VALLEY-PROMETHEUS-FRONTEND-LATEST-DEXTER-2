import { NextResponse } from 'next/server'

import { getDodoClient } from '@/lib/dodo/client'
import { recordInvoiceFromPayment } from '@/lib/dodo/subscriptions'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription, error } = await supabase
      .from('dodo_subscriptions')
      .select('dodo_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!subscription?.dodo_customer_id) {
      return NextResponse.json([])
    }

    const dodo = getDodoClient()
    const paymentsPage = await dodo.payments.list({
      customer_id: subscription.dodo_customer_id,
      status: 'succeeded',
    })

    const invoices = await Promise.all(
      paymentsPage.items.map(async (payment) => {
        await recordInvoiceFromPayment({
          userId: user.id,
          paymentId: payment.payment_id,
          subscriptionId: payment.subscription_id ?? null,
          amountCents: payment.total_amount,
          currency: payment.currency,
          status: payment.status ?? 'succeeded',
          invoiceUrl: payment.invoice_url ?? null,
        })

        return {
          id: payment.payment_id,
          date: payment.created_at,
          description: payment.subscription_id ? 'Subscription renewal' : 'Subscription payment',
          amount_cents: payment.total_amount,
          amount_display: `${payment.currency} ${(payment.total_amount / 100).toFixed(2)}`,
          currency: payment.currency,
          status: payment.status ?? 'succeeded',
          invoice_url: payment.invoice_url ?? null,
        }
      }),
    )

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('[dodo invoices error]', error)
    return NextResponse.json({ error: 'Failed to fetch invoices.' }, { status: 500 })
  }
}
