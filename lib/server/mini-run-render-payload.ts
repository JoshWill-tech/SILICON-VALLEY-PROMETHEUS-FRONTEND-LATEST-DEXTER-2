import type { MiniRunShotSpec } from '@/lib/api/mini-run-console'

export const MINI_RUN_DEFAULT_DURATION_MS = 30_000
export const MINI_RUN_MIN_DURATION_MS = 5_000
export const MINI_RUN_MAX_DURATION_MS = 180_000

type SourceMetadata = {
  durationMs?: number
  width?: number
  height?: number
}

type BuildMiniRunRenderPayloadInput = {
  sourceUrl: string
  source: SourceMetadata
  shot: Partial<MiniRunShotSpec>
  jobId: string
  draftManifest?: Record<string, unknown>
  transcriptSegments?: unknown[]
  words?: unknown[]
  prompt?: string
  quality?: string
  format?: string
  safeMode?: boolean
  textLayers?: unknown[]
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Creates the raw cloud intake contract. User preferences become prompt
 * directives; cloud execution owns the editorial plan and fresh transcript.
 */
export function buildMiniRunRenderPayload({
  sourceUrl, source, shot, prompt, quality, format, safeMode,
}: BuildMiniRunRenderPayloadInput): Record<string, unknown> {
  const sourceDurationMs = isFiniteNumber(source.durationMs) && source.durationMs > 0
    ? Math.round(source.durationMs)
    : null
  const requestedStartMs = isFiniteNumber(shot.sourceStartMs) ? Math.round(shot.sourceStartMs) : 0
  const maximumStartMs = sourceDurationMs ? Math.max(0, sourceDurationMs - 1_000) : Number.MAX_SAFE_INTEGER
  const sourceStartMs = clamp(requestedStartMs, 0, maximumStartMs)
  const preferredDurationMs = isFiniteNumber(shot.preferredDurationSec) && shot.preferredDurationSec > 0
    ? Math.round(shot.preferredDurationSec * 1_000)
    : null
  const explicitDurationMs = isFiniteNumber(shot.sourceEndMs)
    ? Math.max(1_000, Math.round(shot.sourceEndMs) - sourceStartMs)
    : null
  const requestedDurationMs = clamp(
    preferredDurationMs ?? explicitDurationMs ?? MINI_RUN_DEFAULT_DURATION_MS,
    MINI_RUN_MIN_DURATION_MS,
    MINI_RUN_MAX_DURATION_MS,
  )
  const sourceEndMs = Math.min(
    sourceStartMs + requestedDurationMs,
    sourceDurationMs ?? Number.MAX_SAFE_INTEGER,
  )


  // Raw cloud intake owns transcription, planning, assets and caption geometry.
  // Only human creative intent crosses this boundary; preview manifests stay local.
  const directives = [
    prompt?.trim() || 'Create a polished editorial mini-run from the raw source.',
    `Use source window from ${sourceStartMs} ms through ${sourceEndMs} ms.`,
    'Create a portrait 9:16 output.',
  ]
  const preference = (label: string, value: unknown) => {
    if (typeof value === 'string' && value.trim()) directives.push(`${label}: ${value.trim()}.`)
    else if (typeof value === 'number' && Number.isFinite(value)) directives.push(`${label}: ${value}.`)
    else if (typeof value === 'boolean') directives.push(`${label}: ${value}.`)
  }
  preference('B-roll preference', shot.brollPreference)
  preference('Motion graphics preference', shot.motionGraphicsPreference)
  preference('Music policy', shot.songPolicy)
  preference('Music track ID', shot.songTrackId || shot.trackId || shot.songId)
  preference('Music title', shot.songTitle || shot.songName)
  preference('Music artist', shot.songArtist || shot.artist)
  preference('Music genre', shot.songGenre || shot.songCategory)
  preference('Music mood', shot.songMood || shot.mood)
  preference('Music intensity', shot.songIntensity)
  preference('Music source URL', shot.songUrl || shot.songSource)
  preference('Caption words per phrase preference', shot.targetChunkWords)
  preference('Maximum caption words per phrase preference', shot.maxChunkWords)
  preference('Export quality preference', quality || (shot as any).quality || (shot as any).exportQuality)
  preference('Export format preference', format || (shot as any).format || (shot as any).exportFormat)
  preference('Safe mode preference', safeMode ?? (shot as any).safeMode)
  if (shot.brandPreferences && typeof shot.brandPreferences === 'object') {
    directives.push(`Brand preferences: ${JSON.stringify(shot.brandPreferences)}.`)
  }
  for (const key of ['musicVolume', 'sfxVolume', 'voiceVolume', 'duckingEnabled']) {
    preference(`Audio ${key} preference`, shot.audio?.[key])
  }
  return {source: sourceUrl, prompt: directives.join('\n')}
}

/**
 * Transforms an analytical draft manifest into the PrometheusMinRun props contract
 * for distributed rendering on AWS Remotion Lambda.
 */
export function buildPrometheusMinRunProps(manifest: Record<string, unknown>): Record<string, unknown> {
  const chunks = (manifest.chunks as unknown[]) || []
  const timeline = (manifest.timeline as Record<string, unknown>) || {}
  const durationMs = Number(manifest.effectiveDurationMs || timeline.outputDurationMs || 30000)
  const orchestration = (manifest.orchestrationManifest || manifest.orchestration) as Record<string, unknown> | undefined
  const songProgram = (manifest.songProgram as Record<string, unknown>) || undefined
  const firstEvent = (songProgram?.events as Array<Record<string, unknown>>)?.[0]
  const soundtrackSrc = (firstEvent?.localPath || firstEvent?.audioPath || firstEvent?.audioUrl) as string | undefined

  return {
    videoSrc: (manifest.sourcePath || 'source/source.mp4') as string,
    chunks,
    durationMs,
    orchestration,
    soundtrackSrc,
    audioTrackSrc: (manifest.audioPath || undefined) as string | undefined,
    profile: ((chunks[0] as any)?.profile || undefined),
  }
}
