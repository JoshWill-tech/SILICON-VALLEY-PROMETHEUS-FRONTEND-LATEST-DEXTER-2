import test from 'node:test'
import assert from 'node:assert/strict'

import {
  encryptWirePayload,
  decryptWirePayload,
  isWireShieldEnvelope,
  unwrapWirePayload,
  wrapWireResponse,
  type WireShieldEnvelope,
} from '../lib/crypto/wire-shield'

test('Wire-Shield encrypts sensitive payload into opaque high-entropy envelope', async () => {
  const sensitivePayload = {
    model: 'gemini-3.1-flash-live-preview',
    systemPrompt: 'You are an autonomous viral video editor with proprietary rules...',
    internalToolStack: ['remotion_lambda_render', 'whisper_subtitles', 'cinematic_broll_sliver'],
    tokens: {
      sessionKey: 'sk-live-secret-4928172948',
    },
    timeline: {
      cutPoints: [1.2, 4.8, 9.6],
    },
  }

  const envelope = await encryptWirePayload(sensitivePayload)

  assert.ok(isWireShieldEnvelope(envelope), 'Must be identified as WireShieldEnvelope')
  assert.equal(envelope.__shield, 1)
  assert.ok(typeof envelope.iv === 'string' && envelope.iv.length > 10)
  assert.ok(typeof envelope.data === 'string' && envelope.data.length > 20)
  assert.ok(typeof envelope.ts === 'number')
  assert.ok(typeof envelope.nonce === 'string' && envelope.nonce.length === 16)

  // Verify ZERO leak of sensitive strings in the wire payload
  const wireString = JSON.stringify(envelope)
  assert.doesNotMatch(wireString, /gemini/, 'Model name must not leak')
  assert.doesNotMatch(wireString, /proprietary/, 'System prompt must not leak')
  assert.doesNotMatch(wireString, /remotion/, 'Tool stack must not leak')
  assert.doesNotMatch(wireString, /sk-live/, 'Secret tokens must not leak')
  assert.doesNotMatch(wireString, /cutPoints/, 'Timeline keys must not leak')

  // Decrypt and verify exact fidelity
  const decrypted = await decryptWirePayload<typeof sensitivePayload>(envelope)
  assert.deepEqual(decrypted, sensitivePayload)
})

test('Wire-Shield rejects tampered ciphertext or altered IV', async () => {
  const payload = { testMessage: 'valid communication' }
  const envelope = await encryptWirePayload(payload)

  // Tamper with data ciphertext (flip characters)
  const tamperedData = envelope.data.substring(0, envelope.data.length - 4) + 'AAAA'
  const tamperedEnvelope: WireShieldEnvelope = {
    ...envelope,
    data: tamperedData,
    nonce: 'tampered-nonce-01',
  }

  await assert.rejects(
    async () => {
      await decryptWirePayload(tamperedEnvelope)
    },
    /operation failed|bad decrypt|Wire-Shield|failed/i,
    'Tampered ciphertext must be rejected by GCM tag verification'
  )
})

test('Wire-Shield blocks replay attacks and expired timestamps', async () => {
  const payload = { action: 'transfer-credits', amount: 50 }
  const envelope = await encryptWirePayload(payload)

  // First decryption succeeds
  const firstResult = await decryptWirePayload<typeof payload>(envelope)
  assert.equal(firstResult.action, 'transfer-credits')

  // Replaying the exact same envelope is blocked by nonce check
  await assert.rejects(
    async () => {
      await decryptWirePayload(envelope)
    },
    /Replay detected/i,
    'Replayed nonce must be rejected'
  )

  // Stale timestamp (older than 2 minutes) is rejected
  const expiredEnvelope: WireShieldEnvelope = {
    ...envelope,
    nonce: 'new-unique-nonce-02',
    ts: Date.now() - 300_000, // 5 minutes ago
  }

  await assert.rejects(
    async () => {
      await decryptWirePayload(expiredEnvelope)
    },
    /expired or out-of-bounds/i,
    'Expired timestamp must be rejected'
  )
})

test('unwrapWirePayload supports backward-compatible plain JSON and shielded envelopes', async () => {
  // Plain JSON passthrough
  const plainData = { regularField: 'unshielded-legacy-call' }
  const plainResult = await unwrapWirePayload<typeof plainData>(plainData)
  assert.equal(plainResult.isShielded, false)
  assert.deepEqual(plainResult.data, plainData)

  // Shielded envelope decryption
  const secureData = { secretField: 'top-secret-instruction' }
  const shieldedEnv = await encryptWirePayload(secureData)
  const shieldedResult = await unwrapWirePayload<typeof secureData>(shieldedEnv)
  assert.equal(shieldedResult.isShielded, true)
  assert.deepEqual(shieldedResult.data, secureData)
})

test('wrapWireResponse respects client shielding preferences', async () => {
  const responseData = { status: 'render_ready', url: 'https://cdn.example.com/video.mp4' }

  // Unshielded client gets plain JSON
  const unshieldedResp = await wrapWireResponse(responseData, false)
  assert.deepEqual(unshieldedResp, responseData)

  // Shielded client gets opaque WireShieldEnvelope
  const shieldedResp = await wrapWireResponse(responseData, true)
  assert.ok(isWireShieldEnvelope(shieldedResp))
  const decrypted = await decryptWirePayload<typeof responseData>(shieldedResp as WireShieldEnvelope)
  assert.deepEqual(decrypted, responseData)
})
