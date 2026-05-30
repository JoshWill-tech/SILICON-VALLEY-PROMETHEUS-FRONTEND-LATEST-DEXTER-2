// Test:
// curl -X POST http://localhost:3000/api/rag \
// -H "Content-Type: application/json" \
// -d '{"query":"How do I create smooth speed ramps in Premiere Pro?"}'

import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import type { SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const EMBEDDING_MODEL = 'embedding-001'
const CHAT_MODEL = 'gemini-flash-latest'
const EMBEDDING_DIMENSIONS = 768
const DEFAULT_MATCH_THRESHOLD = 0.7
const DEFAULT_MATCH_COUNT = 5
const MAX_CONTEXT_CHUNKS = 5
const EMPTY_ANSWER = "I don't have specific knowledge about that in my database yet."
const SYSTEM_PROMPT =
  "You are a world-class video editor. Use ONLY the provided context to answer. If the context doesn't contain the answer, say 'I don't have specific knowledge about that in my database yet.' Do not hallucinate."

type RagRequestBody = {
  query?: unknown
  match_count?: unknown
  match_threshold?: unknown
}

type RequiredEnv = {
  GEMINI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type KnowledgeChunkMatch = {
  id: number | string
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
          id: number | string
          topic: string
          content: string
          tags: string[] | null
          type: string
          source: string | null
          source_url: string
          embedding: number[]
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

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.RAG_CORS_ORIGIN?.trim() || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RagRequestBody | null
    const query = cleanInline(body?.query)

    if (!query) {
      return json({ error: 'Query is required.' }, 400)
    }

    if (query.length >= 500) {
      return json({ error: 'Query must be under 500 characters.' }, 400)
    }

    const env = getRequiredEnv()
    const matchThreshold = normalizeMatchThreshold(body?.match_threshold)
    const matchCount = normalizeMatchCount(body?.match_count)
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const supabase = createSupabaseClient(env)
    const embedding = await createQueryEmbedding(genAI, query)
    const matches = await retrieveMatches(supabase, embedding, matchThreshold, matchCount)
    const contextChunks = matches.slice(0, MAX_CONTEXT_CHUNKS)

    if (!contextChunks.length) {
      return json({
        answer: EMPTY_ANSWER,
        sources: [],
        chunks: [],
      })
    }

    const contextBlock = formatContextBlock(contextChunks)
    const answer = await createAnswer(genAI, query, contextBlock)

    return json({
      answer,
      sources: contextChunks.map((chunk) => ({
        url: chunk.source_url,
        title: chunk.topic,
        type: chunk.type,
      })),
      chunks: contextChunks.map((chunk) => ({
        topic: chunk.topic,
        content: chunk.content,
        similarity: chunk.similarity,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RAG lookup failed.'
    return json({ error: message }, 500)
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

async function retrieveMatches(
  supabase: RagSupabaseClient,
  queryEmbedding: number[],
  matchThreshold: number,
  matchCount: number,
) {
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  })

  if (error) {
    throw new Error(`Supabase match_knowledge_chunks failed: ${error.message}`)
  }

  return normalizeMatches(data || [])
}

async function createAnswer(genAI: GoogleGenerativeAI, query: string, contextBlock: string) {
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.2,
    },
  })

  const result = await model.generateContent(
    [
      'Context:',
      contextBlock,
      '',
      'User query:',
      query,
    ].join('\n'),
  )
  const answer = result.response.text().trim()

  return answer || EMPTY_ANSWER
}

function formatContextBlock(chunks: KnowledgeChunkMatch[]) {
  return chunks
    .map((chunk, index) => {
      return [
        `Chunk ${index + 1}`,
        `Topic: ${chunk.topic}`,
        `Type: ${chunk.type}`,
        `Source URL: ${chunk.source_url}`,
        `Similarity: ${chunk.similarity.toFixed(4)}`,
        `Tags: ${chunk.tags?.length ? chunk.tags.join(', ') : 'none'}`,
        `Content: ${chunk.content}`,
      ].join('\n')
    })
    .join('\n\n')
}

function normalizeMatches(values: unknown[]): KnowledgeChunkMatch[] {
  return values
    .map((value) => {
      if (!isRecord(value)) return null

      const topic = cleanInline(value.topic)
      const content = cleanInline(value.content)
      const sourceUrl = cleanInline(value.source_url)
      const type = cleanInline(value.type)
      const similarity = typeof value.similarity === 'number' ? value.similarity : Number(value.similarity)

      if (!topic || !content || !sourceUrl || !type || !Number.isFinite(similarity)) {
        return null
      }

      return {
        id: typeof value.id === 'string' || typeof value.id === 'number' ? value.id : '',
        topic,
        content,
        tags: Array.isArray(value.tags) ? value.tags.map(cleanInline).filter(Boolean) : [],
        type,
        source: cleanInline(value.source),
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

function normalizeMatchCount(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_MATCH_COUNT
  return Math.min(20, Math.max(1, Math.trunc(parsed)))
}

function normalizeMatchThreshold(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_MATCH_THRESHOLD
  return Math.min(1, Math.max(0, parsed))
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
  const geminiApiKey = cleanInline(process.env.GEMINI_API_KEY)
  const supabaseUrl = cleanInline(process.env.SUPABASE_URL)
  const supabaseServiceRoleKey = cleanInline(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const missing = [
    !geminiApiKey ? 'GEMINI_API_KEY' : '',
    !supabaseUrl ? 'SUPABASE_URL' : '',
    !supabaseServiceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : '',
  ].filter(Boolean)

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return {
    GEMINI_API_KEY: geminiApiKey,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
  }
}

function cleanInline(value: unknown) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: corsHeaders,
  })
}
