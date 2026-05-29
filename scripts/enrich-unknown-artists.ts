import { createClient } from '@supabase/supabase-js'

import { enrichTrackMetadata } from '../lib/music/acoustid-client'
import { generateFingerprint } from '../lib/music/fingerprint'

type TrackMetadataRow = {
  track_id: string
  artist: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase service role configuration.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function batchEnrich() {
  const { data: tracks, error } = await supabase
    .from('track_metadata')
    .select('track_id, artist')
    .or('artist.eq.Unknown Artist,artist.is.null')
    .limit(100)

  if (error) throw error
  if (!tracks?.length) {
    console.log('No tracks to enrich')
    return
  }

  for (const track of tracks as TrackMetadataRow[]) {
    try {
      console.log(`Enriching: ${track.track_id}`)
      await enrichTrack(track)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (err) {
      console.error(`Failed: ${track.track_id}`, err)
    }
  }
}

async function enrichTrack(track: TrackMetadataRow) {
  const audioBuffer = await downloadR2Track(track.track_id)
  if (!audioBuffer) {
    console.warn(`Skipping ${track.track_id}: R2 download adapter not configured.`)
    return
  }

  const { fingerprint, duration } = await generateFingerprint(audioBuffer)
  const metadata = await enrichTrackMetadata(fingerprint, duration)
  if (!metadata) return

  const { error } = await supabase.from('track_metadata').upsert(
    {
      track_id: track.track_id,
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
}

async function downloadR2Track(_trackId: string): Promise<ArrayBuffer | null> {
  return null
}

void batchEnrich()
