import { readLocalStorageJSON, writeLocalStorageJSON } from '@/lib/storage'
import type { StorageTier } from '@/lib/storage-limits'

export const USER_STORAGE_TIER_STORAGE_KEY = 'prometheus.user-storage-tier.v1'
export const USER_STORAGE_TIER_UPDATED_EVENT = 'prometheus:user-storage-tier-updated'

export function readUserStorageTier(): StorageTier {
  const stored = readLocalStorageJSON<StorageTier>(USER_STORAGE_TIER_STORAGE_KEY)
  if (stored === 'creator' || stored === 'studio' || stored === 'cinema') return stored
  return 'free'
}

export function updateUserStorageTier(tier: StorageTier) {
  writeLocalStorageJSON<StorageTier>(USER_STORAGE_TIER_STORAGE_KEY, tier)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(USER_STORAGE_TIER_UPDATED_EVENT, { detail: { tier } }))
  }
}
