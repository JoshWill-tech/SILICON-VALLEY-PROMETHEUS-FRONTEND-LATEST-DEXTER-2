import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function PATCH(
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

    await supabase
      .from('dodo_payment_methods')
      .update({ is_default: false })
      .eq('user_id', user.id)

    const { error } = await supabase
      .from('dodo_payment_methods')
      .update({ is_default: true })
      .eq('user_id', user.id)
      .eq('dodo_payment_method_id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[dodo payment methods default error]', error)
    return NextResponse.json({ error: 'Failed to set default payment method.' }, { status: 400 })
  }
}
