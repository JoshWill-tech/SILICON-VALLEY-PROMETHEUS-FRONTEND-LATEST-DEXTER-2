import assert from 'node:assert/strict'

import {
  deriveConnectionStatus,
  getConnectionAccountLabel,
  type ConnectionStatusInput,
} from '@/hooks/use-connection-status'

function run() {
  const base: ConnectionStatusInput = {
    accountName: '@prometheus',
    expiresAt: null,
  }

  assert.equal(deriveConnectionStatus(base), 'active')
  assert.equal(getConnectionAccountLabel(base), '@prometheus')

  const now = Date.now()
  assert.equal(
    deriveConnectionStatus({
      accountName: null,
      expiresAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    }),
    'active',
  )
  assert.equal(
    deriveConnectionStatus({
      accountName: null,
      expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
    }),
    'expiring_soon',
  )
  assert.equal(
    deriveConnectionStatus({
      accountName: null,
      expiresAt: new Date(now - 30 * 60 * 1000).toISOString(),
    }),
    'expired',
  )
}

run()
