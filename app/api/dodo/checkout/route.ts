import { NextResponse } from 'next/server'
import { z } from 'zod'

import { normalizeNextPath } from '@/lib/auth/redirect'
import { getDodoClient } from '@/lib/dodo/client'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const checkoutRequestSchema = z.object({
  product_id: z.string().trim().optional(),
  tier: z.enum(['creator', 'studio', 'cinema']),
  save_payment_method: z.boolean().default(true),
  nextPath: z.string().nullish(),
})

const DODO_PRODUCTS: Record<string, string> = {
  creator: 'pdt_0NgxO87owRAyowKhB6scP',
  studio: 'pdt_0NgxOqKzDAbOElM0wkGYG',
  cinema: 'pdt_0NgxPG9bpsHGbHALTbMQw',
}

export async function POST(request: Request) {
  try {
    const payload = checkoutRequestSchema.parse(await request.json())
    const normalizedTier = payload.tier?.toLowerCase?.() || payload.tier
    const productId = DODO_PRODUCTS[normalizedTier]

    console.log('[dodo checkout] received tier:', payload.tier)
    console.log('[dodo checkout] normalized tier:', normalizedTier)
    console.log('[dodo checkout] resolved productId:', productId)

    if (!productId) {
      return NextResponse.json(
        { error: `Dodo product is not configured for tier: ${payload.tier}` },
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
    const dodo = getDodoClient()
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0] || 'Prometheus User',
      },
      metadata: {
        userId: user.id,
        tier: payload.tier,
        nextPath,
      },
      return_url: `${new URL('/settings/billing/success', request.url).toString()}?next=${encodeURIComponent(nextPath)}`,
      confirm: false,
      show_saved_payment_methods: payload.save_payment_method,
      customization: {
        theme: 'dark',
        force_language: 'en',
      },
      feature_flags: {
        redirect_immediately: false,
      },
    })

    return NextResponse.json({
      session_id: session.session_id,
      checkout_url: session.checkout_url ?? null,
      client_secret: session.client_secret ?? null,
      publishable_key: session.publishable_key ?? null,
    })
  } catch (error) {
    console.error('[dodo checkout error]', error)
    const message = error instanceof Error ? error.message : 'Failed to start Dodo checkout.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
