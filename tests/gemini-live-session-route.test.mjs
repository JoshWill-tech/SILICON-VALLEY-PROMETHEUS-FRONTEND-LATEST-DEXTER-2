import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../app/api/voice-companion/session/route.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

async function sessionFor(model, user = { id: 'test-user' }) {
  const exports = {}
  vm.runInNewContext(code, {
    exports, process: { env: { GEMINI_API_KEY: 'test-key-for-runtime', ...(model === undefined ? {} : { GEMINI_LIVE_MODEL: model }) } },
    require(name) {
      if (name === 'server-only') return {}
      if (name === 'next/server') return { NextResponse: Response }
      if (name === '@/lib/supabase/server') return { createClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) } }) }
      throw new Error(`Unexpected route dependency: ${name}`)
    },
  })
  return exports.GET()
}

const supported = new Set(['models/gemini-3.8-live', 'models/gemini-3.1-flash-live-preview', 'models/gemini-2.5-flash-native-audio-preview-12-2025'])
for (const override of [undefined, '', '  ', 'gemini-2.0-flash-exp', 'models/gemini-2.0-flash-live-001', 'invalid-model']) {
  test(`session rejects retired/invalid overrides: ${JSON.stringify(override)}`, async () => {
    const response = await sessionFor(override)
    assert.equal(response.status, 200)
    const data = await response.json()
    assert.ok(supported.has(data.model), `Selected unusable Live model: ${data.model}`)
    assert.ok(data.candidateModels.every((model) => supported.has(model)))
    assert.equal(new Set(data.candidateModels).size, data.candidateModels.length)
  })
}

for (const override of ['gemini-3.8-live', ' models/gemini-3.1-flash-live-preview ', 'gemini-2.5-flash-native-audio-preview-12-2025']) {
  test(`supported model override is normalized: ${override}`, async () => {
    const data = await (await sessionFor(override)).json()
    assert.equal(data.model, override.trim().startsWith('models/') ? override.trim() : `models/${override.trim()}`)
  })
}

test('voice session still requires authentication before returning credentials', async () => {
  const response = await sessionFor(undefined, null)
  assert.equal(response.status, 401)
  assert.equal((await response.json()).wsUrl, undefined)
})
