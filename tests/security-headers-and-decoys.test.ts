import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest, NextResponse } from 'next/server'

import {
  handleDecoyHoneypot,
  applySecurityHeaders,
  createCspNonce,
} from '../lib/server/request-security'

test('handleDecoyHoneypot traps malicious and scanner probe paths', async () => {
  const probeUrls = [
    'https://example.com/.env',
    'https://example.com/.env.production',
    'https://example.com/.git/config',
    'https://example.com/api/admin/llm-keys',
    'https://example.com/api/v1/internal/config',
    'https://example.com/wp-login.php',
    'https://example.com/actuator/health',
  ]

  for (const url of probeUrls) {
    const req = new NextRequest(url)
    const res = handleDecoyHoneypot(req)
    assert.ok(res !== null, `Probe URL ${url} must be intercepted by honeypot trap`)
    assert.equal(res.status, 404)
    const json = await res.json()
    assert.equal(json.status, 'unavailable')
    assert.match(json.traceId, /^trap-/)
    assert.equal(res.headers.get('Cache-Control'), 'no-store, max-age=0')
  }

  // Legitimate paths must NOT be trapped
  const legitUrls = [
    'https://example.com/api/mini-run/health',
    'https://example.com/editor/proj-123',
    'https://example.com/',
  ]

  for (const url of legitUrls) {
    const req = new NextRequest(url)
    const res = handleDecoyHoneypot(req)
    assert.equal(res, null, `Legitimate URL ${url} must not be trapped`)
  }
})

test('applySecurityHeaders strips server fingerprints and stack identifiers', () => {
  const baseResponse = NextResponse.json({ ok: true })
  baseResponse.headers.set('X-Powered-By', 'Next.js 16')
  baseResponse.headers.set('Server', 'Vercel / AWS Lambda')

  const nonce = createCspNonce()
  const secured = applySecurityHeaders(baseResponse, nonce)

  // Fingerprint headers must be removed / neutralized
  assert.equal(secured.headers.has('X-Powered-By'), false)
  assert.equal(secured.headers.get('Server'), 'protected')

  // Core protective headers must be set
  assert.equal(secured.headers.get('X-Frame-Options'), 'DENY')
  assert.equal(secured.headers.get('X-Content-Type-Options'), 'nosniff')
  assert.match(secured.headers.get('Strict-Transport-Security') || '', /max-age=63072000/)
  assert.match(secured.headers.get('Content-Security-Policy') || '', /default-src 'self'/)
})
