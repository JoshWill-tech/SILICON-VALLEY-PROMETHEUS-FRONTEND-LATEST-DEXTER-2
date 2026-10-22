import { NextResponse } from 'next/server'
import { resolveBrand } from '@/lib/brand/resolve'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { query?: unknown }
    const rawQuery = typeof body.query === 'string' ? body.query.trim() : ''

    if (!rawQuery) {
      return NextResponse.json({ error: 'A brand query, URL, or handle is required.' }, { status: 400 })
    }

    if (rawQuery.length > 2000) {
      return NextResponse.json({ error: 'Query is too long.' }, { status: 413 })
    }

    const brand = await resolveBrand(rawQuery)
    return NextResponse.json({ brand }, { status: 200 })
  } catch (error) {
    console.error('[api/brand/resolve] Failed to resolve brand:', error)
    return NextResponse.json(
      { error: 'Could not resolve brand details. Please try again.' },
      { status: 500 }
    )
  }
}
