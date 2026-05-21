import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { normalizeNextPath } from '@/lib/auth/redirect'
import { getBillingPlanDefinition, isBillingPlanId } from '@/lib/billing-plans'
import { createClient } from '@/lib/supabase/server'
import { getPaddleClient, getPaddlePriceEnvName, getPaddlePriceId } from '@/lib/paddle'

const checkoutRequestSchema = z.object({
  planId: z.string(),
  nextPath: z.string().nullish(),
})

export async function POST(request: Request) {
  try {
    const payload = checkoutRequestSchema.parse(await request.json())

    if (!isBillingPlanId(payload.planId)) {
      return NextResponse.json({ error: 'Unknown billing plan.' }, { status: 400 })
    }

    const plan = getBillingPlanDefinition(payload.planId)

    if (plan.contactOnly) {
      return NextResponse.json({ error: `${plan.name} is still handled through sales.` }, { status: 400 })
    }

    const priceId = getPaddlePriceId(payload.planId)

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Paddle is not fully configured yet. Add ${getPaddlePriceEnvName(payload.planId)} to .env.local.`,
        },
        { status: 400 },
      )
    }

    // Paddle Price IDs usually start with 'pri_'
    if (!priceId.startsWith('pri_')) {
      return NextResponse.json(
        {
          error: `${getPaddlePriceEnvName(payload.planId)} must be a Paddle Price ID that starts with pri_.`,
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user?.id || !user.email) {
      return NextResponse.json({ error: 'Please sign in before starting checkout.' }, { status: 401 })
    }

    const nextPath = normalizeNextPath(payload.nextPath, '/')
    const paddle = getPaddleClient()

    // Create a transaction to be used with the Paddle.js overlay
    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
      ],
      customData: {
        planId: payload.planId,
        userId: user.id,
        nextPath,
      },
    })

    if (!transaction.id) {
      throw new Error('Paddle did not return a transaction ID.')
    }

    return NextResponse.json({ 
      transactionId: transaction.id,
      customerEmail: user.email,
    })
  } catch (error) {
    console.error('[paddle checkout error]', error)
    const message = error instanceof Error ? error.message : 'Failed to start Paddle checkout.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
