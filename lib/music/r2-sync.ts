export interface R2Track {
  id: string
  title: string
  artist: string
  genre: string
  duration: number
  url: string
  coverUrl?: string | null
  thumbnail?: string | null
}

type R2TrackCandidate = Partial<R2Track> & {
  coverArtUrl?: string | null
  creator?: string | null
  durationMs?: number | string | null
  durationSec?: number | string | null
  key?: string | null
  length?: number | string | null
  metadata?: {
    duration?: number | string | null
    durationMs?: number | string | null
    durationSec?: number | string | null
    timeSpan?: string | null
  } | null
  name?: string | null
  sourceUrl?: string | null
  thumbnailUrl?: string | null
  timeSpan?: string | null
}

type MusicLibraryR2Response = {
  tracks?: R2TrackCandidate[]
  error?: string
}

export async function fetchR2Tracks(): Promise<R2Track[]> {
  const response = await fetch('/api/music/library?source=r2', {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch R2 tracks')
  }

  const payload = (await response.json()) as MusicLibraryR2Response | R2TrackCandidate[]
  if (Array.isArray(payload)) return payload.map(normalizeR2Track)
  if (payload.error) throw new Error(payload.error)
  return (payload.tracks ?? []).map(normalizeR2Track)
}

export function normalizeR2Track(track: R2TrackCandidate): R2Track {
  const coverUrl = track.coverUrl ?? track.coverArtUrl ?? track.thumbnail ?? track.thumbnailUrl ?? null
  const title = track.title ?? track.name ?? 'Untitled'

  return {
    id: track.id ?? track.key ?? title,
    title,
    artist: track.artist ?? track.creator ?? 'Unknown Artist',
    genre: track.genre ?? 'Unknown',
    duration: normalizeDurationSeconds(track),
    url: track.url ?? track.sourceUrl ?? '',
    coverUrl,
    thumbnail: coverUrl,
  }
}

function normalizeDurationSeconds(track: R2TrackCandidate) {
  const durationCandidates = [
    track.durationSec,
    track.metadata?.durationSec,
    track.duration,
    track.metadata?.duration,
    track.durationMs,
    track.metadata?.durationMs,
    track.timeSpan,
    track.metadata?.timeSpan,
  ]

  for (const candidate of durationCandidates) {
    const duration = parseDurationCandidate(candidate)
    if (duration > 0) return Math.round(duration)
  }

  return 0
}

function parseDurationCandidate(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return 0
    return value > 1000 ? value / 1000 : value
  }

  if (typeof value !== 'string') return 0
  const trimmed = value.trim()
  if (!trimmed) return 0

  if (/^\d+:\d{1,2}(?::\d{1,2})?$/.test(trimmed)) {
    const parts = trimmed.split(':').map(Number)
    if (parts.some((part) => !Number.isFinite(part))) return 0
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return parts[0] * 60 + parts[1]
  }

  const numeric = Number(trimmed)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return numeric > 1000 ? numeric / 1000 : numeric
}
