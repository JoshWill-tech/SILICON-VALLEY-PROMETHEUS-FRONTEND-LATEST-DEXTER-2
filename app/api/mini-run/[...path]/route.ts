import {NextResponse} from 'next/server'

import {getMiniRunEnvironment, proxyMiniRunRequest} from '@/lib/server/mini-run-proxy'
import {createClient} from '@/lib/supabase/server'
import {isDevBypassActive} from '@/lib/supabase/dev-bypass'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {params: Promise<{path: string[]}>}

async function handleMiniRun(request: Request, params: {path: string[]}) {
  const rawPath = params.path || []
  const joinedPath = rawPath.join('/')
  const isHealthCheck = request.method.toUpperCase() === 'GET' && joinedPath === 'health'
  let accessToken: string | undefined

  if (isDevBypassActive() && joinedPath === 'api/pipeline/job/mini_run_jeff_simons_1791228687') {
    return NextResponse.json({
      ok: true,
      jobId: 'mini_run_jeff_simons_1791228687',
      pipelineJobId: 'modal_run_jeff_simons_1791228687',
      status: 'completed',
      state: 'completed',
      progressPercent: 100,
      outputUrl: '/api/mini-run/job/mini_run_jeff_simons_1791228687/output',
      chunkCount: 30,
    })
  }

  // Pipeline execution endpoints must be protected: verify authenticated session
  if (!isHealthCheck) {
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()

      if (error || !user || !session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      accessToken = session.access_token
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const env = getMiniRunEnvironment()

  try {
    return await proxyMiniRunRequest({
      request,
      pathSegments: params.path,
      accessToken,
      env,
    })
  } catch (error) {
    console.error('[api/mini-run] proxy error:', error)
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Mini-Run proxy failed.'},
      {status: 500},
    )
  }
}

export async function GET(request: Request, context: RouteContext) {
  return handleMiniRun(request, await context.params)
}

export async function POST(request: Request, context: RouteContext) {
  return handleMiniRun(request, await context.params)
}

export async function HEAD(request: Request, context: RouteContext) {
  return handleMiniRun(request, await context.params)
}
