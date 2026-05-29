import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { enrichTrackMetadata, type TrackMetadata } from '@/lib/music/acoustid-client'
import { generateFingerprint } from '@/lib/music/fingerprint'

export const runtime = 'nodejs'

type EnrichRequest = {
  trackId?: unknown
  audioBuffer?: unknown
}

type CachedTrackMetadata = {
  artist: string | null
  title: string | null
  album: string | null
  year: number | null
  isrc: string | null
  confidence: number | null
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdminClient()
    const body = (await request.json().catch(() => null)) as EnrichRequest | null
    const trackId = typeof body?.trackId === 'string' ? body.trackId.trim() : ''
    const audioBuffer = decodeAudioBuffer(body?.audioBuffer)

    if (!trackId || !audioBuffer) {
      return NextResponse.json({ error: 'Missing trackId or audioBuffer' }, { status: 400 })
    }

    const cached = await getCachedMetadata(supabase, trackId)
    if (cached && cached.artist && cached.artist !== 'Unknown Artist') {
      return NextResponse.json({ enriched: true, cached: true, metadata: normalizeCachedMetadata(cached) })
    }

    const { fingerprint, duration } = await generateFingerprint(audioBuffer)
    const metadata = await enrichTrackMetadata(fingerprint, duration)
    if (!metadata) {
      return NextResponse.json({ enriched: false, reason: 'No AcoustID match' }, { status: 404 })
    }

    const { error } = await supabase.from('track_metadata').upsert(
      {
        track_id: trackId,
        artist: metadata.artist,
        title: metadata.title,
        album: metadata.album,
        year: metadata.year,
        isrc: metadata.isrc,
        confidence: metadata.confidence,
        enriched_at: new Date().toISOString(),
      },
      { onConflict: 'track_id' },
    )

    if (error) throw error
    return NextResponse.json({ enriched: true, cached: false, metadata })
  } catch (err) {
    console.error('[ENRICH_API]', err)
    return NextResponse.json({ enriched: false, error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}

function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration for music enrichment.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function getCachedMetadata(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  trackId: string,
): Promise<CachedTrackMetadata | null> {
  const { data, error } = await supabase
    .from('track_metadata')
    .select('artist, title, album, year, isrc, confidence')
    .eq('track_id', trackId)
    .maybeSingle()

  if (error) throw error
  return data as CachedTrackMetadata | null
}

function normalizeCachedMetadata(metadata: CachedTrackMetadata): TrackMetadata {
  return {
    artist: metadata.artist || 'Unknown Artist',
    title: metadata.title || 'Untitled Track',
    album: metadata.album,
    year: metadata.year,
    isrc: metadata.isrc,
    confidence: metadata.confidence || 0,
  }
}

function decodeAudioBuffer(value: unknown): ArrayBuffer | null {
  if (typeof value === 'string' && value.trim()) {
    const buffer = Buffer.from(value, 'base64')
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(value).buffer
  }

  return null
}
