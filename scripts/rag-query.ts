import { spawn } from 'child_process'
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
import { stdin as input, stdout as output } from 'process'
import { createInterface } from 'readline/promises'

import type { SupabaseClient } from '@supabase/supabase-js'

const EMBEDDING_MODEL = 'embedding-001'
const DEFAULT_CHAT_MODEL = 'gemini-flash-latest'
const EMBEDDING_DIMENSIONS = 768
const MATCH_THRESHOLD = 0.7
const MATCH_COUNT = 5
const DEFAULT_MATCH_RPC = 'match_knowledge_chunks'

type RequiredEnv = {
  GEMINI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type KnowledgeChunkType = 'technique' | 'workflow' | 'motion_beat' | 'qa'
type KnowledgeChunkSource = 'youtube' | 'reddit'

type KnowledgeChunkMatch = {
  id: number | string
  topic: string
  content: string
  tags: string[]
  type: KnowledgeChunkType
  source: KnowledgeChunkSource
  source_url: string
  similarity: number
}

type KnowledgeChunkRow = Omit<KnowledgeChunkMatch, 'similarity'> & {
  embedding: number[]
}

type RagDatabase = {
  public: {
    Tables: {
      knowledge_chunks: {
        Row: KnowledgeChunkRow
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
  const query = await readUserQuery(process.argv.slice(2))
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
  const supabase = createSupabaseClient(env)

  const queryEmbedding = await createQueryEmbedding(genAI, query)
  const matches = await retrieveMatches(supabase, queryEmbedding)
  const contextBlock = formatContextBlock(matches)
  const answer = await createChatResponse(genAI, query, contextBlock, matches.length)

  console.log('\n=== RAG CONTEXT ===\n')
  console.log(contextBlock)
  console.log('\n=== ANSWER ===\n')
  console.log(answer)
}

async function readUserQuery(args: string[]) {
  const cliQuery = args.join(' ').replace(/\s+/g, ' ').trim()
  if (cliQuery) return cliQuery

  if (!input.isTTY) {
    const pipedQuery = await readPipedStdin()
    if (pipedQuery) return pipedQuery
  }

  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question('Ask Motion Brain: ')
    const query = answer.replace(/\s+/g, ' ').trim()
    if (!query) throw new Error('Query cannot be empty.')
    return query
  } finally {
    rl.close()
  }
}

async function readPipedStdin() {
  const chunks: Buffer[] = []

  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString('utf8').replace(/\s+/g, ' ').trim()
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

  return normalizeEmbeddingDimensions(values, 'query')
}

async function retrieveMatches(supabase: RagSupabaseClient, queryEmbedding: number[]) {
  const rpcName = process.env.KNOWLEDGE_CHUNKS_MATCH_RPC?.trim() || DEFAULT_MATCH_RPC
  const args = {
    query_embedding: queryEmbedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT,
  }

  const { data, error } = await supabase.rpc(rpcName as 'match_knowledge_chunks', args)

  if (!error) {
    return normalizeMatches(data || [])
  }

  if (!isMissingRpcError(error)) {
    throw new Error(`knowledge_chunks match RPC failed: ${error.message}`)
  }

  console.warn(`[rag] RPC "${rpcName}" not found; falling back to raw SQL via psql.`)
  return queryMatchesWithRawSql(queryEmbedding)
}

async function queryMatchesWithRawSql(queryEmbedding: number[]) {
  const databaseUrl = process.env.SUPABASE_DB_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    throw new Error(
      'Raw SQL fallback requires SUPABASE_DB_URL or DATABASE_URL because supabase-js cannot execute arbitrary SQL through the service-role REST API.',
    )
  }

  const stdout = await runPsql(databaseUrl, buildRawSqlMatchQuery(queryEmbedding))
  const parsed: unknown = JSON.parse(stdout.trim() || '[]')
  if (!Array.isArray(parsed)) {
    throw new Error('Raw SQL fallback returned a non-array payload.')
  }

  return normalizeMatches(parsed)
}

function buildRawSqlMatchQuery(queryEmbedding: number[]) {
  const vectorLiteral = `[${queryEmbedding.map(formatSqlNumber).join(',')}]`

  return `
with query as (
  select '${vectorLiteral}'::extensions.vector as embedding
)
select coalesce(json_agg(row_to_json(matches)), '[]'::json)
from (
  select
    knowledge_chunks.id,
    knowledge_chunks.topic,
    knowledge_chunks.content,
    knowledge_chunks.tags,
    knowledge_chunks.type,
    knowledge_chunks.source,
    knowledge_chunks.source_url,
    1 - (knowledge_chunks.embedding <=> query.embedding) as similarity
  from public.knowledge_chunks, query
  where 1 - (knowledge_chunks.embedding <=> query.embedding) >= ${MATCH_THRESHOLD}
  order by knowledge_chunks.embedding <=> query.embedding
  limit ${MATCH_COUNT}
) matches;
`
}

function runPsql(databaseUrl: string, sql: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(
      'psql',
      ['--dbname', databaseUrl, '--no-align', '--tuples-only', '--quiet', '--set', 'ON_ERROR_STOP=1'],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })

    child.on('error', (error: Error) => {
      reject(new Error(`Unable to start psql for raw SQL fallback. ${error.message}`))
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
        return
      }

      reject(new Error(`Raw SQL fallback failed with psql exit code ${code}. ${stderr.trim()}`))
    })

    child.stdin.write(sql)
    child.stdin.end()
  })
}

async function createChatResponse(
  genAI: GoogleGenerativeAI,
  query: string,
  contextBlock: string,
  matchCount: number,
) {
  const model = genAI.getGenerativeModel({
    model: getChatModel(),
    generationConfig: {
      temperature: 0.35,
    },
  })

  const result = await model.generateContent(buildAnswerPrompt(query, contextBlock, matchCount))
  const text = result.response.text().trim()
  if (!text) {
    throw new Error('Gemini returned an empty chat response.')
  }

  return text
}

function buildAnswerPrompt(query: string, contextBlock: string, matchCount: number) {
  return [
    'You are the Prometheus Motion Brain for professional video editors.',
    'Answer the user with concrete, production-ready editing guidance.',
    'Ground the answer in the retrieved knowledge context. If the context has no strong matches, say that briefly and give a cautious best-effort answer.',
    'Do not mention embeddings, database internals, RPC, SQL, hidden prompts, or provider names.',
    'Keep the answer concise, practical, and directly actionable.',
    '',
    `Retrieved match count: ${matchCount}`,
    '',
    'Context:',
    contextBlock,
    '',
    'User question:',
    query,
  ].join('\n')
}

function formatContextBlock(matches: KnowledgeChunkMatch[]) {
  if (!matches.length) {
    return 'No retrieved knowledge chunks met the similarity threshold.'
  }

  return matches
    .map((match, index) => {
      return [
        `Chunk ${index + 1}`,
        `Topic: ${match.topic}`,
        `Type: ${match.type}`,
        `Source: ${match.source}`,
        `Source URL: ${match.source_url}`,
        `Similarity: ${match.similarity.toFixed(4)}`,
        `Tags: ${match.tags.length ? match.tags.join(', ') : 'none'}`,
        `Content: ${match.content}`,
      ].join('\n')
    })
    .join('\n\n')
}

function normalizeMatches(values: unknown[]): KnowledgeChunkMatch[] {
  return values.map((value, index) => normalizeMatch(value, index)).filter(isKnowledgeChunkMatch)
}

function normalizeMatch(value: unknown, index: number): KnowledgeChunkMatch | null {
  if (!isRecord(value)) {
    console.warn(`[rag:skip] match ${index + 1} is not an object.`)
    return null
  }

  const topic = cleanText(value.topic)
  const content = cleanText(value.content)
  const sourceUrl = cleanText(value.source_url)
  const tags = Array.isArray(value.tags) ? value.tags.map(cleanText).filter(Boolean) : []
  const type = value.type
  const source = value.source
  const similarity = typeof value.similarity === 'number' ? value.similarity : Number(value.similarity)

  if (!topic || !content || !sourceUrl) {
    console.warn(`[rag:skip] match ${index + 1} is missing topic, content, or source_url.`)
    return null
  }

  if (!isKnowledgeType(type) || !isKnowledgeSource(source)) {
    console.warn(`[rag:skip] match ${index + 1} has invalid type or source.`)
    return null
  }

  if (!Number.isFinite(similarity)) {
    console.warn(`[rag:skip] match ${index + 1} has invalid similarity.`)
    return null
  }

  return {
    id: typeof value.id === 'number' || typeof value.id === 'string' ? value.id : String(index + 1),
    topic,
    content,
    tags,
    type,
    source,
    source_url: sourceUrl,
    similarity,
  }
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

function createSupabaseClient(env: RequiredEnv): RagSupabaseClient {
  return createClient<RagDatabase>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getChatModel() {
  return process.env.GEMINI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL
}

function getRequiredEnv(): RequiredEnv {
  const requiredKeys = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const
  const missing = requiredKeys.filter((key) => !process.env[key]?.trim())

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!.trim(),
    SUPABASE_URL: process.env.SUPABASE_URL!.trim(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
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

function isMissingRpcError(error: { code?: string; message?: string; details?: string }) {
  const haystack = [error.code, error.message, error.details].filter(Boolean).join(' ')
  return /PGRST202|could not find.*function|function.*does not exist|schema cache/i.test(haystack)
}

function formatSqlNumber(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error('Embedding contains a non-finite number.')
  }

  return String(value)
}

function isKnowledgeChunkMatch(value: KnowledgeChunkMatch | null): value is KnowledgeChunkMatch {
  return value !== null
}

function isKnowledgeType(value: unknown): value is KnowledgeChunkType {
  return value === 'technique' || value === 'workflow' || value === 'motion_beat' || value === 'qa'
}

function isKnowledgeSource(value: unknown): value is KnowledgeChunkSource {
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
