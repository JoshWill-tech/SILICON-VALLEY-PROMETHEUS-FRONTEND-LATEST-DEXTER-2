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
    const projectExport = await ExportService.getExport(exportId)

    if (projectExport.status !== 'completed' || !projectExport.storagePath) {
      return NextResponse.json(
        { error: 'Export not ready', status: projectExport.status },
        { status: 400 }
      )
    }

<<<<<<< HEAD
    // 2. Fetch project to get title for filename
    let filename = `export-${exportId.slice(0, 8)}.mp4`
    try {
      const project = await ProjectService.getProject(projectExport.projectId)
      if (project?.title) {
        filename = `${sanitizeFilename(project.title)}.mp4`
      }
    } catch (err) {
      console.warn('[EXPORT_DOWNLOAD_URL] Could not fetch project title, using fallback filename', err)
    }

    // 3. Generate presigned GET URL for the final MP4
    const bucket = projectExport.storageBucket || process.env.R2_BUCKET_EXPORTS || 'prometheus-exports'
    const downloadUrl = await getPresignedGetUrl(bucket, projectExport.storagePath, filename)

    return NextResponse.json({ 
      downloadUrl, // Keep for backward compatibility if needed during migration
      download: {
        url: downloadUrl,
        filename,
        expiresIn: 3600
=======
    // 2. Generate presigned GET URL for the final MP4
    const project = await ExportService.getExportProject(exportId)
    const sanitizedTitle = (project?.title || 'export').replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const filename = `${sanitizedTitle}-${exportId.slice(0, 8)}.mp4`

    const bucket = projectExport.storageBucket || process.env.R2_BUCKET_EXPORTS || 'prometheus-exports'
    const downloadUrl = await getPresignedGetUrl(
      bucket, 
      projectExport.storagePath,
      `attachment; filename="${filename}"`
    )

    return NextResponse.json({ 
      downloadUrl,
      download: {
        url: downloadUrl,
        filename
>>>>>>> feat/render-worker-proof
      }
    })
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
