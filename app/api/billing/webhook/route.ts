import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { getPaddleClient, getPaddleWebhookSecret } from '@/lib/paddle'

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

    switch (event.eventType) {
      case 'transaction.completed': {
        const transaction = event.data
        const customData = transaction.customData as Record<string, any> | undefined
        
        console.info('[paddle webhook] transaction.completed', {
          transactionId: transaction.id,
          userId: customData?.userId ?? null,
          planId: customData?.planId ?? null,
          subscriptionId: transaction.subscriptionId ?? null,
        })
        break
      }

      case 'subscription.updated':
      case 'subscription.paused':
      case 'subscription.canceled':
      case 'transaction.paid':
        console.info('[paddle webhook] event received', { type: event.eventType, eventId: event.eventId })
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[paddle webhook error]', error)
    const message = error instanceof Error ? error.message : 'Paddle webhook failed.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
