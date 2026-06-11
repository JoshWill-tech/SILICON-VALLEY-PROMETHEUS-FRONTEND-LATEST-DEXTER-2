import { NextResponse } from 'next/server'

import { isBillingPlanId } from '@/lib/billing-plans'
import { getPaddleClient } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('session_id')?.trim()

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing session_id (transactionId).' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Please sign in before checking Paddle status.' }, { status: 401 })
    }

    const paddle = getPaddleClient()
    const transaction = await paddle.transactions.get(transactionId)
    
    // Extract userId from customData if present
    const customData = transaction.customData as Record<string, any> | undefined
    const ownerUserId = customData?.userId

    if (!ownerUserId || ownerUserId !== user.id) {
      return NextResponse.json({ error: 'This transaction does not belong to the current user.' }, { status: 403 })
    }

    const rawPlanId = customData?.planId
    const planId = isBillingPlanId(rawPlanId) ? rawPlanId : null
    const subscriptionId = transaction.subscriptionId ?? null
    const priceId = transaction.items?.[0]?.price?.id ?? null

    return NextResponse.json({
      id: transaction.id,
      status: transaction.status,
      paymentStatus: transaction.status === 'completed' ? 'paid' : transaction.status,
      planId,
      priceId,
      customerEmail: user.email ?? null,
      subscriptionId,
    })
  } catch (error) {
    console.error('[paddle checkout-session error]', error)
    const message = error instanceof Error ? error.message : 'Failed to load Paddle session.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
