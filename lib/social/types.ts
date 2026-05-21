export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'linkedin' | 'x'

export interface PublishResult {
  success: boolean
  platform: SocialPlatform
  postId?: string
  postUrl?: string
  error?: string
}

export interface SocialModule {
  authenticate(): Promise<boolean>
  uploadVideo(videoUrl: string, metadata: any): Promise<string>
  publish(uploadId: string, caption: string): Promise<PublishResult>
  validateResponse(response: any): boolean
}
