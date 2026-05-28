import { NextResponse } from 'next/server'

import { getMusicCatalogApiTrack, joinTrackIdParam } from '@/lib/music-catalog-api'

export const runtime = 'nodejs'

export async function GET(_req: Request, contextValue: { params: Promise<{ trackId?: string[] }> }) {
  try {
    const params = await contextValue.params
    const trackId = joinTrackIdParam(params.trackId)

    if (!trackId) {
      return NextResponse.json({ error: 'Missing trackId.' }, { status: 400 })
    }

    const track = await getMusicCatalogApiTrack(trackId)
    if (!track) {
      return NextResponse.json({ error: 'Track not found.' }, { status: 404 })
    }

    return NextResponse.json(track)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load the music track.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
