// Uses the actual session route and Live client. Auth is stubbed only in this
// local diagnostic; credentials and authenticated socket URLs are never printed.
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'
const { GeminiLiveClient } = createRequire(import.meta.url)('../lib/voice-companion/gemini-live-client.ts') as typeof import('../lib/voice-companion/gemini-live-client')

async function main() {
  const source = readFileSync(new URL('../app/api/voice-companion/session/route.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const route: { GET?: () => Promise<Response> } = {}
  vm.runInNewContext(code, {
    exports: route, process, console,
    require(name: string) {
      if (name === 'server-only') return {}
      if (name === 'next/server') return { NextResponse: Response }
      if (name === '@/lib/supabase/server') return {
        createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'local-diagnostic' } }, error: null }) } }),
      }
      throw new Error(`Unexpected route dependency: ${name}`)
    },
  })

  const response = await route.GET!()
  const session = await response.json()
  if (!response.ok) throw new Error(`Session route failed: ${response.status}`)
  const override = process.argv.find((arg) => arg.startsWith('--model='))?.slice('--model='.length)
  if (override) session.model = override.startsWith('models/') ? override : `models/${override}`
  console.info(JSON.stringify({ event: 'jarvis-session-config', model: session.model, keyCount: session.keyCount }))
  let audioChunks = 0
  let audioBytes = 0
  let transcript = ''
  let settled = false
  let resolveTurn: () => void
  let rejectTurn: (error: Error) => void
  const result = new Promise<void>((resolve, reject) => { resolveTurn = resolve; rejectTurn = reject })
  const finish = (error?: Error) => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    if (error) rejectTurn(error)
    else resolveTurn()
  }
  const timer = setTimeout(() => finish(new Error('No completed voice response within 30 seconds')), 30_000)
  const client = new GeminiLiveClient(session, {
    onSetupConfirmed: () => console.info(JSON.stringify({ event: 'jarvis-setup-confirmed' })),
    onAudio: (data) => { audioChunks++; audioBytes += Buffer.from(data, 'base64').length },
    onTranscript: (text, user) => { if (!user) transcript += text },
    onTurnComplete: () => finish(audioChunks ? undefined : new Error('Turn completed without audio')),
    onError: (error) => finish(error),
    onClose: (code, reason) => finish(new Error(`Voice closed (${code}): ${reason}`)),
  })
  void client.connect().then(() => client.sendTextMessage('Say hello in one short sentence. Do not call any tools.')).catch(finish)
  try {
    await result
    console.info(JSON.stringify({ event: 'jarvis-live-audio-passed', audioChunks, audioBytes, transcript }))
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    const message = raw.replace(/([?&]key=)[^&\s)]+/gi, '$1[redacted]').replace(/AIza[\w-]+/g, '[redacted]')
    console.error(JSON.stringify({ event: 'jarvis-live-failed', message }))
    process.exitCode = 1
  } finally {
    client.disconnect()
  }
}

void main().catch(() => {
  console.error('Jarvis diagnostic could not initialize the session.')
  process.exitCode = 1
})