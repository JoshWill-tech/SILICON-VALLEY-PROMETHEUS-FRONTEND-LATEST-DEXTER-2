import {NextResponse} from 'next/server'

import {buildMcpOAuthResourceMetadata} from '@/lib/server/mcp-oauth'
import {getSupabaseConfig} from '@/lib/supabase/config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const {url} = getSupabaseConfig()
    return NextResponse.json(buildMcpOAuthResourceMetadata({requestUrl: request.url, supabaseUrl: url}), {
      headers: {'Cache-Control': 'public, max-age=300'},
    })
  } catch {
    return NextResponse.json({error: 'MCP OAuth metadata is not configured.'}, {status: 503})
  }
}
