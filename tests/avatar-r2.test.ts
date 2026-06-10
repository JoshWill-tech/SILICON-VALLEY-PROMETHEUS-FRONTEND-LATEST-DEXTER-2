import assert from 'node:assert/strict'

import { buildAvatarObjectKey, getAvatarPublicUrl } from '@/lib/r2'

function run() {
  const key = buildAvatarObjectKey('user-123', {
    now: 1_717_171_717_171,
    randomToken: 'abc123xyz',
  })

  assert.equal(key, 'avatars/user-123/1717171717171-abc123xyz.webp')

  const originalPublicUrl = process.env.R2_PUBLIC_URL
  process.env.R2_PUBLIC_URL = 'https://cdn.prometheus.app'
  assert.equal(getAvatarPublicUrl(key), 'https://cdn.prometheus.app/avatars/user-123/1717171717171-abc123xyz.webp')
  process.env.R2_PUBLIC_URL = originalPublicUrl
}

run()
