import { SocialPostPlan } from '@/lib/orchestrator/social-post-orchestrator'

export const ConfirmationGuard = {
  /**
   * Validates if a plan is safe to execute and requires confirmation.
   * In a real app, this might check for sensitive keywords, platform restrictions, etc.
   */
  validate(plan: SocialPostPlan): boolean {
    if (!plan.videoId) return false
    if (plan.platforms.length === 0) return false
    
    // Always require confirmation for now as per safety rules
    return true
  },

  getSafetyWarning(plan: SocialPostPlan): string | null {
    if (plan.platforms.length > 3) {
      return "You are posting to more than 3 platforms simultaneously. Please review carefully."
    }
    return null
  }
}
