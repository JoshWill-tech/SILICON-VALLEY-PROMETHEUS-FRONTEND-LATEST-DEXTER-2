// Architecture note:
// - motion_knowledge_base = source catalog / video inventory
// - knowledge_chunks = searchable RAG brain with embeddings

import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { KnowledgeChunk } from './build-knowledge-base'

const KNOWLEDGE_BASE_PATH = join(process.cwd(), 'knowledge-base.json')
const EMBEDDING_MODEL = 'gemini-embedding-2'
const EMBEDDING_DIMENSIONS = 3072
const INSERT_BATCH_SIZE = 25
const SOURCE_URL_LOOKUP_BATCH_SIZE = 100

type RequiredEnv = {
  GEMINI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type KnowledgeChunkInsert = {
  topic: string
  content: string
  tags: string[]
  type: KnowledgeChunk['type']
  source: KnowledgeChunk['source']
  source_url: string
  embedding: number[]
}

type KnowledgeChunkRow = KnowledgeChunkInsert & {
  id: string
  created_at?: string | null
}

type RagDatabase = {
  public: {
    Tables: {
      knowledge_chunks: {
        Row: KnowledgeChunkRow
        Insert: KnowledgeChunkInsert
        Update: Partial<KnowledgeChunkInsert>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type RagSupabaseClient = SupabaseClient<RagDatabase>

type SeedSummary = {
  totalRead: number
  duplicateInputSkipped: number
  existingSkipped: number
  embeddingFailed: number
  readyToInsert: number
  inserted: number
  insertFailedRows: number
  failedBatches: number
}

loadEnvLocal()

async function main() {
  const env = getRequiredEnv()
  const chunks = await readKnowledgeBase(KNOWLEDGE_BASE_PATH)
  const supabase = createSupabaseClient(env)
  const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({ model: EMBEDDING_MODEL })

  const summary: SeedSummary = {
    totalRead: chunks.length,
    duplicateInputSkipped: 0,
    existingSkipped: 0,
    embeddingFailed: 0,
    readyToInsert: 0,
    inserted: 0,
    insertFailedRows: 0,
    failedBatches: 0,
  }

  const uniqueChunks = dedupeInputChunks(chunks, summary)
  const existingKeys = await loadExistingKnowledgeKeys(supabase, uniqueChunks)
  const pendingChunks = uniqueChunks.filter((chunk) => {
    const isExisting = existingKeys.has(chunkKey(chunk))
    if (isExisting) summary.existingSkipped++
    return !isExisting
  })

  console.log(`[seed] Read ${summary.totalRead} chunks from knowledge-base.json.`)
  console.log(`[seed] Skipping ${summary.duplicateInputSkipped} duplicate input chunks and ${summary.existingSkipped} existing rows.`)
  console.log(`[seed] Embedding ${pendingChunks.length} new chunks with Gemini ${EMBEDDING_MODEL}.`)

  const rows: KnowledgeChunkInsert[] = []
  let quotaReached = false
  for (let index = 0; index < pendingChunks.length; index++) {
    const chunk = pendingChunks[index]
    const label = `${index + 1}/${pendingChunks.length} ${chunk.source_url} :: ${chunk.topic}`

    try {
      const embedding = await createEmbedding(model, chunk)
      rows.push(toInsertRow(chunk, embedding))
      console.log(`[embed] ${label}`)
    } catch (error) {
      summary.embeddingFailed++
      console.error(`[embed:error] ${label}: ${formatError(error)}`)
      if (isQuotaError(error)) {
        quotaReached = true
        console.warn('[warn] Gemini embedding quota reached. Seeding will continue with the rows collected so far.')
        break
      }
    }
  }

  summary.readyToInsert = rows.length
  await insertRowsInBatches(supabase, rows, summary)

  if (quotaReached) {
    console.warn(`[warn] Partial seed completed with ${summary.inserted} inserted rows.`)
  }

  console.log('\n=== SUPABASE RAG SEED COMPLETE ===')
  console.log(`Read: ${summary.totalRead}`)
  console.log(`Skipped duplicate input: ${summary.duplicateInputSkipped}`)
  console.log(`Skipped existing rows: ${summary.existingSkipped}`)
  console.log(`Embedding failures: ${summary.embeddingFailed}`)
  console.log(`Ready to insert: ${summary.readyToInsert}`)
  console.log(`Inserted: ${summary.inserted}`)
  console.log(`Insert failed rows: ${summary.insertFailedRows}`)
  console.log(`Failed insert batches: ${summary.failedBatches}`)
}

async function readKnowledgeBase(filePath: string): Promise<KnowledgeChunk[]> {
  const raw = await readFile(filePath, 'utf8').catch((error: unknown) => {
    throw new Error(`Unable to read ${filePath}. Generate knowledge-base.json before seeding Supabase. ${formatError(error)}`)
  })

  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON array.`)
  }

  return parsed.map((value, index) => normalizeKnowledgeChunk(value, index))
}

function normalizeKnowledgeChunk(value: unknown, index: number): KnowledgeChunk {
  if (!isRecord(value)) {
    throw new Error(`knowledge-base.json[${index}] must be an object.`)
  }

  const id = cleanText(value.id)
  const topic = cleanText(value.topic)
  const content = cleanText(value.content)
  const sourceUrl = cleanText(value.source_url)
  const rawSource = cleanText(value.raw_source)
  const tags = Array.isArray(value.tags) ? value.tags.map(cleanText).filter(Boolean) : null
  const type = value.type
  const source = value.source

  if (!id) throw new Error(`knowledge-base.json[${index}].id is required.`)
  if (!topic) throw new Error(`knowledge-base.json[${index}].topic is required.`)
  if (!content) throw new Error(`knowledge-base.json[${index}].content is required.`)
  if (!sourceUrl) throw new Error(`knowledge-base.json[${index}].source_url is required.`)
  if (!rawSource) throw new Error(`knowledge-base.json[${index}].raw_source is required.`)
  if (!tags) throw new Error(`knowledge-base.json[${index}].tags must be an array.`)
  if (!isKnowledgeType(type)) throw new Error(`knowledge-base.json[${index}].type is invalid.`)
  if (!isKnowledgeSource(source)) throw new Error(`knowledge-base.json[${index}].source is invalid.`)

  return {
    id,
    topic,
    content,
    tags,
    type,
    source,
    source_url: sourceUrl,
    raw_source: rawSource,
    embedding: null,
    source_ref: isRecord(value.source_ref) ? normalizeSourceRef(value.source_ref) : {},
  }
}

function normalizeSourceRef(value: Record<string, unknown>): KnowledgeChunk['source_ref'] {
  const sourceRef: KnowledgeChunk['source_ref'] = {}
  const videoId = cleanText(value.video_id)
  const redditId = cleanText(value.reddit_id)
  const subreddit = cleanText(value.subreddit)
  const score = typeof value.score === 'number' ? value.score : undefined

  if (videoId) sourceRef.video_id = videoId
  if (redditId) sourceRef.reddit_id = redditId
  if (subreddit) sourceRef.subreddit = subreddit
  if (score !== undefined) sourceRef.score = score

  return sourceRef
}

function dedupeInputChunks(chunks: KnowledgeChunk[], summary: SeedSummary) {
  const seen = new Set<string>()
  const deduped: KnowledgeChunk[] = []

  for (const chunk of chunks) {
    const key = chunkKey(chunk)
    if (seen.has(key)) {
      summary.duplicateInputSkipped++
      continue
    }

    seen.add(key)
    deduped.push(chunk)
  }

  return deduped
}

async function loadExistingKnowledgeKeys(supabase: RagSupabaseClient, chunks: KnowledgeChunk[]) {
  const existingKeys = new Set<string>()
  const sourceUrls = Array.from(new Set(chunks.map((chunk) => chunk.source_url)))

  for (const sourceUrlBatch of chunkArray(sourceUrls, SOURCE_URL_LOOKUP_BATCH_SIZE)) {
    const { data, error } = await supabase
      .from('knowledge_chunks')
      .select('source_url, topic')
      .in('source_url', sourceUrlBatch)

    if (error) {
      throw new Error(`Unable to load existing knowledge_chunks for dedupe. ${error.message}`)
    }

    for (const row of data || []) {
      existingKeys.add(`${row.source_url}::${normalizeKeyPart(row.topic)}`)
    }
  }

  return existingKeys
}

async function createEmbedding(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  chunk: KnowledgeChunk,
): Promise<number[]> {
  const result = await model.embedContent({
    content: {
      role: 'user',
      parts: [{ text: buildEmbeddingInput(chunk) }],
    },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: chunk.topic,
  })

  const values = result.embedding.values
  if (!values?.length) {
    throw new Error('Gemini returned an empty embedding.')
  }

  return normalizeEmbeddingDimensions(values, chunkKey(chunk))
}

function buildEmbeddingInput(chunk: KnowledgeChunk) {
  return `${chunk.topic}\n\n${chunk.content}\n\nTags: ${chunk.tags.join(', ')}`
}

function normalizeEmbeddingDimensions(embedding: number[], label: string) {
  if (embedding.length === EMBEDDING_DIMENSIONS) return embedding

  if (embedding.length > EMBEDDING_DIMENSIONS) {
    console.warn(`[embed:warn] ${label}: Gemini returned ${embedding.length} dimensions; truncating to ${EMBEDDING_DIMENSIONS}.`)
    return embedding.slice(0, EMBEDDING_DIMENSIONS)
  }

  console.warn(`[embed:warn] ${label}: Gemini returned ${embedding.length} dimensions; padding to ${EMBEDDING_DIMENSIONS}.`)
  return [...embedding, ...Array(EMBEDDING_DIMENSIONS - embedding.length).fill(0)]
}

function toInsertRow(chunk: KnowledgeChunk, embedding: number[]): KnowledgeChunkInsert {
  return {
    topic: chunk.topic,
    content: chunk.content,
    tags: chunk.tags,
    type: chunk.type,
    source: chunk.source,
    source_url: chunk.source_url,
    embedding,
  }
}

async function insertRowsInBatches(
  supabase: RagSupabaseClient,
  rows: KnowledgeChunkInsert[],
  summary: SeedSummary,
) {
  const batches = chunkArray(rows, INSERT_BATCH_SIZE)

  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index]
    const label = `${index + 1}/${batches.length}`
    const { error } = await supabase.from('knowledge_chunks').insert(batch)

    if (error) {
      summary.failedBatches++
      summary.insertFailedRows += batch.length
      console.error(`[insert:error] Batch ${label} failed for ${batch.length} rows: ${error.message}`)
      continue
    }

    summary.inserted += batch.length
    console.log(`[insert] Batch ${label}: inserted ${batch.length} rows.`)
  }
}

function createSupabaseClient(env: RequiredEnv): RagSupabaseClient {
  return createClient<RagDatabase>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getRequiredEnv(): RequiredEnv {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim()
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const missing = [
    !geminiApiKey ? 'GEMINI_API_KEY' : '',
    !supabaseUrl ? 'SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL' : '',
    !supabaseServiceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : '',
  ].filter(Boolean)

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return {
    GEMINI_API_KEY: geminiApiKey!,
    SUPABASE_URL: supabaseUrl!,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey!,
  }
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

function chunkKey(chunk: Pick<KnowledgeChunk, 'source_url' | 'topic'>) {
  return `${chunk.source_url}::${normalizeKeyPart(chunk.topic)}`
}

function normalizeKeyPart(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

function chunkArray<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }

  return chunks
}

function isKnowledgeType(value: unknown): value is KnowledgeChunk['type'] {
  return (
    value === 'technique' ||
    value === 'workflow' ||
    value === 'motion_beat' ||
    value === 'qa' ||
    value === 'transcript_segment'
  )
}

function isKnowledgeSource(value: unknown): value is KnowledgeChunk['source'] {
  return value === 'youtube' || value === 'reddit'
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
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
