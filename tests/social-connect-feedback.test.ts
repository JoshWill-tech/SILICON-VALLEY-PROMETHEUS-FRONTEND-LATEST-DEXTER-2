import assert from 'node:assert/strict'
import { test } from 'node:test'

test('OAuth connect reports initiation, cancellation, unavailable providers, and invalid state', async () => {
  const fs = await import('node:fs/promises')
  const page = await fs.readFile(new URL('../app/settings/social-accounts/page.tsx', import.meta.url), 'utf8')
  const initiate = await fs.readFile(new URL('../app/api/oauth/[provider]/initiate/route.ts', import.meta.url), 'utf8')
  const callback = await fs.readFile(new URL('../app/api/oauth/[provider]/callback/route.ts', import.meta.url), 'utf8')
  assert.match(page, /setConnectingProvider\(provider\)/)
  assert.match(page, /window\.location\.assign\(payload\.url\)/)
  assert.match(page, /authorization was canceled/)
  assert.match(page, /not configured for this deployment/)
  assert.match(page, /invalid security state/)
  assert.match(initiate, /responseMode: "json" \| "redirect"/)
  assert.match(initiate, /integration_unavailable/)
  assert.match(callback, /error === 'access_denied' \? 'access_denied'/)
})
