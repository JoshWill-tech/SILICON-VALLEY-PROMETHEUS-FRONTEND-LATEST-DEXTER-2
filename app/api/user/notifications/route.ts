import { NextResponse } from 'next/server'
import { z } from 'zod'

import { normalizeNotificationPreferences } from '@/lib/notifications/preference-store'
import { createClient } from '@/lib/supabase/server'

const notificationSchema = z.object({
  preferences: z.object({
    email: z
      .object({
        marketing: z.boolean().optional(),
        security: z.boolean().optional(),
        updates: z.boolean().optional(),
      })
      .optional(),
    push: z
      .object({
        browser: z.boolean().optional(),
      })
      .optional(),
    inApp: z
      .object({
        realtime: z.boolean().optional(),
      })
      .optional(),
  }),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = notificationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Invalid notification payload',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          notification_preferences: normalizeNotificationPreferences(parsed.data.preferences),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('id, notification_preferences')
      .single()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PERSIST_ERROR', message: error.message, details: error.details ?? null },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (caught) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: caught instanceof Error ? caught.message : 'Unable to save notification preferences.',
        },
      },
      { status: 500 },
    )
  }
}
