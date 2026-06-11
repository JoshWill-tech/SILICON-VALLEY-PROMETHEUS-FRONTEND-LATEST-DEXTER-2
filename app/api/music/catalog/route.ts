import { NextResponse } from 'next/server'

import { listMusicCatalogApi } from '@/lib/music-catalog-api'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const response = await listMusicCatalogApi({
      category: url.searchParams.get('category') ?? undefined,
      genre: url.searchParams.get('genre') ?? undefined,
      useCase: url.searchParams.get('useCase') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      limit: parseOptionalNumber(url.searchParams.get('limit')),
      offset: parseOptionalNumber(url.searchParams.get('offset')),
      includeUnsafe: parseOptionalBoolean(url.searchParams.get('includeUnsafe')),
    })

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load the music catalog.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function parseOptionalNumber(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseOptionalBoolean(value: string | null) {
  if (value === null) return undefined
  return value === 'true'
}
