'use client';

import { useSyncExternalStore } from 'react';

export type DeviceTier = 'low' | 'medium' | 'high';

const DEFAULT_TIER: DeviceTier = 'medium';
const STORAGE_KEY = 'prometheus:tier';

function detectDeviceTier(): DeviceTier {
  if (typeof navigator === 'undefined') return DEFAULT_TIER;

  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const ua = navigator.userAgent.toLowerCase();
  const isKnownLowEnd = /tecno|techno|infinix|itel/.test(ua);

  if (isKnownLowEnd || cores <= 4 || mem <= 4) return 'low';
  if (cores >= 8 && mem >= 8) return 'high';
  return 'medium';
}

function isDeviceTier(value: string | null): value is DeviceTier {
  return value === 'low' || value === 'medium' || value === 'high';
}

function getStoredTier(): DeviceTier {
  if (typeof window === 'undefined') return DEFAULT_TIER;

  const cached = sessionStorage.getItem(STORAGE_KEY);
  return isDeviceTier(cached) ? cached : DEFAULT_TIER;
}

function getServerTier(): DeviceTier {
  return DEFAULT_TIER;
}

function subscribeToDeviceTier(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (!isDeviceTier(cached)) {
    sessionStorage.setItem(STORAGE_KEY, detectDeviceTier());
    queueMicrotask(onStoreChange);
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(subscribeToDeviceTier, getStoredTier, getServerTier);
}
