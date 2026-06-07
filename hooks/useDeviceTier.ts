'use client';

import { useState, useEffect } from 'react';

export type DeviceTier = 'low' | 'medium' | 'high';

function detectDeviceTier(): DeviceTier {
  if (typeof navigator === 'undefined') return 'medium';

  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const ua = navigator.userAgent.toLowerCase();
  const isKnownLowEnd = /tecno|techno|infinix|itel/.test(ua);

  if (isKnownLowEnd || cores <= 4 || mem <= 4) return 'low';
  if (cores >= 8 && mem >= 8) return 'high';
  return 'medium';
}

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

    const detected = detectDeviceTier();

    if (detected !== tier) {
      sessionStorage.setItem('prometheus:tier', detected);
      setTier(detected);
    }
  }, [tier]);

  return tier;
}
