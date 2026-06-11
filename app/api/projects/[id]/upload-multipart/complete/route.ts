import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

import { requireOwnedProjectSourceKey } from '@/lib/r2/project-source-multipart'
import { r2Client } from '@/lib/r2/client'

type CompletedPartInput = {
  ETag?: unknown
  PartNumber?: unknown
  eTag?: unknown
  partNumber?: unknown
}

function normalizeCompletedParts(parts: unknown) {
  if (!Array.isArray(parts) || parts.length === 0) return null

  return parts
    .map((part: CompletedPartInput) => ({
      ETag: typeof (part.ETag ?? part.eTag) === 'string' ? String(part.ETag ?? part.eTag) : '',
      PartNumber: Number(part.PartNumber ?? part.partNumber),
    }))
    .filter((part) => part.ETag && Number.isInteger(part.PartNumber) && part.PartNumber > 0)
    .sort((a, b) => a.PartNumber - b.PartNumber)
}

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
    const parts = normalizeCompletedParts(body.parts)

    if (!uploadId || !parts) {
      return NextResponse.json({ error: 'Missing upload id or completed parts.' }, { status: 400 })
    }

    const response = await r2Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: keyContext.bucket,
        Key: keyContext.key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      }),
    )

    return NextResponse.json({
      bucket: keyContext.bucket,
      key: response.Key ?? keyContext.key,
      location: response.Location,
      url: `${process.env.NEXT_PUBLIC_R2_SOURCE_BASE_URL ?? 'https://assets.prometheusstudio.tech'}/${response.Key ?? keyContext.key}`,
    })
  } catch (err) {
    console.error('[api/projects/[id]/upload-multipart/complete] POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to complete multipart upload' },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 },
    )
  }
}
