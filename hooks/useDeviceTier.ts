'use client';

import { useState, useEffect } from 'react';

export type DeviceTier = 'premium' | 'standard' | 'lite';

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('prometheus:device-tier') as DeviceTier | null;
      if (cached) return cached;
    }
    return 'standard';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip if already cached in state
    const cached = sessionStorage.getItem('prometheus:device-tier');
    if (cached) return;

    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 2;
    const isLowPower = /Android [4-9]|iPhone OS 1[0-2]/.test(navigator.userAgent);

    let detected: DeviceTier = 'standard';
    if (memory >= 8 && cores >= 6 && !isLowPower) {
      detected = 'premium';
    } else if (memory >= 4 && cores >= 4) {
      detected = 'standard';
    } else {
      detected = 'lite';
    }

    if (detected !== tier) {
      sessionStorage.setItem('prometheus:device-tier', detected);
      setTier(detected);
    }
  }, [tier]);

  return tier;
}
