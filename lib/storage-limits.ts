export const STORAGE_TIERS = {
  free: { label: 'Free', bytes: 100 * 1024 * 1024 * 1024 * 1024 }, // 100 TB (Unlimited Free Usage)
  creator: { label: 'Creator', bytes: 500 * 1024 * 1024 * 1024 * 1024 }, // 500 TB
  studio: { label: 'Studio', bytes: 1000 * 1024 * 1024 * 1024 * 1024 }, // 1 PB
  cinema: { label: 'Cinema', bytes: 5000 * 1024 * 1024 * 1024 * 1024 }, // 5 PB
} as const;

export type StorageTier = keyof typeof STORAGE_TIERS;

export function getStorageLimit(tier: StorageTier): number {
  return STORAGE_TIERS[tier].bytes;
}

export function formatStorage(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
  }
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export function getStorageTierFromPlan(planId: string): StorageTier {
  // Map Paddle plan IDs to tiers. Adjust these to match your actual Paddle plan IDs.
  if (planId.includes('creator')) return 'creator';
  if (planId.includes('studio')) return 'studio';
  if (planId.includes('cinema')) return 'cinema';
  return 'free';
}
