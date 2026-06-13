import { NextResponse } from 'next/server'

import { getDodoClient } from '@/lib/dodo/client'
import { normalizeDodoPaymentMethods, syncPaymentMethodsForCustomer } from '@/lib/dodo/subscriptions'
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
    if (!subscription?.dodo_customer_id) return NextResponse.json([])

    const dodo = getDodoClient()
    const response = await dodo.customers.retrievePaymentMethods(subscription.dodo_customer_id)

    await syncPaymentMethodsForCustomer(user.id, subscription.dodo_customer_id, response.items)

    return NextResponse.json(normalizeDodoPaymentMethods(response.items))
  } catch (error) {
    console.error('[dodo payment methods get error]', error)
    return NextResponse.json({ error: 'Failed to fetch payment methods.' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription, error } = await supabase
      .from('dodo_subscriptions')
      .select('dodo_subscription_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!subscription?.dodo_subscription_id) {
      return NextResponse.json({ error: 'An active subscription is required to add a payment method.' }, { status: 404 })
    }

    const dodo = getDodoClient()
    const response = await dodo.subscriptions.updatePaymentMethod(subscription.dodo_subscription_id, {
      payment_method: {
        type: 'new',
        allowed_payment_method_types: ['credit', 'debit'],
        return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/settings/billing`,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[dodo payment methods post error]', error)
    const message = error instanceof Error ? error.message : 'Failed to initialize payment method update.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
