import { NextResponse } from 'next/server'
import { ProjectService } from '@/lib/projects/service'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const projects = await ProjectService.listProjectCards(req)
    return NextResponse.json({ success: true, projects })
  } catch (err) {
    console.error('[api/projects] GET error:', err)
    return NextResponse.json(
      { success: false, error: { message: err instanceof Error ? err.message : 'Failed to fetch projects' } },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient(req)
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) {
      const authHeader = req.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim()
        const { data: headerUser } = await supabase.auth.getUser(token)
        if (headerUser?.user) user = headerUser.user
      }
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    console.log('[api/projects] POST payload:', body)
    
    const project = await ProjectService.createProject({ 
      title: body.title || body.name,
      description: body.description,
      template: body.template,
      prompt: body.prompt,
      previewKind: body.previewKind,
      sourceProfile: body.sourceProfile,
      sourceAssetId: body.sourceAssetId,
      workspaceId: body.workspaceId,
    }, supabase)
    
    return NextResponse.json({ success: true, project })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create project'
    console.error('[api/projects] POST fatal error:', message, err)
    
    return NextResponse.json(
      { success: false, error: { message } },
      { status: message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
