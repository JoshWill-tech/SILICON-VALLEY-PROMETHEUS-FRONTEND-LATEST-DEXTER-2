import { GoogleGenerativeAI, TaskType } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'

import type { SupabaseClient } from '@supabase/supabase-js'

const EMBEDDING_MODEL = 'gemini-embedding-2'
const EXPECTED_EMBEDDING_DIMENSIONS = 3072

type RequiredEnv = {
  GEMINI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
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
          source_url: string
          embedding: number[]
        }
        Insert: never
        Update: never
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

type CheckResult = {
  ok: boolean
  detail: string
}

loadEnvLocal()

async function main() {
  const envCheck = getRequiredEnv()

  if (!envCheck.ok) {
    printSummary({
      env: envCheck,
      gemini: { ok: false, detail: 'Skipped because environment validation failed.' },
      supabase: { ok: false, detail: 'Skipped because environment validation failed.' },
      rows: { ok: false, detail: 'Skipped because environment validation failed.' },
    })
    process.exitCode = 1
    return
  }

  const env = envCheck.env
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
  const supabase = createSupabaseClient(env)

  const [geminiCheck, supabaseReachability, rowCheck] = await Promise.all([
    verifyGemini(genAI),
    verifySupabaseReachability(supabase),
    countKnowledgeChunks(supabase),
  ])

  printSummary({
    env: envCheck,
    gemini: geminiCheck,
    supabase: supabaseReachability,
    rows: rowCheck,
  })

  if (envCheck.ok && geminiCheck.ok && supabaseReachability.ok && rowCheck.ok) {
    console.log('🚀 Ready for deployment.')
    return
  }

  process.exitCode = 1
}

function getRequiredEnv(): { ok: true; env: RequiredEnv } | { ok: false; detail: string } {
  const requiredKeys = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const
  const missing = requiredKeys.filter((key) => !process.env[key]?.trim())

  if (missing.length) {
    return {
      ok: false,
      detail: `Missing required environment variables: ${missing.join(', ')}`,
    }
  }

  const env: RequiredEnv = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!.trim(),
    SUPABASE_URL: process.env.SUPABASE_URL!.trim(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
  }

  if (!env.GEMINI_API_KEY.startsWith('AIza')) {
    return {
      ok: false,
      detail: 'GEMINI_API_KEY must start with "AIza".',
    }
  }

  if (!env.SUPABASE_URL.startsWith('https://')) {
    return {
      ok: false,
      detail: 'SUPABASE_URL must start with "https://".',
    }
  }

  return { ok: true, env }
}

async function verifyGemini(genAI: GoogleGenerativeAI): Promise<CheckResult> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
    const result = await model.embedContent({
      content: {
        role: 'user',
        parts: [{ text: 'test' }],
      },
      taskType: TaskType.RETRIEVAL_QUERY,
    })

    const dimensions = result.embedding.values.length
    if (!dimensions) {
      return { ok: false, detail: 'Gemini returned an empty embedding.' }
    }

    if (dimensions !== EXPECTED_EMBEDDING_DIMENSIONS) {
      return {
        ok: false,
        detail: `${EMBEDDING_MODEL} returned ${dimensions} dimensions; expected ${EXPECTED_EMBEDDING_DIMENSIONS}.`,
      }
    }

    return { ok: true, detail: `${EMBEDDING_MODEL} returned ${dimensions} dimensions.` }
  } catch (error) {
    return { ok: false, detail: formatError(error) }
  }
}

async function verifySupabaseReachability(supabase: RagSupabaseClient): Promise<CheckResult> {
  try {
    const { error } = await supabase.from('knowledge_chunks').select('id', { head: true, count: 'exact' })
    if (error) {
      return { ok: false, detail: error.message }
    }

    return { ok: true, detail: 'knowledge_chunks count query succeeded.' }
  } catch (error) {
    return { ok: false, detail: formatError(error) }
  }
}

async function countKnowledgeChunks(supabase: RagSupabaseClient): Promise<CheckResult> {
  try {
    const { count, error } = await supabase.from('knowledge_chunks').select('id', { head: true, count: 'exact' })
    if (error) {
      return { ok: false, detail: error.message }
    }

    const rows = count ?? 0
    return {
      ok: rows > 0,
      detail: `knowledge_chunks has ${rows} rows.`,
    }
  } catch (error) {
    return { ok: false, detail: formatError(error) }
  }
}

function printSummary(results: {
  env: { ok: boolean; detail?: string }
  gemini: CheckResult
  supabase: CheckResult
  rows: CheckResult
}) {
  console.log(results.env.ok ? '✅ All env vars present and valid.' : `❌ ${results.env.detail}`)
  console.log(results.gemini.ok ? `✅ Gemini reachable. ${results.gemini.detail}` : `❌ Gemini reachable: ${results.gemini.detail}`)
  console.log(
    results.supabase.ok
      ? `✅ Supabase reachable. ${results.supabase.detail}`
      : `❌ Supabase reachable: ${results.supabase.detail}`,
  )
  console.log(results.rows.ok ? `✅ ${results.rows.detail}` : `❌ ${results.rows.detail}`)
}

function createSupabaseClient(env: RequiredEnv): RagSupabaseClient {
  return createClient<RagDatabase>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
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

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

void main().catch((error) => {
  console.error('[fatal]', formatError(error))
  process.exitCode = 1
})
