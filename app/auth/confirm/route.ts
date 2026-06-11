import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { getSiteOrigin, normalizeNextPath } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'
import { normalizeUxError } from '@/lib/ux/errors'

function buildRedirect(request: NextRequest, pathname: string, error?: string, nextPath?: string, email?: string) {
  const origin = getSiteOrigin(request)
  const url = new URL(pathname, origin)

  if (error) {
    url.searchParams.set('error', error)
  }

  const normalizedNextPath = normalizeNextPath(nextPath)
  if (normalizedNextPath !== '/') {
    url.searchParams.set('next', normalizedNextPath)
  }

  if (email?.trim()) {
    url.searchParams.set('email', email.trim())
  }

  return url
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextPath = normalizeNextPath(searchParams.get('next'))
  const email = searchParams.get('email')
  const errorCode = searchParams.get('error_code')?.trim().toLowerCase() ?? ''
  const errorDescription = searchParams.get('error_description')?.trim() ?? ''
  const normalizedErrorDescription = errorDescription.toLowerCase()

  const redirectTo = buildRedirect(request, nextPath, undefined, nextPath, email ?? undefined)

  if (
    errorCode === 'otp_expired' ||
    normalizedErrorDescription.includes('email link is invalid or has expired') ||
    normalizedErrorDescription.includes('token has expired')
  ) {
    const failurePath = type === 'recovery' ? '/forgot-password' : '/verify'
    return NextResponse.redirect(
      buildRedirect(
        request,
        failurePath,
        normalizeUxError(errorDescription || 'That confirmation link is no longer valid. Request a fresh email and try again.', 'verification'),
        nextPath,
        email ?? undefined,
      ),
    )
  }

  try {
    const supabase = await createClient()

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(redirectTo)
      }

      return NextResponse.redirect(buildRedirect(request, '/login', normalizeUxError(error, 'oauth_callback'), nextPath, email ?? undefined))
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      })

      if (!error) {
        if (type === 'recovery') {
          return NextResponse.redirect(buildRedirect(request, '/reset-password', undefined, nextPath, email ?? undefined))
        }

        return NextResponse.redirect(redirectTo)
      }

      const failurePath = type === 'recovery' ? '/forgot-password' : '/verify'
      return NextResponse.redirect(buildRedirect(request, failurePath, normalizeUxError(error, 'verification'), nextPath, email ?? undefined))
    }
  } catch (error) {
    const message = normalizeUxError(error, 'oauth_callback')
    return NextResponse.redirect(buildRedirect(request, '/login', message, nextPath, email ?? undefined))
  }

  return NextResponse.redirect(buildRedirect(request, '/login', normalizeUxError('Authentication confirmation failed', 'oauth_callback'), nextPath, email ?? undefined))
}
