import { PutObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { NextResponse } from 'next/server'

import { ProjectService } from '@/lib/projects/service'
import { r2Client } from '@/lib/r2/client'
import { R2Keys } from '@/lib/r2/keys'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const encodedFilename = req.headers.get('x-file-name')?.trim()
    const mimeType = req.headers.get('x-mime-type')?.trim()
    const providedAssetId = req.headers.get('x-asset-id')?.trim()
    const sizeBytesHeader = req.headers.get('x-file-size')?.trim()
    const filename = encodedFilename ? decodeURIComponent(encodedFilename) : null

    if (!filename || !mimeType || !providedAssetId || !req.body) {
      return NextResponse.json({ error: 'Missing upload payload or metadata' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const bucket = process.env.R2_BUCKET_SOURCES || 'prometheus-sources'
    const objectKey = R2Keys.sourceAsset(user.id, projectId, providedAssetId, filename)

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: Readable.fromWeb(req.body as unknown as NodeReadableStream),
        ContentType: mimeType,
      }),
    )

    return NextResponse.json({
      asset: {
        id: providedAssetId,
        projectId,
        storageProvider: 'r2',
        bucket,
        objectKey,
        mimeType,
        sizeBytes: sizeBytesHeader ? Number(sizeBytesHeader) : undefined,
      },
    })
  } catch (err) {
    console.error('[api/projects/[id]/upload-source] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to upload source to R2' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 },
    )
  }
}
