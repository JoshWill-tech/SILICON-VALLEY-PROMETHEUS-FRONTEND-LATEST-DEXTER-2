import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a'])

loadEnvLocal()

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
] as const

const missingEnv = requiredEnv.filter((key) => !process.env[key])
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`)
}

const acoustIdClientKey = getRequiredAcoustIdClientKey()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_MUSIC || process.env.R2_BUCKET_SOURCES || 'prometheus-music'
const MUSIC_PREFIX = normalizePrefix(process.env.R2_MUSIC_AUDIO_PREFIX || 'music-originals')

type R2Track = {
  id: string
  r2_key: string
}

type AcoustIdMetadata = {
  artist: string
  title: string
  album: string | null
  year: number | null
  confidence: number
}

class FatalEnrichmentError extends Error {}

async function downloadTrack(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const url = await getSignedUrl(r2 as any, command, { expiresIn: 300 })
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function generateFingerprint(buffer: Buffer): Promise<{ fingerprint: string; duration: number }> {
  const tempPath = join(tmpdir(), `track-${Date.now()}.mp3`)
  await writeFile(tempPath, buffer)

  try {
    const { stdout } = await execAsync(`fpcalc -json "${tempPath}"`, { timeout: 60000 })
    const result = JSON.parse(stdout) as { fingerprint?: string; duration?: number }
    if (!result.fingerprint || typeof result.duration !== 'number') {
      throw new Error('fpcalc did not return a valid fingerprint and duration.')
    }
    return { fingerprint: result.fingerprint, duration: result.duration }
  } finally {
    await unlink(tempPath).catch(() => undefined)
  }
}

async function queryAcoustID(fingerprint: string, duration: number): Promise<AcoustIdMetadata | null> {
  const params = new URLSearchParams({
    client: acoustIdClientKey,
    format: 'json',
    meta: 'recordings+releasegroups+compress',
    duration: String(Math.round(duration)),
    fingerprint,
  })

  const response = await fetch(`https://api.acoustid.org/v2/lookup?${params}`)
  const data = await response.json()

  if (!response.ok || data.status === 'error') {
    const message = data.error?.message || `HTTP ${response.status}`
    throw new FatalEnrichmentError(`AcoustID lookup failed: ${message}`)
  }

  if (data.status !== 'ok' || !data.results?.length) return null

  const rec = data.results[0].recordings?.[0]
  if (!rec) return null

  const releaseYear = rec.releasegroups?.[0]?.date?.split('-')?.[0]
  const parsedYear = releaseYear ? Number.parseInt(releaseYear, 10) : Number.NaN

  return {
    artist: rec.artists?.[0]?.name || 'Unknown Artist',
    title: rec.title || 'Untitled Track',
    album: rec.releasegroups?.[0]?.title || null,
    year: Number.isFinite(parsedYear) ? parsedYear : null,
    confidence: data.results[0].score || 0,
  }
}

async function enrichTrack(trackId: string, r2Key: string) {
  try {
    console.log(`[ENRICH] Starting: ${r2Key}`)

    const buffer = await downloadTrack(r2Key)
    console.log(`[ENRICH] Downloaded: ${buffer.length} bytes`)

    const { fingerprint, duration } = await generateFingerprint(buffer)
    console.log(`[ENRICH] Fingerprint: ${fingerprint.slice(0, 20)}... duration: ${duration}s`)

    const metadata = await queryAcoustID(fingerprint, duration)

    if (!metadata) {
      console.log(`[ENRICH] No AcoustID match for: ${r2Key}`)
      return { enriched: false, reason: 'No match' }
    }

    console.log(`[ENRICH] Found: ${metadata.artist} - ${metadata.title}`)

    const payload = {
      track_id: trackId,
      r2_key: r2Key,
      artist: metadata.artist,
      title: metadata.title,
      album: metadata.album,
      year: metadata.year,
      confidence: metadata.confidence,
      enriched_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('track_metadata').upsert(payload, { onConflict: 'track_id' })
    if (error) {
      const fallbackPayload = { ...payload, r2_key: undefined }
      const { error: fallbackError } = await supabase.from('track_metadata').upsert(fallbackPayload, { onConflict: 'track_id' })
      if (fallbackError) throw error
    }

    return { enriched: true, metadata }
  } catch (err) {
    if (err instanceof FatalEnrichmentError) throw err
    console.error(`[ENRICH] Failed: ${r2Key}`, err)
    return { enriched: false, error: err instanceof Error ? err.message : 'Unknown' }
  }
}

async function batchEnrich() {
  await validateAcoustIdClientKey()

  const { data: existingTracks, error: existingError } = await supabase
    .from('track_metadata')
    .select('track_id, artist')

  if (existingError) throw existingError

  const enrichedIds = new Set(
    existingTracks
      ?.filter((track) => track.artist && track.artist !== 'Unknown Artist')
      .map((track) => track.track_id) || [],
  )

  const r2Tracks = await listR2Tracks()

  let processed = 0
  let enriched = 0
  let failed = 0
  let skipped = 0

  for (const track of r2Tracks) {
    if (enrichedIds.has(track.id)) {
      console.log(`[SKIP] Already enriched: ${track.id}`)
      skipped++
      continue
    }

    const result = await enrichTrack(track.id, track.r2_key)

    if (result.enriched) enriched++
    else if (result.error) failed++

    processed++

    await new Promise((resolve) => setTimeout(resolve, 350))
  }

  console.log('\n=== BATCH COMPLETE ===')
  console.log(`Processed: ${processed}`)
  console.log(`Enriched: ${enriched}`)
  console.log(`Failed: ${failed}`)
  console.log(`Skipped (already done): ${skipped}`)
}

async function listR2Tracks(): Promise<R2Track[]> {
  const tracks: R2Track[] = []
  let continuationToken: string | undefined

  do {
    const response = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: MUSIC_PREFIX,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    )

    for (const object of response.Contents ?? []) {
      if (!object.Key || object.Key.endsWith('/')) continue
      const extension = object.Key.match(/\.[^.]+$/)?.[0]?.toLowerCase()
      if (!extension || !AUDIO_EXTENSIONS.has(extension)) continue
      tracks.push({ id: object.Key, r2_key: object.Key })
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return tracks
}

async function validateAcoustIdClientKey() {
  const params = new URLSearchParams({
    client: acoustIdClientKey,
    format: 'json',
    duration: '1',
    fingerprint: 'x',
  })

  const response = await fetch(`https://api.acoustid.org/v2/lookup?${params}`)
  const data = await response.json().catch(() => null)

  if (data?.error?.code === 4 || data?.error?.message === 'invalid API key') {
    throw new FatalEnrichmentError('AcoustID lookup failed: invalid API key')
  }
}

function normalizePrefix(prefix: string) {
  const trimmed = prefix.trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `${trimmed}/` : ''
}

function getRequiredAcoustIdClientKey() {
  const clientKey = process.env.ACOUSTID_CLIENT_KEY?.trim() || process.env.ACOUSTID_API_KEY?.trim()
  if (!clientKey) {
    throw new Error('Missing required environment variable: ACOUSTID_CLIENT_KEY or ACOUSTID_API_KEY')
  }
  return clientKey
}

function loadEnvLocal() {
  if (!existsSync('.env.local')) return

  const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

void batchEnrich().catch((err) => {
  console.error('[BATCH] Aborted:', err)
  process.exitCode = 1
})
