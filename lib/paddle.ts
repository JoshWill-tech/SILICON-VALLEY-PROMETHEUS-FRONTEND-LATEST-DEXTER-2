import 'server-only'

import { Environment, Paddle } from '@paddle/paddle-node-sdk'

import type { BillingPlanId } from '@/lib/billing'

const PADDLE_PRICE_ID_ENV_NAMES: Record<BillingPlanId, string> = {
  creator: 'PADDLE_CREATOR_PRICE_ID',
  studio: 'PADDLE_STUDIO_PRICE_ID',
  cinema: 'PADDLE_CINEMA_PRICE_ID',
}

let paddleClient: Paddle | null = null

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function getPaddleClient() {
  const apiKey = cleanEnvValue(process.env.PADDLE_API_KEY)
  const environment = cleanEnvValue(process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT) === 'production' 
    ? Environment.production 
    : Environment.sandbox

  if (!apiKey) {
    throw new Error('Paddle is not configured. Add PADDLE_API_KEY to .env.local.')
  }

  if (!paddleClient) {
    paddleClient = new Paddle(apiKey, {
      environment,
    })
  }

  return paddleClient
}

export function getPaddlePriceEnvName(planId: BillingPlanId) {
  return PADDLE_PRICE_ID_ENV_NAMES[planId]
}

export function getPaddlePriceId(planId: BillingPlanId) {
  return cleanEnvValue(process.env[getPaddlePriceEnvName(planId)]) ?? null
}

export function getPaddleWebhookSecret() {
  const webhookSecret = cleanEnvValue(process.env.PADDLE_WEBHOOK_SECRET)

  if (!webhookSecret) {
    throw new Error('Paddle webhook is not configured. Add PADDLE_WEBHOOK_SECRET to .env.local.')
  }

  return webhookSecret
}

export function getPaddleClientToken() {
  const clientToken = cleanEnvValue(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN)

  if (!clientToken) {
    throw new Error('Paddle client token is not configured. Add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN to .env.local.')
  }

  return clientToken
}

export function getPaddleEnvironment(): 'sandbox' | 'production' {
  return cleanEnvValue(process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT) === 'production' 
    ? 'production' 
    : 'sandbox'
}
