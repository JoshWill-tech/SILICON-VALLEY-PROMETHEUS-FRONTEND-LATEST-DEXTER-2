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
 * Creates the only payload accepted by the Mini-Runs dispatch route. The
 * source can be arbitrarily long, but a Mini-Run is always a Maul 9:16
 * deliverable with a user-selected short-form source window.
 */
export function buildMiniRunRenderPayload({
  sourceUrl,
  source,
  shot,
  jobId,
  draftManifest,
  transcriptSegments,
  words,
  prompt,
  quality,
  format,
  safeMode,
  textLayers,
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
  const durationMs = Math.max(1_000, sourceEndMs - sourceStartMs)

  const targetChunkWords = isFiniteNumber(shot.targetChunkWords)
    ? clamp(Math.round(shot.targetChunkWords), 1, 15)
    : 3
  const maxChunkWords = isFiniteNumber(shot.maxChunkWords)
    ? clamp(Math.round(shot.maxChunkWords), targetChunkWords, 30)
    : Math.max(targetChunkWords, 5)

  const resolvedQuality = quality || (shot as any)?.quality || (shot as any)?.exportQuality
  const resolvedFormat = format || (shot as any)?.format || (shot as any)?.exportFormat
  const resolvedSafeMode = typeof safeMode === 'boolean' ? safeMode : (shot as any)?.safeMode
  const resolvedTextLayers = Array.isArray(textLayers) ? textLayers : (shot as any)?.textLayers

  return {
    source: { url: sourceUrl },
    ...(resolvedQuality ? { quality: resolvedQuality, exportQuality: resolvedQuality } : {}),
    ...(resolvedFormat ? { format: resolvedFormat, exportFormat: resolvedFormat } : {}),
    ...(typeof resolvedSafeMode === 'boolean' ? { safeMode: resolvedSafeMode } : {}),
    ...(Array.isArray(resolvedTextLayers) && resolvedTextLayers.length > 0 ? { textLayers: resolvedTextLayers } : {}),
    metadata: {
      pipeline: 'maul',
      durationSec: durationMs / 1_000,
      durationMs,
      width: source.width,
      height: source.height,
      ...(resolvedQuality ? { quality: resolvedQuality, exportQuality: resolvedQuality } : {}),
      ...(resolvedFormat ? { format: resolvedFormat, exportFormat: resolvedFormat } : {}),
      ...(typeof resolvedSafeMode === 'boolean' ? { safeMode: resolvedSafeMode } : {}),
      ...(Array.isArray(resolvedTextLayers) && resolvedTextLayers.length > 0 ? { textLayers: resolvedTextLayers } : {}),
    },
    design: {
      ...(resolvedQuality ? { quality: resolvedQuality, exportQuality: resolvedQuality } : {}),
      ...(resolvedFormat ? { format: resolvedFormat, exportFormat: resolvedFormat } : {}),
      ...(typeof resolvedSafeMode === 'boolean' ? { safeMode: resolvedSafeMode } : {}),
      canvasWidth: 1080,
      canvasHeight: 1920,
      ...(shot.brollPreference ? { brollPreference: shot.brollPreference, preferredKind: shot.brollPreference } : {}),
      ...(shot.motionGraphicsPreference ? { motionGraphicsPreference: shot.motionGraphicsPreference } : {}),
      ...(shot.brandPreferences ? { brandPreferences: shot.brandPreferences } : {}),
      ...(shot.songTrackId ? { songTrackId: shot.songTrackId, trackId: shot.songTrackId } : {}),
      ...(shot.trackId ? { trackId: shot.trackId, songTrackId: shot.trackId } : {}),
      ...(shot.songId ? { songId: shot.songId, songTrackId: shot.songId } : {}),
      ...(shot.songTitle ? { songTitle: shot.songTitle, songName: shot.songTitle } : {}),
      ...(shot.songName ? { songName: shot.songName, songTitle: shot.songName } : {}),
      ...(shot.songArtist ? { songArtist: shot.songArtist, artist: shot.songArtist } : {}),
      ...(shot.artist ? { artist: shot.artist, songArtist: shot.artist } : {}),
      ...(shot.songGenre ? { songGenre: shot.songGenre, songCategory: shot.songGenre } : {}),
      ...(shot.songCategory ? { songCategory: shot.songCategory, songGenre: shot.songCategory } : {}),
      ...(shot.songMood ? { songMood: shot.songMood, mood: shot.songMood } : {}),
      ...(shot.mood ? { mood: shot.mood, songMood: shot.mood } : {}),
      ...(shot.songIntensity ? { songIntensity: shot.songIntensity, songEnergy: shot.songIntensity } : {}),
      ...(shot.songUrl ? { songUrl: shot.songUrl, songSource: shot.songUrl } : {}),
      ...(shot.songSource ? { songSource: shot.songSource, songUrl: shot.songSource } : {}),
    },
    selectedWindow: {
      sourceStartMs,
      sourceEndMs,
    },
    targetChunkWords,
    maxChunkWords,
    audio: {
      ...(shot.audio && typeof shot.audio === 'object' ? shot.audio : {}),
      ...(shot.songPolicy ? { songPolicy: shot.songPolicy } : {}),
      ...(shot.songTrackId ? { songTrackId: shot.songTrackId, trackId: shot.songTrackId } : {}),
      ...(shot.trackId ? { trackId: shot.trackId, songTrackId: shot.trackId } : {}),
      ...(shot.songId ? { songId: shot.songId, songTrackId: shot.songId } : {}),
      ...(shot.songTitle ? { songTitle: shot.songTitle, songName: shot.songTitle } : {}),
      ...(shot.songName ? { songName: shot.songName, songTitle: shot.songName } : {}),
      ...(shot.songArtist ? { songArtist: shot.songArtist, artist: shot.songArtist } : {}),
      ...(shot.artist ? { artist: shot.artist, songArtist: shot.artist } : {}),
      ...(shot.songGenre ? { songGenre: shot.songGenre, songCategory: shot.songGenre } : {}),
      ...(shot.songCategory ? { songCategory: shot.songCategory, songGenre: shot.songCategory } : {}),
      ...(shot.songMood ? { songMood: shot.songMood, mood: shot.songMood } : {}),
      ...(shot.mood ? { mood: shot.mood, songMood: shot.mood } : {}),
      ...(shot.songIntensity ? { songIntensity: shot.songIntensity, songEnergy: shot.songIntensity } : {}),
      ...(shot.songUrl ? { songUrl: shot.songUrl, songSource: shot.songUrl } : {}),
      ...(shot.songSource ? { songSource: shot.songSource, songUrl: shot.songSource } : {}),
      ...(prompt?.trim() ? { prompt: prompt.trim(), userPrompt: prompt.trim() } : {}),
    },
    ...(prompt?.trim() ? { prompt: prompt.trim(), userPrompt: prompt.trim() } : {}),
    ...(draftManifest ? { draftManifest } : {}),
    ...(Array.isArray(transcriptSegments) && transcriptSegments.length > 0 ? { transcriptSegments } : {}),
    ...(Array.isArray(words) && words.length > 0 ? { words } : {}),
    jobId,
  }
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
