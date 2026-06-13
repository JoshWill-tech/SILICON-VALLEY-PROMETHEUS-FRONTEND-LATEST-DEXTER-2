import { NextResponse } from 'next/server'

import { getDodoClient } from '@/lib/dodo/client'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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
      return NextResponse.json({ error: 'No Dodo customer found.' }, { status: 404 })
    }

    const dodo = getDodoClient()
    await dodo.customers.deletePaymentMethod(id, {
      customer_id: subscription.dodo_customer_id,
    })

    await supabase
      .from('dodo_payment_methods')
      .delete()
      .eq('user_id', user.id)
      .eq('dodo_payment_method_id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[dodo payment methods delete error]', error)
    const message = error instanceof Error ? error.message : 'Failed to remove payment method.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
