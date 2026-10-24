'use client'

import { usePathname } from 'next/navigation'
import { useNetflixIntroSound } from '@/hooks/use-netflix-intro-sound'

export interface NetflixIntroSoundProps {
  volume?: number
  enabled?: boolean
}

/**
 * NetflixIntroSound
 * 
 * Plays the iconic Netflix "ta-dum" sound when an individual enters
 * Prometheus or reloads. Replays on every reload and surface entry.
 */
export function NetflixIntroSound({
  volume = 0.75,
  enabled = true,
}: NetflixIntroSoundProps) {
  const pathname = usePathname()
  useNetflixIntroSound({
    volume,
    enabled,
    pathname,
  })

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: -9999,
        left: -9999,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <audio
        id="prometheus-netflix-sound"
        src="/audio/netflix-intro.mp3"
        preload="auto"
        tabIndex={-1}
      >
        <source src="/audio/netflix-intro.mp3" type="audio/mpeg" />
        <source src="/audio/netflix-intro.ogg" type="audio/ogg" />
        <source src="/audio/netflix-intro.webm" type="audio/webm" />
      </audio>
    </div>
  )
}
