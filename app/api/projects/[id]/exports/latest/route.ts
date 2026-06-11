import { NextRequest, NextResponse } from 'next/server'
import { ExportService } from '@/lib/exports/service'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const exports = await ExportService.listProjectExports(projectId)
    
    // Return the most recent export if it exists
    const latest = exports.length > 0 ? exports[0] : null

    return NextResponse.json({ export: latest })
  } catch (error: any) {
    console.error('[EXPORT_LATEST_GET]', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }
}
