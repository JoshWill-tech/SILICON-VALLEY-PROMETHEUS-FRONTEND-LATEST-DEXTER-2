'use client'

import { usePathname } from 'next/navigation'
import { useNetflixIntroSound } from '@/hooks/use-netflix-intro-sound'

export interface NetflixIntroSoundProps {
  volume?: number
  enabled?: boolean
  landingOnly?: boolean
}

/**
 * NetflixIntroSound
 * 
 * Plays the iconic Netflix "ta-dum" sound when an individual enters
 * the Prometheus frontend. Handles modern browser autoplay policies
 * with automatic first-interaction fallback (click, pointer, keydown).
 */
export function NetflixIntroSound({
  volume = 0.75,
  enabled = true,
  landingOnly = true,
}: NetflixIntroSoundProps) {
  const pathname = usePathname()
  useNetflixIntroSound({
    volume,
    enabled,
    landingOnly,
    pathname,
  })

  return (
    <div
      aria-hidden="true"
      style={{ display: 'none', position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
    >
      <audio preload="auto" tabIndex={-1}>
        <source src="/audio/netflix-intro.mp3" type="audio/mpeg" />
        <source src="/audio/netflix-intro.ogg" type="audio/ogg" />
        <source src="/audio/netflix-intro.webm" type="audio/webm" />
      </audio>
    </div>
  )
}
