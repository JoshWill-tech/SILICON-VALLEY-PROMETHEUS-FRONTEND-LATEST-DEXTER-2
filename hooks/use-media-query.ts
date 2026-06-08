'use client'

import { useMediaQuery as useExistingMediaQuery } from '@/hooks/useMediaQuery'

export function useMediaQuery(query: string) {
  return useExistingMediaQuery(query)
}
