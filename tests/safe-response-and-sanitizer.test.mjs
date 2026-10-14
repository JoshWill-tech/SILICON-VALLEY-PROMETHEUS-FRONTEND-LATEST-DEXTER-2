import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

function loadModule(path, mocks = {}) {
  const js = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', js)(
    (id) => (id in mocks ? mocks[id] : require(id)),
    module,
    module.exports,
  )
  return module.exports
}

const { safeParseApiResponse } = loadModule('lib/voice-companion/safe-response.ts')
const { sanitizeVoiceCompanionError } = loadModule('lib/voice-companion/error-sanitizer.ts')

test('safeParseApiResponse successfully parses valid JSON response', async () => {
  const mockResponse = {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ export: { id: 'job-123', status: 'pending' } }),
  }
  const result = await safeParseApiResponse(mockResponse, 'Failed')
  assert.equal(result.ok, true)
  assert.equal(result.data?.export?.id, 'job-123')
})

test('safeParseApiResponse handles HTML 504 Gateway Timeout without throwing SyntaxError', async () => {
  const html504 = '<!DOCTYPE html><html><head><title>504 Gateway Time-out</title></head><body><h1>504 Gateway Time-out</h1></body></html>'
  const mockResponse = {
    ok: false,
    status: 504,
    text: async () => html504,
  }
  const result = await safeParseApiResponse(mockResponse, 'Render failed.')
  assert.equal(result.ok, false)
  assert.equal(result.status, 504)
  assert.ok(!result.error?.includes('Unexpected token'), 'Must never leak SyntaxError or Unexpected token')
  assert.match(result.error || '', /cloud render service|queuing/i)
})

test('safeParseApiResponse handles HTML 502 Bad Gateway without throwing SyntaxError', async () => {
  const html502 = '<html><body>502 Bad Gateway</body></html>'
  const mockResponse = {
    ok: false,
    status: 502,
    text: async () => html502,
  }
  const result = await safeParseApiResponse(mockResponse, 'Render failed.')
  assert.equal(result.ok, false)
  assert.equal(result.status, 502)
  assert.ok(!result.error?.includes('Unexpected token'), 'Must never leak SyntaxError or Unexpected token')
  assert.match(result.error || '', /cloud rendering pipeline|reconnecting/i)
})

test('sanitizeVoiceCompanionError scrubs unexpected token parser errors', () => {
  const rawSyntaxError = 'SyntaxError: Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON'
  const sanitized = sanitizeVoiceCompanionError(rawSyntaxError)
  assert.ok(!sanitized.includes('Unexpected token'), 'Must remove Unexpected token')
  assert.ok(!sanitized.includes('SyntaxError'), 'Must remove SyntaxError')
  assert.ok(!sanitized.includes('JSON'), 'Must remove JSON jargon')
  assert.match(sanitized, /rendering studio|resubmit/i)
})

test('sanitizeVoiceCompanionError scrubs 504 gateway timeout and stack traces', () => {
  const rawError = 'Error: Mini-Run render returned HTTP 504. at dispatch (C:\\app\\worker.ts:42:15)'
  const sanitized = sanitizeVoiceCompanionError(rawError)
  assert.ok(!sanitized.includes('504'), 'Must remove raw status code')
  assert.ok(!sanitized.includes('at dispatch'), 'Must remove stack trace')
  assert.match(sanitized, /cloud render pipeline|status/i)
})
