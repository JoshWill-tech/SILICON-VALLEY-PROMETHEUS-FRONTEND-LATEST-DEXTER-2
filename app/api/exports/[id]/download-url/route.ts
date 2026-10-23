import { NextRequest, NextResponse } from 'next/server'
import { ExportService } from '@/lib/exports/service'
import { ProjectService } from '@/lib/projects/service'
import { getPresignedGetUrl } from '@/lib/r2/presigned-url'
import { sanitizeFilename } from '@/lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exportId } = await params
    
    // 1. Fetch export metadata and verify ownership
    const projectExport = await ExportService.getExport(exportId, req)

    const miniRunJobId = typeof projectExport.metadata?.miniRunJobId === 'string' ? projectExport.metadata.miniRunJobId : null
    if (projectExport.status !== 'completed' || (!projectExport.storagePath && !miniRunJobId)) {
      return NextResponse.json(
        { error: 'Export not ready', status: projectExport.status },
        { status: 400 }
      )
    }

    const project = await ExportService.getExportProject(exportId, req)
    const title = sanitizeFilename(project?.title || 'export')
    const filename = `${title}-${exportId.slice(0, 8)}.mp4`

    // Prefer durable presigned R2 URL when storagePath or r2Key is known
    const storageKey = projectExport.storagePath || (typeof projectExport.metadata?.r2Key === 'string' ? projectExport.metadata.r2Key : null)
    const bucket = projectExport.storageBucket || process.env.R2_BUCKET_EXPORTS || 'prometheus-exports'

    if (storageKey) {
      try {
        const downloadUrl = await getPresignedGetUrl(
          bucket,
          storageKey,
          filename,
          86400, // 24 hours
        )
        return NextResponse.json({
          downloadUrl,
          download: {
            url: downloadUrl,
            filename,
          },
        })
      } catch (presignError) {
        console.warn('[EXPORT_DOWNLOAD_URL_GET] Presign failed, falling back to proxy:', presignError)
      }
    }

    if (projectExport.metadata?.outputKind === 'mini-run' && miniRunJobId) {
      const downloadUrl = `/api/mini-run/job/${encodeURIComponent(miniRunJobId)}/output?download=1&filename=${encodeURIComponent(filename)}`
      return NextResponse.json({downloadUrl, download: {url: downloadUrl, filename}})
    }

    if (!storageKey) {
      return NextResponse.json({ error: 'Export output path not found' }, { status: 404 })
    }
  } catch (error: any) {
    console.error('[EXPORT_DOWNLOAD_URL_GET]', error)

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
