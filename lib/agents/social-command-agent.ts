import { MediaRegistry } from '@/lib/media/registry'
import { parseSocialIntent } from './social-agent/intent-router'
import { createActionPlan } from './social-agent/action-planner'

export interface AgentPlanResponse {
  intent: string
  videoTitle: string
  videoId: string
  platforms: string[]
  caption: string
  requiresConfirmation: boolean
  plan: any
}

export const SocialCommandAgent = {
  async processCommand(userId: string, command: string): Promise<AgentPlanResponse> {
    console.info(`[SocialCommandAgent] Processing command: "${command}"`)

    // 1. Fetch context (recent edits)
    const recentEdits = await MediaRegistry.getRecentEdits(userId)
    if (recentEdits.length === 0) {
      throw new Error("No recent edits found to share.")
    }

    // 2. Parse intent
    const parsedIntent = parseSocialIntent(command)

    // 3. Create plan
    // Note: createActionPlan expects Project[], but MediaRegistry returns MediaMetadata[].
    // I will cast it for now or adjust the mapping since this is a new system.
    const plan = createActionPlan(parsedIntent, recentEdits as any)

    // 4. Return structured response
    return {
      intent: parsedIntent.rawIntent,
      videoTitle: plan.videoTitle,
      videoId: plan.videoId,
      platforms: plan.posts.map(p => p.platform),
      caption: plan.posts[0]?.caption || '',
      requiresConfirmation: true,
      plan
    }
  }
}
