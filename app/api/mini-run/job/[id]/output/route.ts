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
  let candidate: string | null = null
  if (typeof record.outputUrl === 'string' && record.outputUrl) {
    candidate = record.outputUrl
  } else {
    candidate = outputUrlFromPayload(record.returnvalue ?? record.response ?? null)
  }
  if (!candidate) return null

  const inputProps = (record.inputProps || record.manifest) as Record<string, unknown> | undefined
  if (inputProps && typeof inputProps.videoSrc === 'string' && inputProps.videoSrc) {
    if (candidate.trim() === inputProps.videoSrc.trim()) {
      return null
    }
  }
  return candidate
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
      const isDownload = new URL(request.url).searchParams.get('download') === '1'
      const requested = new URL(request.url).searchParams.get('filename') || 'final_jeff_simons.mp4'
      const filename = requested.replace(/[\\"\r\n]/g, '-').slice(0, 180) || 'final_jeff_simons.mp4'
      const disposition = isDownload ? `attachment; filename="${filename}"` : 'inline'
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
            'Content-Disposition': disposition,
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
          'Content-Disposition': disposition,
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
    let outputUrl: string | null = null
    const statusPayload = await statusResponse.json().catch(() => null)
    if (statusResponse.ok) {
      const state = statusPayload && typeof statusPayload === 'object'
        ? String((statusPayload as Record<string, unknown>).state ?? (statusPayload as Record<string, unknown>).status ?? '')
        : ''
      outputUrl = outputUrlFromPayload(statusPayload)
      if (!outputUrl) {
        try {
          const directOutputUrl = `${config.baseUrl}/api/pipeline/job/${encodeURIComponent(id)}/output`
          const directResponse = await fetch(directOutputUrl, {
            headers,
            redirect: 'manual',
            cache: 'no-store',
          })
          if (directResponse.status === 303 && directResponse.headers.get('location')) {
            outputUrl = directResponse.headers.get('location')
          }
        } catch {
          // keep outputUrl null
        }
      }
      if ((state !== 'completed' && state !== 'done') && !outputUrl) {
        return NextResponse.json({error: 'Mini-Run output is not ready.', status: state || 'unknown'}, {status: 409})
      }
    } else if (user) {
      // Upstream lambda may have aged out the job, check persistent Supabase project_exports
      const { data: dbExport } = await supabase
        .from('project_exports')
        .select('*')
        .eq('user_id', user.id)
        .contains('metadata', { miniRunJobId: id })
        .eq('status', 'completed')
        .maybeSingle()

      const storageKey = dbExport?.storage_path || dbExport?.metadata?.r2Key
      if (storageKey) {
        const bucket = dbExport?.storage_bucket || process.env.R2_BUCKET_EXPORTS || 'prometheus-exports'
        try {
          const { getPresignedGetUrl } = await import('@/lib/r2/presigned-url')
          outputUrl = await getPresignedGetUrl(bucket, storageKey, undefined, 86400)
        } catch {
          // ignore
        }
      }
      if (!outputUrl && typeof dbExport?.metadata?.outputUrl === 'string' && dbExport.metadata.outputUrl.startsWith('http')) {
        outputUrl = dbExport.metadata.outputUrl
      }
      if (!outputUrl) {
        return NextResponse.json(
          {error: 'Mini-Run render could not be found for this account.', status: statusResponse.status},
          {status: statusResponse.status === 404 ? 404 : statusResponse.status === 401 ? 401 : 502},
        )
      }
      if (outputUrl && typeof dbExport?.metadata?.sourceUrl === 'string') {
        const sourceUrl = dbExport.metadata.sourceUrl.trim()
        if (sourceUrl && outputUrl.trim() === sourceUrl) {
          return NextResponse.json(
            {error: 'Mini-Run render failed: output matches raw source media.'},
            {status: 500},
          )
        }
      }
    } else {
      return NextResponse.json(
        {error: 'Mini-Run render could not be found for this account.', status: statusResponse.status},
        {status: statusResponse.status === 404 ? 404 : statusResponse.status === 401 ? 401 : 502},
      )
    }

    if (!outputUrl) {
      return NextResponse.json({error: 'Mini-Run output is not ready.'}, {status: 409})
    }

    let mediaResponse = await fetchMiniRunMedia({
      url: outputUrl,
      backendBaseUrl: config.baseUrl,
      proxyHeaders: headers,
      range: request.headers.get('range'),
      allowedHosts: process.env.MINI_RUN_OUTPUT_ALLOWED_HOSTS,
    })

    if (!mediaResponse.ok && user) {
      // If the upstream presigned URL has expired (e.g. 403), check for durable R2 storage
      const { data: dbExport } = await supabase
        .from('project_exports')
        .select('*')
        .eq('user_id', user.id)
        .contains('metadata', { miniRunJobId: id })
        .eq('status', 'completed')
        .maybeSingle()

      const storageKey = dbExport?.storage_path || dbExport?.metadata?.r2Key
      if (storageKey) {
        const bucket = dbExport?.storage_bucket || process.env.R2_BUCKET_EXPORTS || 'prometheus-exports'
        try {
          const { getPresignedGetUrl } = await import('@/lib/r2/presigned-url')
          const freshUrl = await getPresignedGetUrl(bucket, storageKey, undefined, 86400)
          const fallbackMedia = await fetchMiniRunMedia({
            url: freshUrl,
            backendBaseUrl: config.baseUrl,
            proxyHeaders: {},
            range: request.headers.get('range'),
            allowedHosts: process.env.MINI_RUN_OUTPUT_ALLOWED_HOSTS,
          })
          if (fallbackMedia.ok && fallbackMedia.body) {
            mediaResponse = fallbackMedia
          }
        } catch {
          // retain original mediaResponse
        }
      }
    }

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
