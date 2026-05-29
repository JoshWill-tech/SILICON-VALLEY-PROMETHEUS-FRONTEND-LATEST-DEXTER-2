export interface TrackMetadata {
  artist: string
  title: string
  album: string | null
  year: number | null
  isrc: string | null
  confidence: number
}

type AcoustIdLookupResponse = {
  status?: string
  results?: Array<{
    score?: number
    recordings?: Array<{
      title?: string
      artists?: Array<{ name?: string }>
      releasegroups?: Array<{ title?: string; date?: string }>
      isrcs?: string[]
    }>
  }>
}

const ACOUSTID_MIN_REQUEST_INTERVAL_MS = 350

let acoustIdQueue = Promise.resolve()
let lastAcoustIdRequestAt = 0

async function waitForAcoustIdSlot() {
  const next = acoustIdQueue.then(async () => {
    const elapsed = Date.now() - lastAcoustIdRequestAt
    const waitMs = Math.max(0, ACOUSTID_MIN_REQUEST_INTERVAL_MS - elapsed)
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
    lastAcoustIdRequestAt = Date.now()
  })

  acoustIdQueue = next.catch(() => undefined)
  await next
}

export async function enrichTrackMetadata(fingerprint: string, duration: number): Promise<TrackMetadata | null> {
  const client = process.env.ACOUSTID_CLIENT_KEY?.trim() || process.env.ACOUSTID_API_KEY?.trim()
  if (!client) {
    console.error('[ACOUSTID] Missing ACOUSTID_CLIENT_KEY or ACOUSTID_API_KEY')
    return null
  }

  const params = new URLSearchParams({
    client,
    format: 'json',
    meta: 'recordings+releasegroups+compress',
    duration: String(Math.round(duration)),
    fingerprint,
  })

  try {
    await waitForAcoustIdSlot()

    const res = await fetch(`https://api.acoustid.org/v2/lookup?${params}`, { cache: 'no-store' })
    if (!res.ok) {
      console.error('[ACOUSTID] HTTP', res.status)
      return null
    }

    const data = (await res.json()) as AcoustIdLookupResponse
    if (data.status !== 'ok' || !data.results?.length) return null

    const result = data.results[0]
    const rec = result.recordings?.[0]
    if (!rec) return null

    const releaseGroup = rec.releasegroups?.[0]
    const releaseYear = releaseGroup?.date?.split('-')?.[0]
    const parsedYear = releaseYear ? Number.parseInt(releaseYear, 10) : Number.NaN

    return {
      artist: rec.artists?.[0]?.name || 'Unknown Artist',
      title: rec.title || 'Untitled Track',
      album: releaseGroup?.title || null,
      year: Number.isFinite(parsedYear) ? parsedYear : null,
      isrc: rec.isrcs?.[0] || null,
      confidence: result.score || 0,
    }
  } catch (err) {
    console.error('[ACOUSTID]', err)
    return null
  }
}
