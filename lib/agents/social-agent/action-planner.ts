import { SocialIntent } from './intent-router'
import { SocialPlatform } from '@/lib/social/types'
import { MediaMetadata } from '@/lib/media/registry'

export interface PlatformPost {
  platform: SocialPlatform
  caption: string
  status: 'draft' | 'queued' | 'posted' | 'failed'
}

export interface ActionPlan {
  projectId: string
  videoId: string
  videoTitle: string
  posts: PlatformPost[]
  suggestedCaptions: string[]
}

export function createActionPlan(
  intent: SocialIntent,
  availableMedia: MediaMetadata[]
): ActionPlan {
  let selectedVideo: MediaMetadata | undefined

  if (intent.strategy === 'specific' && intent.specificVideoId) {
    selectedVideo = availableMedia.find(p => p.id === intent.specificVideoId)
  }

  if (!selectedVideo && availableMedia.length > 0) {
    selectedVideo = [...availableMedia].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  }

  if (!selectedVideo) {
    throw new Error('No suitable video found to post.')
  }

  const suggestedCaptions = [
    `Just finished this new edit: ${selectedVideo.title}! #viral #editing`,
    `Check out my latest creation. The results are insane. 🚀`,
  ]

  const posts: PlatformPost[] = intent.platforms.map(platform => ({
    platform,
    caption: suggestedCaptions[0],
    status: 'draft'
  }))

  return {
    projectId: selectedVideo.projectId,
    videoId: selectedVideo.id,
    videoTitle: selectedVideo.title,
    posts,
    suggestedCaptions,
  }
}
