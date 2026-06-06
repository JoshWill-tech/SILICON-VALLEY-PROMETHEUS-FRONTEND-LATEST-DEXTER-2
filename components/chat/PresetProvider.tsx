// components/chat/PresetProvider.tsx
'use client'

import * as React from 'react'
import { getEffectivePreset, PresetId } from '@/lib/presets/daily-preset'
import { UserContext } from '@/types/user'

const MOCK_USER: UserContext = {
  id: 'user-123',
  firstName: 'Dexter',
  isFirstVisit: false,
  activeProjects: 2,
  lastAction: 'none'
}

interface PresetContextType {
  preset: PresetId | null
  setPreset: (preset: PresetId) => void
}

const PresetContext = React.createContext<PresetContextType | undefined>(undefined)

export function PresetProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = React.useState<PresetId | null>(null)

  React.useEffect(() => {
    setPreset(getEffectivePreset(MOCK_USER))
  }, [])

  return (
    <PresetContext.Provider value={{ preset, setPreset }}>
      {children}
    </PresetContext.Provider>
  )
}

export function usePreset() {
  const context = React.useContext(PresetContext)
  if (context === undefined) {
    throw new Error('usePreset must be used within a PresetProvider')
  }
  return context
}
