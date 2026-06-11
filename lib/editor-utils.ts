'use client'

import { MS_PER_DAY } from '@/lib/constants'

export function msToTime(ms: number) {
  const safe = Math.max(0, ms)
  const seconds = Math.floor(safe / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${`${seconds % 60}`.padStart(2, '0')}`
}

export function msToDuration(ms: number) {
  if (ms >= MS_PER_DAY) {
    return `${(ms / MS_PER_DAY).toFixed(1)}d`
  }
  return msToTime(ms)
}
