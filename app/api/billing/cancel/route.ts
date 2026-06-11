import { NextResponse } from 'next/server'
import { getPaddleClient } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('paddle_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!subscription?.paddle_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    const paddle = getPaddleClient()
    
    // Cancel subscription at the end of the period
    await paddle.subscriptions.cancel(subscription.paddle_subscription_id, {
      effectiveFrom: 'next_billing_period',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[cancel error]', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
