import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
import { readFile } from 'fs/promises'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const DUMMY_MOTION_BEAT: MotionBeatInput = {
  url: 'https://www.youtube.com/watch?v=prometheus-motion-brain-demo',
  style: 'Premium cinematic SaaS launch breakdown',
  breakdown:
    'Open on a 12-frame black hold, then snap into a macro interface close-up with a clip-path reveal from 0% to 100%. Cut every 18-24 frames on percussion hits. Use GSAP yPercent lifts for captions, a 0.18s scale settle on product UI, and B-roll metaphors of glass, pressure, and velocity to make the software feel expensive.',
}

type MotionBeatInput = {
  url: string
  style: string
  breakdown: string
}

type IngestResult = {
  id: number
  video_url: string
  style_reference: string
}

loadEnvLocal()

const openai = new OpenAI({
  apiKey: getRequiredEnv('OPENAI_API_KEY'),
})

const supabase = createClient(
  getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'),
  getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function ingestMotionBeat(
  videoUrl: string,
  styleRef: string,
  breakdownText: string,
): Promise<IngestResult> {
  const cleanUrl = requireText(videoUrl, 'videoUrl')
  const cleanStyle = requireText(styleRef, 'styleRef')
  const cleanBreakdown = requireText(breakdownText, 'breakdownText')

  const embeddingResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanBreakdown,
    encoding_format: 'float',
  })

  const embedding = embeddingResponse.data[0]?.embedding
  if (!embedding?.length) {
    throw new Error('OpenAI returned an empty embedding.')
  }

  const { data, error } = await supabase
    .from('motion_knowledge_base')
    .insert({
      video_url: cleanUrl,
      style_reference: cleanStyle,
      editing_breakdown: cleanBreakdown,
      embedding,
    })
    .select('id, video_url, style_reference')
    .single()

  if (error) throw error
  if (!data) throw new Error('Supabase insert succeeded without returning a row.')

  return data as IngestResult
}

async function runCli() {
  const input = await readInput(process.argv.slice(2))
  const rows = Array.isArray(input) ? input : [input]

  const results: IngestResult[] = []
  for (const row of rows) {
    results.push(await ingestMotionBeat(row.url, row.style, row.breakdown))
  }

  console.log(
    JSON.stringify(
      {
        ingested: results.length,
        rows: results,
      },
      null,
      2,
    ),
  )
}

async function readInput(args: string[]): Promise<MotionBeatInput | MotionBeatInput[]> {
  if (args.length === 0) {
    return DUMMY_MOTION_BEAT
  }

  const filePath = getArgValue(args, '--file')
  if (filePath) {
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw) as MotionBeatInput | MotionBeatInput[]
    validateInputShape(parsed)
    return parsed
  }

  const directInput = {
    url: getArgValue(args, '--url') || '',
    style: getArgValue(args, '--style') || '',
    breakdown: getArgValue(args, '--breakdown') || '',
  }

  validateInputShape(directInput)
  return directInput
}

function validateInputShape(value: MotionBeatInput | MotionBeatInput[]): asserts value is MotionBeatInput | MotionBeatInput[] {
  const rows = Array.isArray(value) ? value : [value]
  if (!rows.length) throw new Error('Input file must contain at least one motion beat.')

  rows.forEach((row, index) => {
    try {
      requireText(row.url, `input[${index}].url`)
      requireText(row.style, `input[${index}].style`)
      requireText(row.breakdown, `input[${index}].breakdown`)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : `Invalid input row at index ${index}.`)
    }
  })
}

function getArgValue(args: string[], name: string) {
  const index = args.indexOf(name)
  if (index === -1) return null
  const value = args[index + 1]?.trim()
  return value || null
}

function requireText(value: string | undefined, label: string) {
  const trimmed = value?.replace(/\s+/g, ' ').trim()
  if (!trimmed) throw new Error(`Missing required ${label}.`)
  return trimmed
}

function getRequiredEnv(primary: string, fallback?: string) {
  const value = process.env[primary]?.trim() || (fallback ? process.env[fallback]?.trim() : undefined)
  if (!value) {
    throw new Error(`Missing required environment variable: ${fallback ? `${primary} or ${fallback}` : primary}`)
  }
  return value
}

function loadEnvLocal() {
  if (!existsSync('.env.local')) return

  const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

if (process.argv[1]?.endsWith('ingest-motion.ts') || process.argv[1]?.endsWith('ingest-motion.js')) {
  void runCli().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
