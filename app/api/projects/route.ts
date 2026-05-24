import { NextResponse } from 'next/server'
import { ProjectService } from '@/lib/projects/service'

export async function GET() {
  try {
    const projects = await ProjectService.listProjects()
    return NextResponse.json({ projects })
  } catch (err) {
    console.error('[api/projects] GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch projects' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    console.log('[api/projects] POST payload:', body)
    
    const project = await ProjectService.createProject({ 
      title: body.title,
      previewKind: body.previewKind,
      sourceProfile: body.sourceProfile,
      sourceAssetId: body.sourceAssetId,
      workspaceId: body.workspaceId,
    })
    
    return NextResponse.json({ project })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create project'
    console.error('[api/projects] POST fatal error:', message, err)
    
    return NextResponse.json(
      { error: message },
      { status: message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
