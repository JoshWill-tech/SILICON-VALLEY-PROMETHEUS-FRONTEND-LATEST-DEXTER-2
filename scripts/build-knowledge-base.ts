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

type GeminiChunk = {
  topic: string
  content: string
  tags: string[]
  type: ExtractedType
}

export type KnowledgeChunk = GeminiChunk & {
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

  for (const item of youtubePayload) {
    if (!isUsableYoutubeItem(item)) {
      console.warn(`[youtube] Skipping malformed or empty transcript: ${JSON.stringify({ video_id: item?.video_id })}`)
      continue
    }

    console.log(`[youtube] Extracting techniques from ${item.video_id}...`)
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

    await sleep(GEMINI_DELAY_MS)
  }

  for (const item of redditPayload) {
    if (!isUsableRedditItem(item)) continue

    console.log(`[reddit] Extracting Q&A knowledge from r/${item.subreddit} ${item.id}...`)
    const extracted = await extractChunks(model, buildRedditPrompt(item), `Reddit post ${item.id}`, ['qa'])

    for (const chunk of extracted) {
      chunks.push(toKnowledgeChunk(chunk, item.source, item.url, `${item.title}\n\n${item.body}`, chunks.length + 1, {
        reddit_id: item.id,
        subreddit: item.subreddit,
        score: item.score,
      }))
    }

    await sleep(GEMINI_DELAY_MS)
  }

  await writeFile(KNOWLEDGE_BASE_PATH, `${JSON.stringify(chunks, null, 2)}\n`, 'utf8')
  await writeFile(FINE_TUNING_DATASET_PATH, `${chunks.map(toFineTuningJsonLine).join('\n')}\n`, 'utf8')

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
  chunk: GeminiChunk,
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

function stripJsonFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function makeSnippet(value: string) {
  return truncate(cleanText(value), RAW_SOURCE_SNIPPET_CHARS)
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
