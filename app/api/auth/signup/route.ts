import { NextResponse } from 'next/server'

import { buildAuthConfirmUrl } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

import { getErrorMessage } from '../_utils'

type SignupBody = {
  fullName: string
  email: string
  password: string
  next?: string
  captchaToken?: string | null
}

export async function POST(req: Request) {
  const startedAt = Date.now()
  try {
    const body = (await req.json()) as Partial<SignupBody>

    const { captchaToken, next } = body
    const email = body.email ?? ''
    const password = body.password ?? ''
    const fullName = body.fullName ?? ''

    console.info('[api/auth/signup] incoming', {
      email,
      hasPassword: Boolean(password),
      fullNameLen: fullName.length,
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
    })

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        captchaToken: captchaToken ?? undefined,
        emailRedirectTo: buildAuthConfirmUrl(req, next).toString(),
      },
    })

    if (error) {
      throw error
    }

    const user = data.user
    const requiresVerification = Boolean(user && !data.session)

    console.info('[api/auth/signup] ok', {
      ms: Date.now() - startedAt,
      requiresVerification,
      hasUser: Boolean(user),
      hasSession: Boolean(data.session),
    })

    return NextResponse.json({ user, requiresVerification })
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message.toLowerCase() : ''
    const message = rawMessage.includes('captcha') || rawMessage.includes('turnstile')
      ? 'Security check failed. Complete the verification and try again.'
      : getErrorMessage(err, 'Signup failed', 'signup')
    console.error('[api/auth/signup] error', { ms: Date.now() - startedAt, message })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
