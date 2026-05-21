import { SocialPlatform } from '@/lib/social/types'

export type SocialPostStrategy = 'latest' | 'best' | 'specific'

export interface SocialIntent {
  platforms: SocialPlatform[]
  strategy: SocialPostStrategy
  specificVideoId?: string
  rawIntent: string
}

const PLATFORM_MAP: Record<string, SocialPlatform> = {
  youtube: 'youtube',
  yt: 'youtube',
  tiktok: 'tiktok',
  tt: 'tiktok',
  instagram: 'instagram',
  ig: 'instagram',
  reels: 'instagram',
  facebook: 'facebook',
  fb: 'facebook',
  twitter: 'x',
  x: 'x',
  linkedin: 'linkedin',
  li: 'linkedin',
}

/**
 * Parses a user's natural language intent into a structured social distribution request.
 */
export function parseSocialIntent(intent: string): SocialIntent {
  const lowerIntent = intent.toLowerCase()
  const platforms: SocialPlatform[] = []

  Object.entries(PLATFORM_MAP).forEach(([key, value]) => {
    if (lowerIntent.includes(key) && !platforms.includes(value)) {
      platforms.push(value)
    }
  })

  if (lowerIntent.includes('everywhere') || lowerIntent.includes('all platforms')) {
    platforms.push('youtube', 'tiktok', 'instagram', 'facebook', 'linkedin', 'x')
  }

  let strategy: SocialPostStrategy = 'latest'
  if (lowerIntent.includes('best') || lowerIntent.includes('top')) {
    strategy = 'best'
  }
  
  const videoIdMatch = intent.match(/video\s+([a-zA-Z0-9_-]+)/i)
  let specificVideoId: string | undefined
  if (videoIdMatch) {
    strategy = 'specific'
    specificVideoId = videoIdMatch[1]
  }

  return {
    platforms: platforms.length > 0 ? platforms : ['youtube', 'tiktok'],
    strategy,
    specificVideoId,
    rawIntent: intent,
  }
}
