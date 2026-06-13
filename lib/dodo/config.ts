export function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function getDodoEnvironment(): 'test' | 'live' {
  return cleanEnvValue(process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT) === 'live_mode' ? 'live' : 'test'
}

export function getDodoServerEnvironment(): 'test_mode' | 'live_mode' {
  return cleanEnvValue(process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT) === 'live_mode'
    ? 'live_mode'
    : 'test_mode'
}

export function getDodoApiKey() {
  const apiKey = cleanEnvValue(process.env.DODO_PAYMENTS_API_KEY)

  if (!apiKey) {
    throw new Error('Dodo Payments is not configured. Add DODO_PAYMENTS_API_KEY to .env.local.')
  }

  return apiKey
}

export function getDodoWebhookSecret() {
  const secret = cleanEnvValue(process.env.DODO_PAYMENTS_WEBHOOK_SECRET)

  if (!secret) {
    throw new Error('Dodo webhook is not configured. Add DODO_PAYMENTS_WEBHOOK_SECRET to .env.local.')
  }

  return secret
}

export function getDodoWebhookUrl() {
  return cleanEnvValue(process.env.DODO_PAYMENTS_WEBHOOK_URL) ?? null
}

export function getDodoProductIdEnvName(tier: 'creator' | 'studio' | 'cinema') {
  if (tier === 'creator') return 'DODO_CREATOR_PRODUCT_ID'
  if (tier === 'studio') return 'DODO_STUDIO_PRODUCT_ID'
  return 'DODO_CINEMA_PRODUCT_ID'
}

export function getDodoProductId(tier: 'creator' | 'studio' | 'cinema') {
  return cleanEnvValue(process.env[getDodoProductIdEnvName(tier)]) ?? null
}
