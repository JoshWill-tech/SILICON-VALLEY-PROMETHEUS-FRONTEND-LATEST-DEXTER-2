import { NextRequest, NextResponse } from 'next/server'
import { ExportService } from '@/lib/exports/service'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exportId } = await params
    const projectExport = await ExportService.getExport(exportId)

    return NextResponse.json({ export: projectExport })
  } catch (error: any) {
    console.error('[EXPORT_GET]', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message === 'Export not found') {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }
}
