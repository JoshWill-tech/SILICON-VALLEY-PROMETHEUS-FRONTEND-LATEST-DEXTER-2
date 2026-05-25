import { NextResponse } from 'next/server'
import { getPaddleClient } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('paddle_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!subscription?.paddle_customer_id) {
      return NextResponse.json([])
    }

    const paddle = getPaddleClient()
    
    // Fetch transactions for this customer
    const transactions = paddle.transactions.list({
      customerId: [subscription.paddle_customer_id],
      status: ['completed'],
    })

    const invoices = []
    for await (const transaction of transactions) {
      invoices.push({
        id: transaction.id,
        status: transaction.status,
        amount: (parseFloat(transaction.details.totals.total) / 100).toFixed(2),
        currency: transaction.currencyCode,
        date: transaction.createdAt,
        receiptUrl: transaction.checkout?.url || null, // Paddle doesn't have a direct receipt PDF link in the SDK easily available, but checkout URL often works or we can use another method
      })
    }

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('[invoices error]', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
