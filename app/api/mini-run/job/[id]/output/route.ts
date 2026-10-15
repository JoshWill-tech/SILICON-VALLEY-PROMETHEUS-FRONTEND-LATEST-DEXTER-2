import fs from 'node:fs'
import path from 'node:path'
import {NextResponse} from 'next/server'

import {fetchMiniRunMedia} from '@/lib/server/mini-run-delivery'
import {getMiniRunEnvironment, resolveMiniRunConfig} from '@/lib/server/mini-run-proxy'
import {createClient} from '@/lib/supabase/server'
import {isDevBypassActive} from '@/lib/supabase/dev-bypass'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const safeIdentifierPattern = /^[A-Za-z0-9._~-]+$/
const forwardedResponseHeaders = [
  'accept-ranges',
  'cache-control',
  'content-disposition',
  'content-length',
  'content-range',
  'content-type',
  'etag',
] as const

function outputUrlFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const record = payload as Record<string, unknown>
  if (typeof record.outputUrl === 'string' && record.outputUrl) return record.outputUrl
  return outputUrlFromPayload(record.returnvalue ?? record.response ?? null)
}

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  if (!safeIdentifierPattern.test(id) || id === '.' || id === '..') {
    return NextResponse.json({error: 'Invalid Mini-Run job id.'}, {status: 400})
  }

  const localDevFile = path.join(process.cwd(), 'public', 'media', 'mini-run', 'final_jeff_simons.mp4')
  if (isDevBypassActive() && (id === 'mini_run_jeff_simons_1791228687' || id.includes('jeff_simons'))) {
    if (fs.existsSync(localDevFile)) {
      const stat = fs.statSync(localDevFile)
      const range = request.headers.get('range')
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
        const chunkSize = end - start + 1
        const fileStream = fs.createReadStream(localDevFile, { start, end })
        return new Response(fileStream as unknown as BodyInit, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': 'video/mp4',
            'Cache-Control': 'no-store',
          },
        })
      }
      const fileStream = fs.createReadStream(localDevFile)
      return new Response(fileStream as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Length': String(stat.size),
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
        },
      })
    }
  }

  try {
    const supabase = await createClient()
    const [{data: {user}, error: authError}, {data: {session}}] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])
    if (!isDevBypassActive() && (authError || !user || !session?.access_token)) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const config = resolveMiniRunConfig(getMiniRunEnvironment())
    const headers = {'X-Mini-Run-User-Token': session?.access_token || ''}
    const statusUrl = `${config.baseUrl}/api/pipeline/job/${encodeURIComponent(id)}`
    const statusResponse = await fetch(statusUrl, {
      headers,
      cache: 'no-store',
    })
    const statusPayload = await statusResponse.json().catch(() => null)
    if (!statusResponse.ok) {
      return NextResponse.json(
        {error: 'Mini-Run render could not be found for this account.', status: statusResponse.status},
        {status: statusResponse.status === 404 ? 404 : statusResponse.status === 401 ? 401 : 502},
      )
    }
    const state = statusPayload && typeof statusPayload === 'object'
      ? String((statusPayload as Record<string, unknown>).state ?? (statusPayload as Record<string, unknown>).status ?? '')
      : ''
    const outputUrl = outputUrlFromPayload(statusPayload)
    if (state !== 'completed' || !outputUrl) {
      return NextResponse.json({error: 'Mini-Run output is not ready.', status: state || 'unknown'}, {status: 409})
    }

    let mediaResponse = await fetchMiniRunMedia({
      url: outputUrl,
      backendBaseUrl: config.baseUrl,
      proxyHeaders: headers,
      range: request.headers.get('range'),
      allowedHosts: process.env.MINI_RUN_OUTPUT_ALLOWED_HOSTS,
    })
    if (!mediaResponse.ok || !mediaResponse.body) {
      return NextResponse.json(
        {error: `Mini-Run output handoff returned HTTP ${mediaResponse.status}.`},
        {status: 502},
      )
    }

    if (mediaResponse.headers.get('content-type')?.includes('application/json')) {
      const payload = await mediaResponse.json()
      const outputUrl = outputUrlFromPayload(payload)
      if (!outputUrl) {
        return NextResponse.json({error: 'Mini-Run handoff returned no MP4 URL.'}, {status: 502})
      }
      mediaResponse = await fetchMiniRunMedia({
        url: outputUrl,
        backendBaseUrl: config.baseUrl,
        proxyHeaders: headers,
        range: request.headers.get('range'),
        allowedHosts: process.env.MINI_RUN_OUTPUT_ALLOWED_HOSTS,
      })
      if (!mediaResponse.ok || !mediaResponse.body) {
        return NextResponse.json(
          {error: `Mini-Run MP4 delivery returned HTTP ${mediaResponse.status}.`},
          {status: 502},
        )
      }
    }

    const responseHeaders = new Headers({'Cache-Control': 'no-store'})
    for (const name of forwardedResponseHeaders) {
      const value = mediaResponse.headers.get(name)
      if (value) responseHeaders.set(name, value)
    }
    responseHeaders.set('Cache-Control', 'private, no-store')
    if (!responseHeaders.has('content-type')) responseHeaders.set('content-type', 'video/mp4')
    if (new URL(request.url).searchParams.get('download') === '1') {
      const requested = new URL(request.url).searchParams.get('filename') || 'render.mp4'
      const filename = requested.replace(/[\\"\r\n]/g, '-').slice(0, 180) || 'render.mp4'
      responseHeaders.set('content-disposition', `attachment; filename="${filename}"`)
    } else {
      responseHeaders.set('content-disposition', 'inline')
    }

    return new Response(mediaResponse.body, {
      status: mediaResponse.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('[api/mini-run/job/output] error:', error)
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Unable to fetch Mini-Run output.'},
      {status: 502},
    )
  }
}
