import { GoogleGenerativeAI } from '@google/generative-ai'
import { existsSync, readFileSync } from 'fs'

const GEMINI_MODEL = 'gemini-flash-latest'

loadEnvLocal()

async function run() {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey())
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
  const result = await model.generateContent('Reply with exactly: ok')
  const text = result.response.text().trim()

  if (!text) throw new Error('Gemini returned an empty response.')

  console.log(
    JSON.stringify(
      {
        ok: true,
        model: GEMINI_MODEL,
        response: text,
      },
      null,
      2,
    ),
  )
}

function getGeminiApiKey() {
  const value = process.env.GEMINI_API_KEY?.trim()
  if (!value) throw new Error('Missing required environment variable: GEMINI_API_KEY')
  if (!value.startsWith('AIza')) {
    throw new Error('Invalid GEMINI_API_KEY: expected a Google AI Studio API key starting with "AIza".')
  }

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

void run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
