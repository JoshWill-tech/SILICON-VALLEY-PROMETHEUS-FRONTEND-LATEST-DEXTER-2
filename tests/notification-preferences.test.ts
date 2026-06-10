import assert from 'node:assert/strict'

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
} from '@/lib/notifications/preference-store'

function run() {
  const normalized = normalizeNotificationPreferences({
    email: { security: false },
    inApp: { realtime: false },
  })

  assert.equal(normalized.email.marketing, DEFAULT_NOTIFICATION_PREFERENCES.email.marketing)
  assert.equal(normalized.email.security, false)
  assert.equal(normalized.email.updates, DEFAULT_NOTIFICATION_PREFERENCES.email.updates)
  assert.equal(normalized.push.browser, DEFAULT_NOTIFICATION_PREFERENCES.push.browser)
  assert.equal(normalized.inApp.realtime, false)
}

run()
