import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getDodoClient } from '@/lib/dodo/client'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const updateSchema = z.object({
  action: z.enum(['cancel']),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('dodo_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(data ?? null)
  } catch (error) {
    console.error('[dodo subscription get error]', error)
    return NextResponse.json({ error: 'Failed to fetch subscription.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json())
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
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 })
    }

    if (payload.action === 'cancel') {
      const dodo = getDodoClient()
      await dodo.subscriptions.update(subscription.dodo_subscription_id, {
        cancel_at_next_billing_date: true,
        cancel_reason: 'cancelled_by_customer',
      })

      await supabase
        .from('dodo_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('dodo_subscription_id', subscription.dodo_subscription_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[dodo subscription patch error]', error)
    const message = error instanceof Error ? error.message : 'Failed to update subscription.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
