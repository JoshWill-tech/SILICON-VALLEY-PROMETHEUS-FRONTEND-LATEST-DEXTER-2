import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Legacy Paddle billing route is deprecated. Use /api/dodo/subscription.' },
    { status: 410 },
  )
}
