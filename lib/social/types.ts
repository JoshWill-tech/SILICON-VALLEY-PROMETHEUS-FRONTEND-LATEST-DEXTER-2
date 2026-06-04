export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'linkedin' | 'x'

export interface PublishResult {
  success: boolean;
  platform: string;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface SocialModule {
  publish(token: string, videoUrl: string, caption: string): Promise<PublishResult>;
}
