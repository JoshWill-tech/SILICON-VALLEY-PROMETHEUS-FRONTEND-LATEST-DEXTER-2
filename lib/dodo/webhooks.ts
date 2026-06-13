import 'server-only'

import type { Webhooks } from 'dodopayments/resources/webhooks'

import { getDodoClient } from '@/lib/dodo/client'
import { getDodoWebhookSecret } from '@/lib/dodo/config'

export type DodoWebhookHeaders = {
  'webhook-id': string
  'webhook-signature': string
  'webhook-timestamp': string
}

export function verifyWebhookSignature(payload: string, signature: string | null, secret?: string | null) {
  const key = secret ?? getDodoWebhookSecret()
  if (!signature) return false

  try {
    getDodoClient().webhooks.unwrap(payload, {
      key,
      headers: {
        'webhook-id': 'synthetic',
        'webhook-signature': signature,
        'webhook-timestamp': String(Math.floor(Date.now() / 1000)),
      },
    })
    return true
  } catch {
    return false
  }
}

export function unwrapDodoWebhookEvent(payload: string, headers: DodoWebhookHeaders) {
  return getDodoClient().webhooks.unwrap(payload, {
    key: getDodoWebhookSecret(),
    headers,
  })
}

export function getDodoWebhookHeaders(request: Request): DodoWebhookHeaders | null {
  const webhookId = request.headers.get('webhook-id')
  const signature = request.headers.get('webhook-signature')
  const timestamp = request.headers.get('webhook-timestamp')

  if (!webhookId || !signature || !timestamp) return null

  return {
    'webhook-id': webhookId,
    'webhook-signature': signature,
    'webhook-timestamp': timestamp,
  }
}

export type DodoWebhookEvent = Webhooks.UnwrapWebhookEvent
