import { AbortMultipartUploadCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

import { requireOwnedProjectSourceKey } from '@/lib/r2/project-source-multipart'
import { r2Client } from '@/lib/r2/client'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const body = await req.json().catch(() => ({}))
    const keyContext = await requireOwnedProjectSourceKey(projectId, body.key)

    if ('error' in keyContext) {
      return NextResponse.json({ error: keyContext.error }, { status: keyContext.status })
    }

    const uploadId = typeof body.uploadId === 'string' ? body.uploadId.trim() : ''
    if (!uploadId) {
      return NextResponse.json({ error: 'Missing upload id.' }, { status: 400 })
    }

    await r2Client.send(
      new AbortMultipartUploadCommand({
        Bucket: keyContext.bucket,
        Key: keyContext.key,
        UploadId: uploadId,
      }),
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/projects/[id]/upload-multipart/abort] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to abort multipart upload' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 },
    )
  }
}
