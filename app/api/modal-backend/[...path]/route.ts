import {NextResponse} from 'next/server'

import {proxyMiniRunRequest} from '@/lib/server/mini-run-proxy'
import {createClient} from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {params: Promise<{path: string[]}>}

async function handle(request: Request, context: RouteContext) {
  const {path} = await context.params
  const isHealthCheck = request.method.toUpperCase() === 'GET' && path.join('/') === 'health'
  let accessToken: string | undefined

  if (!isHealthCheck) {
    try {
      const supabase = await createClient()
      const [{data: {user}, error}, {data: {session}}] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ])
      if (error || !user || !session?.access_token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401})
      }
      accessToken = session.access_token
    } catch {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }
  }

  try {
    return await proxyMiniRunRequest({
      request,
      pathSegments: path,
      accessToken,
      env: {MINI_RUN_AWS_API_URL: process.env.MINI_RUN_AWS_API_URL || process.env.MINI_RUN_BACKEND_URL},
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mini-Run request failed.'
    const status = message.includes('required') || message.includes('must use HTTPS') ? 503 : 502
    return NextResponse.json({error: message}, {status})
  }
}

export const GET = handle
export const POST = handle
