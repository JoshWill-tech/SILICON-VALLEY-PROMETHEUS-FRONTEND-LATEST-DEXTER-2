import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
const { getMediaFailureMessage } = createRequire(import.meta.url)('../lib/media/feedback.ts')

for (const message of [
  'Gemini Server Error: RESOURCE_EXHAUSTED: quota exceeded',
  'Gemini Live connection closed (code 1008: Quota exceeded for quota metric)',
  'Gemini Server Error: 429 Too many requests',
]) {
  test(`quota failures explain the provider usage limit: ${message}`, () => {
    const result = getMediaFailureMessage(new Error(message))
    assert.match(result, /usage limit|quota|rate limit/i)
    assert.match(result, /billing|reset|later/i)
  })
}

test('retired model failure explains service configuration rather than quota', () => {
  const result = getMediaFailureMessage(new Error('Gemini Live connection closed (code 1008: models/gemini-2.0-flash-exp is not found or is not supported for bidiGenerateContent)'))
  assert.match(result, /model.*unavailable|model.*supported|configuration/i)
  assert.doesNotMatch(result, /usage limit|quota/i)
})

test('invalid credentials have a distinct service configuration message', () => {
  assert.match(getMediaFailureMessage(new Error('Gemini Server Error: API key not valid. Please pass a valid API key.')), /credentials|configuration/i)
})

test('microphone denial stays actionable', () => {
  assert.match(getMediaFailureMessage(new DOMException('Permission denied', 'NotAllowedError')), /Allow microphone access/)
})

test('generic network failure does not claim exhausted tokens', () => {
  const result = getMediaFailureMessage(new Error('Gemini Live WebSocket connection failed. Verify the network connection and server credentials.'))
  assert.match(result, /connection|network/i)
  assert.doesNotMatch(result, /usage limit|quota|tokens exhausted/i)
})
