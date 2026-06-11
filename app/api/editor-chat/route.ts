import { POST as handleMotionBrainPost } from '@/lib/motion-brain/chat-route'

export const runtime = 'nodejs'

export function POST(req: Request) {
  return handleMotionBrainPost(req)
}
