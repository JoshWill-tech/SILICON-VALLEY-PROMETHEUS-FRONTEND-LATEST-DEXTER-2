import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requestConfirmedTranscription } from '../lib/editor/request-transcription'

test('zero credits blocks transcription before confirmation or paid submission', async () => {
  let requestCount = 0
  let confirmationCount = 0
  await assert.rejects(requestConfirmedTranscription('source-a', {
    fetcher: async () => {
      requestCount += 1
      return new Response(JSON.stringify({ operation: 'transcribe', cost: 1, balance: 0, canAfford: false }), { status: 200 })
    },
    confirm: () => { confirmationCount += 1; return true },
    newRequestId: () => 'unused',
  }), /Transcription needs 1; you have 0/)
  assert.equal(requestCount, 1, 'only the quote endpoint is called')
  assert.equal(confirmationCount, 0, 'no confirmation is requested when the account cannot afford transcription')
})

test('funded transcription still waits for explicit confirmation before submission', async () => {
  let requestCount = 0
  let confirmation = ''
  const started = await requestConfirmedTranscription('source-a', {
    fetcher: async (url) => {
      requestCount += 1
      if (url.includes('/quote?')) return new Response(JSON.stringify({ operation: 'transcribe', cost: 1, balance: 2, canAfford: true }), { status: 200 })
      return new Response(JSON.stringify({ accepted: true }), { status: 202 })
    },
    confirm: (message) => { confirmation = message; return false },
    newRequestId: () => 'unused',
  })
  assert.equal(started, false)
  assert.equal(requestCount, 1, 'declining confirmation prevents the transcript POST')
  assert.match(confirmation, /1 credit.*2 credits/)
})
