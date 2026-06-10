import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const profilePreferencesSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z]+(?:[A-Za-z -]*[A-Za-z])?$/, 'Display name can only use letters, spaces, and hyphens')
    .optional(),
  bio: z.string().trim().max(500).optional(),
  pronouns: z.string().trim().max(32).optional(),
  location: z.string().trim().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')).optional(),
  themePreference: z.string().trim().min(1).max(32).optional(),
  fontPreference: z.string().trim().min(1).max(32).optional(),
})

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = profilePreferencesSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Invalid preference payload',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      )
    }

    const payload = parsed.data
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          display_name: payload.displayName,
          bio: payload.bio,
          pronouns: payload.pronouns,
          location: payload.location,
          avatar_url: payload.avatarUrl,
          theme_preference: payload.themePreference,
          font_preference: payload.fontPreference,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('id, display_name, bio, pronouns, location, avatar_url, theme_preference, font_preference')
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
          message: caught instanceof Error ? caught.message : 'Unable to save preferences.',
        },
      },
      { status: 500 },
    )
  }
}
