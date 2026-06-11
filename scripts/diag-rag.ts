import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'

import type { SupabaseClient } from '@supabase/supabase-js'

const EMBEDDING_MODEL = 'gemini-embedding-2'
const EMBEDDING_DIMENSIONS = 3072
const DEFAULT_QUERY = 'speed ramping'
const MATCH_COUNT = 10
const THRESHOLDS = [0.7, 0.5, 0.3, 0.1, 0.0, -1.0]

type RequiredEnv = {
  GEMINI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type KnowledgeChunkMatch = {
  id: string
  topic: string
  content: string
  tags: string[]
  type: string
  source: string
  source_url: string
  similarity: number
}

type RagDatabase = {
  public: {
    Tables: {
      knowledge_chunks: {
        Row: {
          id: string
          topic: string
          content: string
          tags: string[] | null
          type: string
          source: string | null
          source_url: string | null
          embedding: number[] | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_knowledge_chunks: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: KnowledgeChunkMatch[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type RagSupabaseClient = SupabaseClient<RagDatabase>

loadEnvLocal()

async function main() {
  const env = getRequiredEnv()
  const query = cleanText(process.argv.slice(2).join(' ')) || DEFAULT_QUERY
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
  const supabase = createSupabaseClient(env)

  console.log(`[diag] Query: "${query}"`)
  const rowCount = await countKnowledgeChunks(supabase)
  console.log(`[diag] knowledge_chunks rows: ${rowCount}`)

  const queryEmbedding = await createQueryEmbedding(genAI, query)
  console.log(`[diag] ${EMBEDDING_MODEL} dimensions: ${queryEmbedding.length}`)

  let zeroThresholdMatches = 0
  let negativeThresholdMatches = 0

  for (const threshold of THRESHOLDS) {
    const matches = await retrieveMatches(supabase, queryEmbedding, threshold)
    if (threshold === 0.0) zeroThresholdMatches = matches.length
    if (threshold === -1.0) negativeThresholdMatches = matches.length

    console.log(`\n[diag] threshold ${threshold.toFixed(1)} -> ${matches.length} matches`)
    if (!matches.length) continue

    console.log(`[diag] top similarities: ${matches.map((match) => match.similarity.toFixed(4)).join(', ')}`)
    for (const [index, match] of matches.slice(0, 5).entries()) {
      console.log(
        [
          `  ${index + 1}. ${match.similarity.toFixed(4)}`,
          `[${match.type}/${match.source}]`,
          match.topic,
          `(${match.source_url})`,
        ].join(' '),
      )
      console.log(`     ${truncate(match.content, 220)}`)
    }
  }

  if (zeroThresholdMatches === 0) {
    const detail =
      negativeThresholdMatches > 0
        ? 'Rows appear only below similarity 0.0; retrieval quality or thresholding is the likely issue.'
        : 'No rows matched even at -1.0; investigate the SQL RPC, embedding column, or function signature.'
    console.warn(`\n[diag:warn] ${detail}`)
  }
}

async function createQueryEmbedding(genAI: GoogleGenerativeAI, query: string) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
  const result = await model.embedContent({
    content: {
      role: 'user',
      parts: [{ text: query }],
    },
    taskType: TaskType.RETRIEVAL_QUERY,
  })

  const values = result.embedding.values
  if (!values?.length) {
    throw new Error('Gemini returned an empty query embedding.')
  }

  return normalizeEmbeddingDimensions(values)
}

async function countKnowledgeChunks(supabase: RagSupabaseClient) {
  const { count, error } = await supabase.from('knowledge_chunks').select('id', { head: true, count: 'exact' })
  if (error) {
    throw new Error(`Unable to count knowledge_chunks. ${error.message}`)
  }

  return count ?? 0
}

async function retrieveMatches(supabase: RagSupabaseClient, queryEmbedding: number[], threshold: number) {
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: MATCH_COUNT,
  })

  if (error) {
    throw new Error(`match_knowledge_chunks failed at threshold ${threshold}: ${error.message}`)
  }

  return normalizeMatches(data || [])
}

function normalizeMatches(values: unknown[]): KnowledgeChunkMatch[] {
  return values
    .map((value) => {
      if (!isRecord(value)) return null

      const topic = cleanText(value.topic)
      const content = cleanText(value.content)
      const sourceUrl = cleanText(value.source_url)
      const type = cleanText(value.type)
      const source = cleanText(value.source)
      const similarity = typeof value.similarity === 'number' ? value.similarity : Number(value.similarity)

      if (!topic || !content || !sourceUrl || !type || !source || !Number.isFinite(similarity)) {
        return null
      }

      return {
        id: cleanText(value.id),
        topic,
        content,
        tags: Array.isArray(value.tags) ? value.tags.map(cleanText).filter(Boolean) : [],
        type,
        source,
        source_url: sourceUrl,
        similarity,
      }
    })
    .filter((value): value is KnowledgeChunkMatch => value !== null)
}

function normalizeEmbeddingDimensions(embedding: number[]) {
  if (embedding.length === EMBEDDING_DIMENSIONS) return embedding
  if (embedding.length > EMBEDDING_DIMENSIONS) return embedding.slice(0, EMBEDDING_DIMENSIONS)

  return [...embedding, ...Array(EMBEDDING_DIMENSIONS - embedding.length).fill(0)]
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
