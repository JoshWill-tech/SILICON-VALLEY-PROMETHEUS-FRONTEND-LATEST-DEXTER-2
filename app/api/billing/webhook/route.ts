import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const signature = (await headers()).get('paddle-signature')
  void request
  void signature

  return NextResponse.json(
    { error: 'Legacy Paddle webhook route is deprecated. Use /api/dodo/webhooks.' },
    { status: 410 },
  )
}
