import { NextResponse } from 'next/server'
import { z } from 'zod'

import { normalizeNextPath } from '@/lib/auth/redirect'
import { getDodoClient } from '@/lib/dodo/client'
import { getDodoPlanConfig } from '@/lib/dodo/plans'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const checkoutRequestSchema = z.object({
  product_id: z.string().trim().optional(),
  tier: z.enum(['creator', 'studio', 'cinema']),
  save_payment_method: z.boolean().default(true),
  nextPath: z.string().nullish(),
})

export async function POST(request: Request) {
  try {
    const payload = checkoutRequestSchema.parse(await request.json())
    const planConfig = getDodoPlanConfig(payload.tier)

    console.log('[dodo checkout] tier:', payload.tier)
    console.log('[dodo checkout] env creator:', process.env.DODO_PRODUCT_CREATOR ?? process.env.NEXT_PUBLIC_DODO_PRODUCT_CREATOR ?? null)
    console.log('[dodo checkout] env studio:', process.env.DODO_PRODUCT_STUDIO ?? process.env.NEXT_PUBLIC_DODO_PRODUCT_STUDIO ?? null)
    console.log('[dodo checkout] env cinema:', process.env.DODO_PRODUCT_CINEMA ?? process.env.NEXT_PUBLIC_DODO_PRODUCT_CINEMA ?? null)

    if (!planConfig.productId) {
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
          product_id: planConfig.productId,
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
