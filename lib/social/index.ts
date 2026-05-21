import { SocialPlatform, SocialModule } from './types'
import { YouTubeModule } from './youtube'
import { TikTokModule } from './tiktok'
import { InstagramModule } from './instagram'
import { FacebookModule } from './facebook'
import { LinkedInModule } from './linkedin'
import { XModule } from './x'

export function getSocialModule(platform: SocialPlatform): SocialModule {
  switch (platform) {
    case 'youtube':
      return YouTubeModule
    case 'tiktok':
      return TikTokModule
    case 'instagram':
      return InstagramModule
    case 'facebook':
      return FacebookModule
    case 'linkedin':
      return LinkedInModule
    case 'x':
      return XModule
    default:
      throw new Error(`Unsupported social platform: ${platform}`)
  }
}

export * from './types'
export { YouTubeModule } from './youtube'
export { TikTokModule } from './tiktok'
export { InstagramModule } from './instagram'
export { FacebookModule } from './facebook'
export { LinkedInModule } from './linkedin'
export { XModule } from './x'
