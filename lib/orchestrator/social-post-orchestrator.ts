import { getSocialModule } from '@/lib/social'
import { SocialPlatform, PublishResult } from '@/lib/social/types'
import { MediaRegistry } from '@/lib/media/registry'

export interface SocialPostPlan {
  videoId: string
  platforms: SocialPlatform[]
  caption: string
  scheduledAt?: string
}

export interface OrchestrationResult {
  overallStatus: 'success' | 'partial_success' | 'failed'
  results: PublishResult[]
}

export const SocialPostOrchestrator = {
  async executePlan(userId: string, plan: SocialPostPlan): Promise<OrchestrationResult> {
    console.info('[Orchestrator] Executing social post plan...', plan)

    // 1. Validate video exists and user has access
    const edits = await MediaRegistry.getRecentEdits(userId)
    const video = edits.find(e => e.id === plan.videoId)

    if (!video) {
      throw new Error(`Video with ID ${plan.videoId} not found or unauthorized.`)
    }

    // 2. Prepare execution
    const results: PublishResult[] = []

    // 3. Execute parallel uploads and publishing
    const publishPromises = plan.platforms.map(async (platform) => {
      try {
        const socialModule = getSocialModule(platform)
        
        // Auth check (mock)
        const authenticated = await socialModule.authenticate()
        if (!authenticated) {
          return { success: false, platform, error: 'Authentication failed' }
        }

        // Upload
        const uploadId = await socialModule.uploadVideo(video.url, { title: video.title })
        
        // Publish
        return await socialModule.publish(uploadId, plan.caption)
      } catch (error) {
        console.error(`[Orchestrator] Failed to post to ${platform}:`, error)
        return { 
          success: false, 
          platform, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    })

    const executionResults = await Promise.all(publishPromises)
    results.push(...executionResults)

    const overallStatus = results.every(r => r.success) 
      ? 'success' 
      : results.some(r => r.success) ? 'partial_success' : 'failed'

    return {
      overallStatus,
      results
    }
  }
}
