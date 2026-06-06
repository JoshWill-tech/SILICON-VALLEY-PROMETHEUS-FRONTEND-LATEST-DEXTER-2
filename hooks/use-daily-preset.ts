'use client';

import { useEffect, useState } from 'react';
import { getEffectivePreset, PresetId, PRESETS } from '@/lib/presets/daily-preset';
import { UserContext } from '@/types/user';

const MOCK_USER: UserContext = {
  id: 'user-123',
  firstName: 'Dexter',
  isFirstVisit: false,
  activeProjects: 2,
  lastAction: 'none'
};

export function useDailyPreset(): PresetId {
  const [preset, setPreset] = useState<PresetId>(PRESETS[0]);

  useEffect(() => {
    setPreset(getEffectivePreset(MOCK_USER));
  }, []);

  return preset;
}
