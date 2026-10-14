import {NextResponse} from 'next/server'

import {createClient} from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin
  if (request.headers.get('origin') !== requestOrigin) {
    return NextResponse.json({error: 'Cross-origin authorization decisions are not allowed.'}, {status: 403})
  }

  const form = await request.formData().catch(() => null)
  const decision = form?.get('decision')
  const authorizationId = form?.get('authorization_id')
  if ((decision !== 'approve' && decision !== 'deny') || typeof authorizationId !== 'string' || authorizationId.length < 1 || authorizationId.length > 256) {
    return NextResponse.json({error: 'Invalid OAuth consent decision.'}, {status: 400})
  }

  try {
    const supabase = await createClient()
    const [{data: {user}, error: userError}, {data: {session}}] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])
    if (userError || !user || !session?.access_token) {
      return NextResponse.json({error: 'Sign in to Prometheus before authorizing an app.'}, {status: 401})
    }

    const result = decision === 'approve'
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, {skipBrowserRedirect: true})
      : await supabase.auth.oauth.denyAuthorization(authorizationId, {skipBrowserRedirect: true})
    if (result.error || !result.data?.redirect_url) {
      return NextResponse.json({error: result.error?.message ?? 'Could not complete the OAuth decision.'}, {status: 400})
    }

    return NextResponse.redirect(result.data.redirect_url, {
      status: 303,
      headers: {'Cache-Control': 'no-store'},
    })
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : 'OAuth consent is unavailable.'}, {status: 503})
  }
}
