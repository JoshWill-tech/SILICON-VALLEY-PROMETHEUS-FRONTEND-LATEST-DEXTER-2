import type { BillingPlanId } from '@/lib/billing'
import { getBillingPlanDefinition } from '@/lib/billing-plans'
import { getDodoProductId } from '@/lib/dodo/config'

export const DODO_TIER_CREDITS: Record<BillingPlanId, number> = {
  creator: 150,
  studio: 600,
  cinema: 2000,
}

export function getDodoTierPriceCents(tier: BillingPlanId) {
  const plan = getBillingPlanDefinition(tier)
  const normalized = `${plan.priceWhole}${plan.priceFraction}`.replace(/[$,]/g, '')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

export function getDodoPlanConfig(tier: BillingPlanId) {
  return {
    tier,
    productId: getDodoProductId(tier),
    priceCents: getDodoTierPriceCents(tier),
    credits: DODO_TIER_CREDITS[tier],
    plan: getBillingPlanDefinition(tier),
  }
}

export function inferTierFromProductId(productId: string | null | undefined): BillingPlanId | null {
  if (!productId) return null

  if (productId === getDodoProductId('creator')) return 'creator'
  if (productId === getDodoProductId('studio')) return 'studio'
  if (productId === getDodoProductId('cinema')) return 'cinema'

  const normalized = productId.toLowerCase()
  if (normalized.includes('creator')) return 'creator'
  if (normalized.includes('studio')) return 'studio'
  if (normalized.includes('cinema')) return 'cinema'

  return null
}
