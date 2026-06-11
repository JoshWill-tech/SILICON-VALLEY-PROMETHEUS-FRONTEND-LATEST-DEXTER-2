import { GoogleGenerativeAI } from '@google/generative-ai'
import { existsSync, readFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const GEMINI_MODEL = 'gemini-flash-latest'
const YOUTUBE_PAYLOAD_PATH = join(process.cwd(), 'youtube_payload.json')
const REDDIT_PAYLOAD_PATH = join(process.cwd(), 'reddit_payload.json')
const KNOWLEDGE_BASE_PATH = join(process.cwd(), 'knowledge-base.json')
const FINE_TUNING_DATASET_PATH = join(process.cwd(), 'fine-tuning-dataset.jsonl')
const SYSTEM_PROMPT = 'You are a world-class video editor. Give concrete, professional, actionable editing guidance.'
const GEMINI_DELAY_MS = 1000
const RAW_SOURCE_SNIPPET_CHARS = 500
const MAX_YOUTUBE_CONTENT_CHARS = 28000
const MAX_REDDIT_CONTENT_CHARS = 12000
const FALLBACK_TRANSCRIPT_MIN_CHARS = 500
const FALLBACK_TRANSCRIPT_TARGET_CHARS = 850
const FALLBACK_TRANSCRIPT_MAX_CHARS = 1000
const FALLBACK_TRANSCRIPT_OVERLAP_CHARS = 175
const FALLBACK_REDDIT_MIN_CHARS = 120
const FALLBACK_REDDIT_TARGET_CHARS = 850
const FALLBACK_REDDIT_MAX_CHARS = 1000

type YouTubePayloadItem = {
  video_id: string
  source: 'youtube'
  content_type: 'transcript'
  content: string
}

type RedditPayloadItem = {
  id: string
  subreddit: string
  title: string
  body: string
  score: number
  url: string
  source: 'reddit'
  content_type: 'forum_post'
}

type ExtractedType = 'technique' | 'workflow' | 'motion_beat' | 'qa'
type KnowledgeChunkType = ExtractedType | 'transcript_segment'

type GeminiChunk = {
  topic: string
  content: string
  tags: string[]
  type: ExtractedType
}

type KnowledgeChunkPayload = Omit<GeminiChunk, 'type'> & {
  type: KnowledgeChunkType
}

export type KnowledgeChunk = KnowledgeChunkPayload & {
  id: string
  source: 'youtube' | 'reddit'
  source_url: string
  raw_source: string
  embedding: null
  source_ref: {
    video_id?: string
    reddit_id?: string
    subreddit?: string
    score?: number
  }
}

type FineTuningExample = {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const isKnowledgeCandidate = (chunk: GeminiChunk | null): chunk is GeminiChunk => chunk !== null

loadEnvLocal()

async function main() {
  const youtubePayload = await readJsonArray<YouTubePayloadItem>(YOUTUBE_PAYLOAD_PATH)
  const redditPayload = await readJsonArray<RedditPayloadItem>(REDDIT_PAYLOAD_PATH)
  const genAI = new GoogleGenerativeAI(getGeminiApiKey())
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  const chunks: KnowledgeChunk[] = []
  let quotaReached = false

  for (const item of youtubePayload) {
    if (!isUsableYoutubeItem(item)) {
      console.warn(`[youtube] Skipping malformed or empty transcript: ${JSON.stringify({ video_id: item?.video_id })}`)
      continue
    }

    console.log(`[youtube] Extracting techniques from ${item.video_id}...`)
    try {
      const extracted = await extractChunks(
        model,
        buildYoutubePrompt(item),
        `YouTube video ${item.video_id}`,
        ['technique', 'workflow', 'motion_beat'],
      )

      for (const chunk of extracted) {
        chunks.push(toKnowledgeChunk(chunk, item.source, youtubeUrl(item.video_id), item.content, chunks.length + 1, {
          video_id: item.video_id,
        }))
      }

      await writeKnowledgeArtifacts(chunks)
    } catch (error) {
      if (isQuotaError(error)) {
        quotaReached = true
        console.warn(`[warn] Gemini quota reached while processing YouTube video ${item.video_id}.`)
        break
      }

      console.error(`[youtube:error] ${item.video_id}: ${formatError(error)}`)
    }

    await sleep(GEMINI_DELAY_MS)
  }

  if (!quotaReached) {
    for (const item of redditPayload) {
      if (!isUsableRedditItem(item)) continue

      console.log(`[reddit] Extracting Q&A knowledge from r/${item.subreddit} ${item.id}...`)
      try {
        const extracted = await extractChunks(model, buildRedditPrompt(item), `Reddit post ${item.id}`, ['qa'])

        for (const chunk of extracted) {
          chunks.push(toKnowledgeChunk(chunk, item.source, item.url, `${item.title}\n\n${item.body}`, chunks.length + 1, {
            reddit_id: item.id,
            subreddit: item.subreddit,
            score: item.score,
          }))
        }

        await writeKnowledgeArtifacts(chunks)
      } catch (error) {
        if (isQuotaError(error)) {
          quotaReached = true
          console.warn(`[warn] Gemini quota reached while processing Reddit post ${item.id}.`)
          break
        }

        console.error(`[reddit:error] ${item.id}: ${formatError(error)}`)
      }

      await sleep(GEMINI_DELAY_MS)
    }
  }

  if (quotaReached) {
    console.warn('[warn] Gemini quota reached. Building fallback chunks from harvested payloads.')
    chunks.push(...buildFallbackKnowledgeChunks(youtubePayload, redditPayload, chunks.length + 1))
  }

  await writeKnowledgeArtifacts(chunks)

  if (quotaReached) {
    console.warn(`[warn] Partial knowledge base persisted with ${chunks.length} chunks.`)
  }

  console.log(`[done] Wrote ${chunks.length} chunks to knowledge-base.json.`)
  console.log('[done] Wrote fine-tuning-dataset.jsonl.')
}

async function extractChunks(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  prompt: string,
  label: string,
  allowedTypes: ExtractedType[],
) {
  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const parsed = parseJsonArray(text, label)
  return parsed
    .map((chunk, index) => normalizeGeminiChunk(chunk, `${label} chunk ${index + 1}`, allowedTypes))
    .filter(isKnowledgeCandidate)
}

function buildYoutubePrompt(item: YouTubePayloadItem) {
  return [
    'Extract concrete actionable video editing techniques from this YouTube transcript.',
    'Return only a JSON array. Each object must have: topic, content, tags, type.',
    'content must be 2-3 sentences in a professional editor voice.',
    'tags must be an array of short strings.',
    'type must be one of: "technique", "workflow", "motion_beat".',
    'Do not include vague inspiration, creator biography, sponsorships, or non-editing advice.',
    '',
    `Video ID: ${item.video_id}`,
    'Transcript:',
    truncate(item.content, MAX_YOUTUBE_CONTENT_CHARS),
  ].join('\n')
}

function buildRedditPrompt(item: RedditPayloadItem) {
  return [
    'Extract reusable Q&A knowledge for video editors from this Reddit forum post.',
    'Return only a JSON array. Each object must have: topic, content, tags, type.',
    'type must always be "qa".',
    'content should directly answer the editing, workflow, tooling, troubleshooting, color, VFX, or post-production question implied by the post.',
    'If the post is a show-off, promotion, hiring post, gear brag, or contains no transferable technique, return an empty array.',
    '',
    `Subreddit: r/${item.subreddit}`,
    `Title: ${item.title}`,
    `Score: ${item.score}`,
    'Body:',
    truncate(item.body, MAX_REDDIT_CONTENT_CHARS),
  ].join('\n')
}

function parseJsonArray(text: string, label: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(stripJsonFence(text))
    if (!Array.isArray(parsed)) throw new Error('Gemini returned JSON that is not an array.')
    return parsed
  } catch (error) {
    throw new Error(`${label}: failed to parse Gemini JSON response. ${formatError(error)} Response: ${truncate(text, 1000)}`)
  }
}

function normalizeGeminiChunk(value: unknown, label: string, allowedTypes: ExtractedType[]): GeminiChunk | null {
  if (!isRecord(value)) {
    console.warn(`[skip] ${label}: item is not an object.`)
    return null
  }

  const topic = cleanText(value.topic)
  const content = cleanText(value.content)
  const type = cleanText(value.type) as ExtractedType
  const tags = Array.isArray(value.tags) ? value.tags.map(cleanText).filter(Boolean).slice(0, 8) : []

  if (!topic || !content) {
    console.warn(`[skip] ${label}: missing topic or content.`)
    return null
  }

  if (!allowedTypes.includes(type)) {
    console.warn(`[skip] ${label}: unexpected type "${type}".`)
    return null
  }

  return {
    topic,
    content,
    tags,
    type,
  }
}

function toKnowledgeChunk(
  chunk: KnowledgeChunkPayload,
  source: 'youtube' | 'reddit',
  sourceUrl: string,
  rawSource: string,
  sequence: number,
  sourceRef: KnowledgeChunk['source_ref'],
): KnowledgeChunk {
  return {
    id: `${source}-${String(sequence).padStart(5, '0')}`,
    source,
    source_url: sourceUrl,
    raw_source: makeSnippet(rawSource),
    embedding: null,
    source_ref: sourceRef,
    ...chunk,
  }
}

function toFineTuningJsonLine(chunk: KnowledgeChunk) {
  const example: FineTuningExample = {
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Explain ${chunk.topic} for a working video editor.`,
      },
      {
        role: 'assistant',
        content: chunk.content,
      },
    ],
  }

  return JSON.stringify(example)
}

async function writeKnowledgeArtifacts(chunks: KnowledgeChunk[]) {
  await writeFile(KNOWLEDGE_BASE_PATH, `${JSON.stringify(chunks, null, 2)}\n`, 'utf8')
  await writeFile(FINE_TUNING_DATASET_PATH, `${chunks.map(toFineTuningJsonLine).join('\n')}\n`, 'utf8')
}

function buildFallbackKnowledgeChunks(
  youtubePayload: YouTubePayloadItem[],
  redditPayload: RedditPayloadItem[],
  startingSequence: number,
) {
  const fallbackChunks: KnowledgeChunk[] = []
  let sequence = startingSequence

  for (const item of youtubePayload.filter(isUsableYoutubeItem)) {
    const segments = splitTextIntoOverlappingSegments(item.content, {
      minChars: FALLBACK_TRANSCRIPT_MIN_CHARS,
      targetChars: FALLBACK_TRANSCRIPT_TARGET_CHARS,
      maxChars: FALLBACK_TRANSCRIPT_MAX_CHARS,
      overlapChars: FALLBACK_TRANSCRIPT_OVERLAP_CHARS,
    })

    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index]
      fallbackChunks.push(toKnowledgeChunk(
        {
          topic: buildTranscriptTopic(item.video_id, segment, index + 1),
          content: segment,
          tags: buildFallbackTags(['fallback', 'youtube', 'transcript', 'transcript_segment'], segment),
          type: 'transcript_segment',
        },
        item.source,
        youtubeUrl(item.video_id),
        segment,
        sequence++,
        { video_id: item.video_id },
      ))
    }
  }

  const usableReddit = redditPayload
    .filter(isUsableRedditItem)
    .sort((a, b) => b.score - a.score)

  for (const item of usableReddit) {
    const paragraphChunks = splitRedditPostIntoParagraphChunks(item)

    for (let index = 0; index < paragraphChunks.length; index++) {
      const paragraphChunk = paragraphChunks[index]
      const content = [`Title: ${item.title}`, `Subreddit: r/${item.subreddit}`, paragraphChunk].join('\n\n')

      fallbackChunks.push(toKnowledgeChunk(
        {
          topic: buildRedditTopic(item, paragraphChunk, index + 1, paragraphChunks.length),
          content,
          tags: buildFallbackTags(['fallback', 'reddit', item.subreddit.toLowerCase()], `${item.title} ${paragraphChunk}`),
          type: 'qa',
        },
        item.source,
        item.url,
        content,
        sequence++,
        {
          reddit_id: item.id,
          subreddit: item.subreddit,
          score: item.score,
        },
      ))
    }
  }

  return prioritizeFallbackChunks(fallbackChunks)
}

function splitTextIntoOverlappingSegments(
  value: string,
  options: {
    minChars: number
    targetChars: number
    maxChars: number
    overlapChars: number
  },
) {
  const text = cleanText(value)
  if (!text) return []
  if (text.length <= options.maxChars) return [text]

  const segments: string[] = []
  let start = 0

  while (start < text.length) {
    const remaining = text.length - start
    if (remaining <= options.maxChars) {
      const tail = text.slice(start).trim()
      appendTailSegment(segments, tail, options)
      break
    }

    const targetEnd = Math.min(start + options.targetChars, text.length)
    const minEnd = Math.min(start + options.minChars, targetEnd)
    const maxEnd = Math.min(start + options.maxChars, text.length)
    const end = findSegmentBoundary(text, minEnd, targetEnd, maxEnd)
    const segment = text.slice(start, end).trim()

    if (segment.length >= options.minChars || !segments.length) {
      segments.push(segment)
    }

    const nextStart = Math.max(0, end - options.overlapChars)
    start = nextStart > start ? nextStart : end
  }

  return segments
}

function appendTailSegment(
  segments: string[],
  tail: string,
  options: {
    minChars: number
    maxChars: number
  },
) {
  if (!tail) return
  if (tail.length >= options.minChars || !segments.length) {
    segments.push(tail)
    return
  }

  const last = segments[segments.length - 1]
  const merged = `${last} ${tail}`.trim()
  if (merged.length <= options.maxChars) {
    segments[segments.length - 1] = merged
    return
  }

  segments.push(tail)
}

function splitRedditPostIntoParagraphChunks(item: RedditPayloadItem) {
  const paragraphs = item.body
    .split(/\n{2,}/)
    .map(cleanText)
    .filter((paragraph) => paragraph.length >= FALLBACK_REDDIT_MIN_CHARS)

  if (!paragraphs.length) return []

  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    const splitParagraphs =
      paragraph.length > FALLBACK_REDDIT_MAX_CHARS
        ? splitTextIntoOverlappingSegments(paragraph, {
            minChars: FALLBACK_REDDIT_MIN_CHARS,
            targetChars: FALLBACK_REDDIT_TARGET_CHARS,
            maxChars: FALLBACK_REDDIT_MAX_CHARS,
            overlapChars: 0,
          })
        : [paragraph]

    for (const part of splitParagraphs) {
      const candidate = current ? `${current}\n\n${part}` : part
      if (candidate.length <= FALLBACK_REDDIT_MAX_CHARS) {
        current = candidate
        continue
      }

      if (current) chunks.push(current)
      current = part
    }
  }

  if (current) chunks.push(current)
  return chunks
}

function findSegmentBoundary(text: string, minEnd: number, targetEnd: number, maxEnd: number) {
  const sentenceBoundary = findBoundaryNearTarget(text, minEnd, targetEnd, maxEnd, /[.!?]\s/)
  if (sentenceBoundary !== -1) return sentenceBoundary

  const whitespaceBoundary = findBoundaryNearTarget(text, minEnd, targetEnd, maxEnd, /\s/)
  return whitespaceBoundary === -1 ? targetEnd : whitespaceBoundary
}

function findBoundaryNearTarget(text: string, minEnd: number, targetEnd: number, maxEnd: number, pattern: RegExp) {
  let best = -1
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = minEnd; index <= maxEnd; index++) {
    const sample = text.slice(Math.max(0, index - 1), Math.min(text.length, index + 1))
    if (!pattern.test(sample)) continue

    const distance = Math.abs(index - targetEnd)
    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  }

  return best
}

function buildTranscriptTopic(videoId: string, segment: string, segmentIndex: number) {
  const inferred = inferEditingTopic(segment)
  return `${inferred || 'Transcript'} segment ${segmentIndex} from YouTube ${videoId}`
}

function buildRedditTopic(item: RedditPayloadItem, paragraphChunk: string, index: number, total: number) {
  const inferred = inferEditingTopic(`${item.title} ${paragraphChunk}`)
  const suffix = total > 1 ? ` (part ${index})` : ''
  return inferred ? `${inferred}: ${item.title}${suffix}` : `${item.title}${suffix}`
}

function buildFallbackTags(baseTags: string[], text: string) {
  return Array.from(new Set([...baseTags, ...inferEditingTags(text)]))
}

function inferEditingTopic(text: string) {
  const tags = inferEditingTags(text)
  if (tags.includes('speed-ramp')) return 'Speed ramping'
  if (tags.includes('time-remap')) return 'Time remapping'
  if (tags.includes('keyframes')) return 'Keyframing'
  if (tags.includes('velocity')) return 'Velocity adjustment'
  if (tags.includes('transitions')) return 'Transitions'
  if (tags.includes('sound-design')) return 'Sound design'
  if (tags.includes('color')) return 'Color grading'
  if (tags.includes('workflow')) return 'Editing workflow'
  return ''
}

function inferEditingTags(text: string) {
  const lower = text.toLowerCase()
  const tags: string[] = []

  if (/\bspeed\s*ramps?\b|\bspeed\s*ramping\b/.test(lower)) tags.push('speed-ramp')
  if (/\btime\s*remap\b|\bretime\b|\bretiming\b/.test(lower)) tags.push('time-remap')
  if (/\bkey\s*frames?\b|\bkeyframes?\b/.test(lower)) tags.push('keyframes')
  if (/\bvelocity\b|\bease in\b|\bease out\b|\beasing\b/.test(lower)) tags.push('velocity')
  if (/\btransition\b|\bcross dissolve\b|\bdip to black\b|\bdip to white\b/.test(lower)) tags.push('transitions')
  if (/\bsound design\b|\bsfx\b|\bmusic\b|\baudio\b/.test(lower)) tags.push('sound-design')
  if (/\bcolor\b|\bgrade\b|\bgrading\b|\blut\b/.test(lower)) tags.push('color')
  if (/\bworkflow\b|\bproxy\b|\bproxies\b|\bexport\b|\btimeline\b|\bsequence\b/.test(lower)) tags.push('workflow')

  return tags
}

function prioritizeFallbackChunks(chunks: KnowledgeChunk[]) {
  return chunks
    .map((chunk, index) => ({ chunk, index }))
    .sort((a, b) => fallbackChunkPriority(a.chunk) - fallbackChunkPriority(b.chunk) || a.index - b.index)
    .map((entry) => entry.chunk)
}

function fallbackChunkPriority(chunk: KnowledgeChunk) {
  const text = `${chunk.topic} ${chunk.content} ${chunk.tags.join(' ')}`.toLowerCase()

  if (/\bspeed\s*ramps?\b|\bspeed\s*ramping\b/.test(text)) return 0
  if (/\btime\s*remap\b|\bretime\b|\bretiming\b/.test(text)) return 1
  if (/\bvelocity\b|\bease in\b|\bease out\b|\beasing\b|\bkey\s*frames?\b|\bkeyframes?\b/.test(text)) return 2
  if (/\btransition\b|\bcross dissolve\b|\bdip to black\b|\bdip to white\b/.test(text)) return 3
  if (/\bsound design\b|\bsfx\b|\bmusic\b|\baudio\b|\bcolor\b|\bgrade\b|\bgrading\b|\blut\b/.test(text)) return 4
  if (/\bworkflow\b|\bproxy\b|\bproxies\b|\bexport\b|\btimeline\b|\bsequence\b/.test(text)) return 5

  return 6
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  const raw = await readFile(filePath, 'utf8').catch((error: unknown) => {
    throw new Error(`Unable to read ${filePath}. Upload the payload JSON files before running this processor. ${formatError(error)}`)
  })

  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON array.`)
  }

  return parsed as T[]
}

function isUsableYoutubeItem(item: YouTubePayloadItem) {
  return (
    isRecord(item) &&
    item.source === 'youtube' &&
    item.content_type === 'transcript' &&
    typeof item.video_id === 'string' &&
    item.video_id.trim().length > 0 &&
    typeof item.content === 'string' &&
    item.content.trim().length > 0
  )
}

function isUsableRedditItem(item: RedditPayloadItem) {
  return (
    isRecord(item) &&
    item.source === 'reddit' &&
    item.content_type === 'forum_post' &&
    typeof item.id === 'string' &&
    typeof item.subreddit === 'string' &&
    typeof item.title === 'string' &&
    typeof item.body === 'string' &&
    item.body.trim().length > 100
  )
}

function getGeminiApiKey() {
  const value = process.env.GEMINI_API_KEY?.trim()
  if (!value) throw new Error('Missing required environment variable: GEMINI_API_KEY')
  return value
}

function loadEnvLocal() {
  for (const filePath of ['.env.local', '.env']) {
    if (!existsSync(filePath)) continue

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  }
}

function isQuotaError(error: unknown) {
  const message = formatError(error).toLowerCase()
  return (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('generate_content_free_tier_requests')
  )
}

function stripJsonFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function makeSnippet(value: string) {
  return truncate(cleanText(value), RAW_SOURCE_SNIPPET_CHARS)
}

function fallbackExcerpt(value: string) {
  return truncate(cleanText(value), 360)
}

function youtubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function truncate(value: string, maxChars: number) {
  return value.length > maxChars ? `${value.slice(0, maxChars).trim()}...` : value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

void main().catch((error) => {
  console.error('[fatal]', formatError(error))
  process.exitCode = 1
})
