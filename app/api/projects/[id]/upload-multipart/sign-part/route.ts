import { UploadPartCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'

import {
  PROJECT_SOURCE_MULTIPART_URL_TTL_SECONDS,
  requireOwnedProjectSourceKey,
} from '@/lib/r2/project-source-multipart'
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
    const partNumber = Number(body.partNumber)

    if (!uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
      return NextResponse.json({ error: 'Invalid multipart upload id or part number.' }, { status: 400 })
    }

    const command = new UploadPartCommand({
      Bucket: keyContext.bucket,
      Key: keyContext.key,
      UploadId: uploadId,
      PartNumber: partNumber,
    })

    const url = await getSignedUrl(r2Client, command, {
      expiresIn: PROJECT_SOURCE_MULTIPART_URL_TTL_SECONDS,
    })

    return NextResponse.json({
      headers: {},
      method: 'PUT',
      partNumber,
      url,
    })
  } catch (err) {
    console.error('[api/projects/[id]/upload-multipart/sign-part] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to sign upload part' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 },
    )
  }
}
