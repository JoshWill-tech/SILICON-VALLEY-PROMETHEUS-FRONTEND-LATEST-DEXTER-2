import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { getPaddleClient, getPaddleWebhookSecret } from '@/lib/paddle'

// Use service role for database updates in webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const signature = (await headers()).get('paddle-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing Paddle signature.' }, { status: 400 })
    }

    const paddle = getPaddleClient()
    const payload = await request.text()
    
    // Verify and unmarshal the event
    const event = await paddle.webhooks.unmarshal(payload, getPaddleWebhookSecret(), signature)

    if (!event) {
      return NextResponse.json({ error: 'Invalid Paddle signature.' }, { status: 400 })
    }

    console.info('[paddle webhook] event received', { type: event.eventType, eventId: event.eventId })

    switch (event.eventType) {
      case 'transaction.completed': {
        const transaction = event.data
        const customData = transaction.customData as Record<string, any> | undefined
        const userId = customData?.userId
        const planId = customData?.planId
        const subscriptionId = transaction.subscriptionId

        if (userId && planId && subscriptionId) {
          // Fetch subscription details to get card info and next billing date
          const subscription = await paddle.subscriptions.get(subscriptionId)
          
          const nextBillingDate = subscription.nextBillingAt
          const paymentMethod = subscription.payments[0]?.methodDetails
          
          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            status: subscription.status,
            plan_id: planId,
            paddle_subscription_id: subscriptionId,
            paddle_customer_id: transaction.customerId,
            price_id: subscription.items[0]?.priceId,
            next_billing_date: nextBillingDate,
            card_brand: paymentMethod?.card?.type,
            card_last_4: paymentMethod?.card?.last4,
            card_expiry_month: paymentMethod?.card?.expiryMonth,
            card_expiry_year: paymentMethod?.card?.expiryYear,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'paddle_subscription_id' })
        }
        break
      }

      case 'subscription.updated':
      case 'subscription.paused':
      case 'subscription.activated':
      case 'subscription.canceled': {
        const subscription = event.data
        const customData = subscription.customData as Record<string, any> | undefined
        const userId = customData?.userId
        const planId = customData?.planId

        if (userId && planId) {
          const paymentMethod = subscription.payments[0]?.methodDetails

          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            status: subscription.status,
            plan_id: planId,
            paddle_subscription_id: subscription.id,
            paddle_customer_id: subscription.customerId,
            price_id: subscription.items[0]?.priceId,
            next_billing_date: subscription.nextBillingAt,
            card_brand: paymentMethod?.card?.type,
            card_last_4: paymentMethod?.card?.last4,
            card_expiry_month: paymentMethod?.card?.expiryMonth,
            card_expiry_year: paymentMethod?.card?.expiryYear,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'paddle_subscription_id' })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[paddle webhook error]', error)
    const message = error instanceof Error ? error.message : 'Paddle webhook failed.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
