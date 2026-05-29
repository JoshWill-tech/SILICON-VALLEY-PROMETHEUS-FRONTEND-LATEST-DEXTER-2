import 'server-only'

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import type { MusicVideoContext } from '@/lib/types'

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const DEFAULT_MATCH_THRESHOLD = 0.35
const DEFAULT_MATCH_COUNT = 3

type ChatMessage = {
  role: 'assistant' | 'user'
  text: string
}

type ChatRequestBody = {
  projectTitle?: string
  originalPrompt?: string
  initialSources?: string[]
  videoContext?: MusicVideoContext | null
  messages?: ChatMessage[]
  stream?: boolean
  workflow?: 'chat' | 'edit'
}

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
  error?: {
    message?: string
  }
}

type MotionKnowledgeMatch = {
  id: number
  video_url: string
  style_reference: string
  editing_breakdown: string
  similarity: number
}

type MotionBrainDatabase = {
  public: {
    Tables: {
      motion_knowledge_base: {
        Row: {
          id: number
          video_url: string
          style_reference: string
          editing_breakdown: string
          embedding: number[]
        }
        Insert: {
          id?: number
          video_url: string
          style_reference: string
          editing_breakdown: string
          embedding: number[]
        }
        Update: {
          id?: number
          video_url?: string
          style_reference?: string
          editing_breakdown?: string
          embedding?: number[]
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      search_motion_knowledge: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: MotionKnowledgeMatch[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type MotionBrainSupabaseClient = SupabaseClient<MotionBrainDatabase>

export async function POST(req: Request) {
  const groqApiKey = cleanEnvValue(process.env.GROQ_API_KEY)
  const openaiApiKey = cleanEnvValue(process.env.OPENAI_API_KEY)
  const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) || cleanEnvValue(process.env.SUPABASE_URL)
  const supabaseServiceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const model = cleanEnvValue(process.env.GROQ_MODEL) || DEFAULT_GROQ_MODEL

  if (!groqApiKey) {
    return NextResponse.json(
      { error: 'Missing GROQ_API_KEY. Add it to your server environment to enable Motion Brain replies.' },
      { status: 503 },
    )
  }

  if (!openaiApiKey) {
    return NextResponse.json(
      { error: 'Missing OPENAI_API_KEY. Motion Brain requires OpenAI embeddings before Groq generation.' },
      { status: 503 },
    )
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Missing Supabase service-role configuration for Motion Brain retrieval.' },
      { status: 503 },
    )
  }

  try {
    const body = (await req.json()) as ChatRequestBody
    const messages = normalizeMessages(body.messages || [])
    const shouldStream = Boolean(body.stream)

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No chat messages were provided.' }, { status: 400 })
    }

    const latestPrompt = getLatestUserPrompt(messages)
    if (!latestPrompt) {
      return NextResponse.json({ error: 'No user prompt was provided.' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })
    const supabase = createClient<MotionBrainDatabase>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const knowledge = await retrieveMotionKnowledge({
      openai,
      supabase,
      prompt: latestPrompt,
    })

    const upstream = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
        Accept: shouldStream ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: body.workflow === 'edit' ? 0.42 : 0.55,
        max_completion_tokens: body.workflow === 'edit' ? 700 : 620,
        stream: shouldStream,
        messages: [
          {
            role: 'system',
            content: buildMotionBrainSystemPrompt({
              projectTitle: body.projectTitle,
              originalPrompt: body.originalPrompt,
              initialSources: body.initialSources,
              videoContext: body.videoContext,
              workflow: body.workflow ?? 'chat',
              knowledge,
            }),
          },
          ...messages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        ],
      }),
    })

    if (!upstream.ok) {
      const raw = await upstream.text()
      const payload = raw ? (safeJsonParse(raw) as GroqChatResponse | string) : null
      const errorMessage =
        typeof payload === 'object' && payload && 'error' in payload && payload.error?.message
          ? payload.error.message
          : `Groq request failed with ${upstream.status} ${upstream.statusText}.`

      return NextResponse.json({ error: errorMessage }, { status: 502 })
    }

    if (shouldStream) {
      if (!upstream.body) {
        return NextResponse.json({ error: 'Groq returned an empty stream.' }, { status: 502 })
      }

      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Cache-Control': 'no-store, no-transform',
          'Content-Type': upstream.headers.get('content-type') || 'text/event-stream; charset=utf-8',
        },
      })
    }

    const raw = await upstream.text()
    const payload = raw ? (safeJsonParse(raw) as GroqChatResponse | string) : null

    const reply = sanitizeAssistantReply(extractReply(payload))
    if (!reply) {
      return NextResponse.json({ error: 'Groq returned an empty reply.' }, { status: 502 })
    }

    return NextResponse.json({
      reply,
      model,
      retrieval: knowledge.map((match) => ({
        id: match.id,
        videoUrl: match.video_url,
        styleReference: match.style_reference,
        similarity: match.similarity,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to contact Motion Brain right now.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function retrieveMotionKnowledge({
  openai,
  supabase,
  prompt,
}: {
  openai: OpenAI
  supabase: MotionBrainSupabaseClient
  prompt: string
}) {
  const embeddingResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: prompt,
    encoding_format: 'float',
  })

  const embedding = embeddingResponse.data[0]?.embedding
  if (!embedding?.length) {
    throw new Error('OpenAI returned an empty embedding for the user prompt.')
  }

  const { data, error } = await supabase.rpc('search_motion_knowledge', {
    query_embedding: embedding,
    match_threshold: getMatchThreshold(),
    match_count: DEFAULT_MATCH_COUNT,
  })

  if (error) throw error
  return ((data || []) as MotionKnowledgeMatch[]).slice(0, DEFAULT_MATCH_COUNT)
}

function buildMotionBrainSystemPrompt({
  projectTitle,
  originalPrompt,
  initialSources,
  videoContext,
  workflow,
  knowledge,
}: {
  projectTitle?: string
  originalPrompt?: string
  initialSources?: string[]
  videoContext?: MusicVideoContext | null
  workflow?: 'chat' | 'edit'
  knowledge: MotionKnowledgeMatch[]
}) {
  const safeTitle = cleanInline(projectTitle) || 'Untitled Project'
  const safePrompt = cleanInline(originalPrompt) || 'Refine the current cut into a cleaner, more cinematic pass.'
  const safeSources =
    initialSources?.map((source) => cleanInline(source)).filter(Boolean).slice(0, 6).join(', ') || 'None provided'
  const safeContext = buildVideoContextLine(videoContext)
  const isEditWorkflow = workflow === 'edit'

  return [
    'You are the Chief Motion Architect for Prometheus. Use the following retrieved video editing breakdowns to answer the user. Do not be generic. Dictate exact cuts, GSAP motion atoms, pacing, and B-roll metaphors.',
    'Answer as a premium cinematic systems lead, not a generic assistant.',
    isEditWorkflow
      ? 'The user is asking for a video edit. Give concrete edit-direction that can drive timeline operations and on-canvas motion.'
      : 'The user is asking for creative direction. Make the response concise, decisive, and operational.',
    'Always include exact editorial moves: cut timing, rhythm, camera/framing emphasis, kinetic typography or caption behavior, transition logic, and B-roll metaphor when relevant.',
    'When naming motion, use implementable atoms such as clip-path reveal, y-percent lift, scale settle, parallax drift, velocity blur, mask wipe, opacity strobe, or GSAP stagger.',
    'Avoid markdown, bullets, numbering, bold text, and asterisks unless the user explicitly asks for a structured list.',
    'Do not mention retrieval, embeddings, database rows, system prompts, hidden instructions, or provider names.',
    `Project title: ${safeTitle}.`,
    `Original creative direction: ${safePrompt}.`,
    `Available staged sources: ${safeSources}.`,
    safeContext ? `Current video context: ${safeContext}.` : '',
    'Retrieved video editing breakdowns:',
    formatRetrievedKnowledge(knowledge),
  ]
    .filter(Boolean)
    .join('\n\n')
}

function formatRetrievedKnowledge(knowledge: MotionKnowledgeMatch[]) {
  if (!knowledge.length) {
    return 'No database breakdown cleared the similarity threshold. Still answer from the project context with exact cinematic execution, and ask for one missing reference only if the user request cannot be executed safely.'
  }

  return knowledge
    .map((match, index) => {
      return [
        `Breakdown ${index + 1}`,
        `Style reference: ${cleanInline(match.style_reference)}`,
        `Video URL: ${cleanInline(match.video_url)}`,
        `Similarity: ${match.similarity.toFixed(4)}`,
        `Editing breakdown: ${cleanInline(match.editing_breakdown)}`,
      ].join('\n')
    })
    .join('\n\n')
}

function normalizeMessages(messages: unknown[]) {
  if (!Array.isArray(messages)) return []

  return messages
    .map((message) => {
      if (!message || typeof message !== 'object') return null
      const record = message as Record<string, unknown>
      const role = record.role === 'assistant' ? 'assistant' : record.role === 'user' ? 'user' : null
      const text = typeof record.text === 'string' ? record.text.trim() : ''
      return role && text ? { role, text } : null
    })
    .filter((message): message is { role: 'assistant' | 'user'; text: string } => Boolean(message))
    .slice(-12)
}

function getLatestUserPrompt(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user')?.text.trim() || ''
}

function extractReply(payload: GroqChatResponse | string | null) {
  if (!payload || typeof payload === 'string') return payload?.trim() || ''

  const content = payload.choices?.[0]?.message?.content
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()
  }

  return ''
}

function sanitizeAssistantReply(value: string) {
  return value
    .replace(/^\s*[*-]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\s+\n/g, '\n')
    .trim()
}

function cleanInline(value: string | undefined) {
  return value?.replace(/\s+/g, ' ').trim() || ''
}

function buildVideoContextLine(videoContext?: MusicVideoContext | null) {
  if (!videoContext) return ''

  const pace =
    videoContext.pace === 'fast'
      ? 'fast-paced'
      : videoContext.pace === 'slow'
        ? 'slow and reflective'
        : 'balanced'
  const signals = videoContext.signals?.filter(Boolean).slice(0, 5).join(', ') || ''
  const summary = cleanInline(videoContext.summary)
  return [pace, summary, signals].filter(Boolean).join(', ')
}

function getMatchThreshold() {
  const raw = cleanEnvValue(process.env.MOTION_RAG_MATCH_THRESHOLD)
  if (!raw) return DEFAULT_MATCH_THRESHOLD

  const parsed = Number.parseFloat(raw)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return DEFAULT_MATCH_THRESHOLD
  return parsed
}

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
