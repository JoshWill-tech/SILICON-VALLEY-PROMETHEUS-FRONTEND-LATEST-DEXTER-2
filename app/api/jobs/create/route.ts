import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateJobRequest } from '@/lib/types/jobs'

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateJobRequest
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    const hasAccess = subscription?.status === 'active' || subscription?.status === 'trialing'

    if (!hasAccess && process.env.NEXT_PUBLIC_DISABLE_EDITOR_BILLING_GATE !== 'true') {
      return NextResponse.json({ 
        error: 'A paid subscription is required to run AI tasks.',
        code: 'BILLING_REQUIRED'
      }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('durable_jobs')
      .insert({
        user_id: user.id,
        project_id: payload.projectId,
        type: payload.type,
        result_metadata: payload.metadata || {},
        status: 'pending',
        progress: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[Create Job Error]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
