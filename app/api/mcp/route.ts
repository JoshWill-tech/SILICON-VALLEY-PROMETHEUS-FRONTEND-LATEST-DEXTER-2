import {createClient as createSupabaseClient} from '@supabase/supabase-js'
import {NextResponse} from 'next/server'

import {dispatchMiniRunRender} from '@/lib/server/mini-run-dispatch'
import {buildMcpOAuthChallenge} from '@/lib/server/mcp-oauth'
import {getMiniRunEnvironment, miniRunUserHeaders, resolveMiniRunConfig} from '@/lib/server/mini-run-proxy'
import {getSupabaseConfig} from '@/lib/supabase/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MCP_PROTOCOL_VERSION = '2025-03-26'
const SAFE_JOB_ID = /^[A-Za-z0-9._~-]+$/

const TOOLS = [
  {
    name: 'list_my_source_videos',
    description: 'List videos already uploaded to the signed-in Prometheus account. Upload videos in Prometheus first, then use the returned projectId and sourceAssetId to render.',
    inputSchema: {type: 'object', properties: {}, additionalProperties: false},
  },
  {
    name: 'create_mini_run',
    description: 'Create a vertical Mini-Run from a video already uploaded to the signed-in Prometheus account. Returns a job ID for polling.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {type: 'string'},
        sourceAssetId: {type: 'string'},
        sourceStartMs: {type: 'number', minimum: 0},
        preferredDurationSec: {type: 'number', minimum: 5, maximum: 180},
        targetChunkWords: {type: 'integer', minimum: 1, maximum: 15},
        maxChunkWords: {type: 'integer', minimum: 1, maximum: 30},
        songPolicy: {type: 'string', enum: ['auto', 'disabled']},
      },
      required: ['projectId', 'sourceAssetId'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_mini_run_job',
    description: 'Check a Mini-Run job owned by the signed-in Prometheus account. Completed jobs include the rendered MP4 URL.',
    inputSchema: {
      type: 'object',
      properties: {jobId: {type: 'string'}},
      required: ['jobId'],
      additionalProperties: false,
    },
  },
]

type JsonRpcRequest = {
  jsonrpc?: unknown
  id?: string | number | null
  method?: unknown
  params?: Record<string, unknown>
}

function rpcResult(id: string | number | null | undefined, result: unknown, status = 200) {
  return NextResponse.json({jsonrpc: '2.0', id: id ?? null, result}, {status, headers: {'Cache-Control': 'no-store'}})
}

function rpcError(id: string | number | null | undefined, code: number, message: string, status = 200) {
  return NextResponse.json({jsonrpc: '2.0', id: id ?? null, error: {code, message}}, {status, headers: {'Cache-Control': 'no-store'}})
}

function bearerToken(request: Request) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(request.headers.get('authorization') ?? '')
  return match?.[1]
}

async function authenticatedSupabase(request: Request) {
  const accessToken = bearerToken(request)
  if (!accessToken) return null
  const {url, publishableKey} = getSupabaseConfig()
  const supabase = createSupabaseClient(url, publishableKey, {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
    global: {headers: {Authorization: `Bearer ${accessToken}`}},
  })
  const {data: {user}, error} = await supabase.auth.getUser(accessToken)
  if (error || !user) return null
  return {accessToken, supabase, user}
}

function toolText(value: unknown, isError = false) {
  const text = JSON.stringify(value)
  return {content: [{type: 'text', text}], structuredContent: value, isError}
}

function finiteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

async function callTool(auth: NonNullable<Awaited<ReturnType<typeof authenticatedSupabase>>>, name: string, args: Record<string, unknown>) {
  if (name === 'list_my_source_videos') {
    const {data, error} = await auth.supabase
      .from('source_assets')
      .select('id, project_id, original_filename, mime_type, duration_ms, width, height, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', {ascending: false})
      .limit(50)
    if (error) return toolText({error: 'Could not list this account’s source videos.'}, true)
    return toolText({videos: data ?? []})
  }

  if (name === 'create_mini_run') {
    const projectId = typeof args.projectId === 'string' ? args.projectId.trim() : ''
    const sourceAssetId = typeof args.sourceAssetId === 'string' ? args.sourceAssetId.trim() : ''
    if (!projectId || !sourceAssetId) return toolText({error: 'projectId and sourceAssetId are required.'}, true)

    const {data: project} = await auth.supabase.from('projects')
      .select('id, source_asset_id')
      .eq('id', projectId)
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (!project || project.source_asset_id !== sourceAssetId) {
      return toolText({error: 'The selected video is not attached to a project owned by this account.'}, true)
    }

    const {data: asset} = await auth.supabase.from('source_assets')
      .select('id, storage_path, storage_bucket, mime_type, duration_ms, width, height')
      .eq('id', sourceAssetId)
      .eq('project_id', projectId)
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (!asset?.storage_path) return toolText({error: 'The selected video is not available for rendering.'}, true)

    const preferredDurationSec = finiteNumber(args.preferredDurationSec)
    const sourceStartMs = finiteNumber(args.sourceStartMs)
    const targetChunkWords = finiteNumber(args.targetChunkWords)
    const maxChunkWords = finiteNumber(args.maxChunkWords)
    const songPolicy = args.songPolicy === 'disabled' ? 'disabled' : 'auto'
    const result = await dispatchMiniRunRender({
      request: {
        projectId,
        sourceAssetId,
        bucket: asset.storage_bucket || process.env.R2_BUCKET_SOURCES || 'prometheus-sources',
        storagePath: asset.storage_path,
        mimeType: asset.mime_type || 'video/mp4',
        durationMs: asset.duration_ms ?? undefined,
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
        jobId: crypto.randomUUID(),
        songPolicy,
        shot: {preferredDurationSec, sourceStartMs, targetChunkWords, maxChunkWords},
      },
      env: {MINI_RUN_AWS_API_URL: process.env.MINI_RUN_AWS_API_URL},
      accessToken: auth.accessToken,
    })
    return toolText(result)
  }

  if (name === 'get_mini_run_job') {
    const jobId = typeof args.jobId === 'string' ? args.jobId.trim() : ''
    if (!SAFE_JOB_ID.test(jobId) || jobId === '.' || jobId === '..') {
      return toolText({error: 'A valid jobId is required.'}, true)
    }
    const config = resolveMiniRunConfig(getMiniRunEnvironment())
    const response = await fetch(`${config.baseUrl}/api/pipeline/job/${encodeURIComponent(jobId)}`, {
      headers: miniRunUserHeaders(auth.accessToken),
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) return toolText({error: response.status === 404 ? 'Job not found for this account.' : 'Could not read Mini-Run status.'}, true)
    return toolText(payload)
  }

  return toolText({error: `Unknown tool: ${name}`}, true)
}

export async function POST(request: Request) {
  let auth: Awaited<ReturnType<typeof authenticatedSupabase>>
  try {
    auth = await authenticatedSupabase(request)
  } catch {
    return NextResponse.json({error: 'MCP authentication is not configured.'}, {status: 503})
  }
  if (!auth) {
    return NextResponse.json({error: 'A valid Prometheus OAuth access token is required.'}, {
      status: 401,
      headers: {
        'WWW-Authenticate': buildMcpOAuthChallenge(request.url),
        'Cache-Control': 'no-store',
      },
    })
  }

  let rpc: JsonRpcRequest
  try {
    const rawBody = await request.text()
    if (rawBody.length > 256_000) {
      return rpcError(null, -32600, 'Request body is too large.', 413)
    }
    rpc = JSON.parse(rawBody) as JsonRpcRequest
  } catch {
    return rpcError(null, -32700, 'Invalid JSON.')
  }
  if (rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') {
    return rpcError(rpc.id, -32600, 'Invalid JSON-RPC request.')
  }

  if (rpc.method === 'initialize') {
    const requestedVersion = rpc.params?.protocolVersion
    return rpcResult(rpc.id, {
      protocolVersion: typeof requestedVersion === 'string' ? requestedVersion : MCP_PROTOCOL_VERSION,
      capabilities: {tools: {listChanged: false}},
      serverInfo: {name: 'prometheus-mini-run', version: '1.0.0'},
    })
  }
  if (rpc.method === 'notifications/initialized' || rpc.method === 'notifications/cancelled') {
    return new Response(null, {status: 202})
  }
  if (rpc.method === 'ping') return rpcResult(rpc.id, {})
  if (rpc.method === 'tools/list') return rpcResult(rpc.id, {tools: TOOLS})
  if (rpc.method === 'tools/call') {
    const name = rpc.params?.name
    const args = rpc.params?.arguments
    if (typeof name !== 'string' || !args || typeof args !== 'object' || Array.isArray(args)) {
      return rpcError(rpc.id, -32602, 'tools/call requires a tool name and object arguments.')
    }
    try {
      const result = await callTool(auth, name, args as Record<string, unknown>)
      return rpcResult(rpc.id, result)
    } catch (error) {
      return rpcResult(rpc.id, toolText({error: error instanceof Error ? error.message : 'Mini-Run tool failed.'}, true))
    }
  }
  return rpcError(rpc.id, -32601, `Unknown method: ${rpc.method}`)
}

export async function GET(request: Request) {
  let auth: Awaited<ReturnType<typeof authenticatedSupabase>>
  try {
    auth = await authenticatedSupabase(request)
  } catch {
    return NextResponse.json({error: 'MCP authentication is not configured.'}, {status: 503})
  }
  if (!auth) {
    return NextResponse.json({error: 'A valid Prometheus OAuth access token is required.'}, {
      status: 401,
      headers: {
        'WWW-Authenticate': buildMcpOAuthChallenge(request.url),
        'Cache-Control': 'no-store',
      },
    })
  }
  return NextResponse.json({error: 'This MCP endpoint accepts JSON-RPC POST requests.'}, {status: 405, headers: {Allow: 'POST'}})
}
