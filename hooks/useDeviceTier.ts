'use client';

import { useState, useEffect } from 'react';

export type DeviceTier = 'low' | 'medium' | 'high';

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('prometheus:tier') as DeviceTier | null;
      if (cached) return cached;
    }
    return 'medium';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip if already cached in state
    const cached = sessionStorage.getItem('prometheus:tier');
    if (cached) return;

    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as any).deviceMemory || 4;

    let detected: DeviceTier = 'medium';
    if (cores <= 4 || mem <= 4) detected = 'low';
    else if (cores >= 8 && mem >= 8) detected = 'high';

    if (detected !== tier) {
      sessionStorage.setItem('prometheus:tier', detected);
      setTier(detected);
    }
  }, [tier]);

  return tier;
}
