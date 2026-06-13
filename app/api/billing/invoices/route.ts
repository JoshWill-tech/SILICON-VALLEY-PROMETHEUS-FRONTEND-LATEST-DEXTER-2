import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Legacy Paddle billing route is deprecated. Use /api/dodo/invoices.' },
    { status: 410 },
  )
}
