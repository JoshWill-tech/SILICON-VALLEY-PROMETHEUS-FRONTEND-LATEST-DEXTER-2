import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  buildAvatarObjectKey,
  getAvatarPublicUrl,
  getAvatarR2ConfigError,
  getAvatarUploadUrl,
} from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'

const avatarUploadRequestSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileSize: z.number().int().positive().max(5_242_880),
})

function errorResponse(status: number, code: string, message: string, details: unknown = null) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized')
    }

    const body = await request.json().catch(() => null)
    const parsed = avatarUploadRequestSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Invalid avatar upload payload.', parsed.error.flatten())
    }

    const configError = getAvatarR2ConfigError()
    if (configError) {
      return errorResponse(500, 'R2_CONFIG_MISSING', configError)
    }

    const key = buildAvatarObjectKey(user.id)
    const uploadUrl = await getAvatarUploadUrl({
      key,
      contentType: parsed.data.contentType,
      contentLength: parsed.data.fileSize,
    })
    const publicUrl = getAvatarPublicUrl(key)

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
    })
  } catch (error) {
    console.error('[api/upload/avatar] POST error:', error)

    return errorResponse(
      500,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to create avatar upload URL.',
    )
  }
}
