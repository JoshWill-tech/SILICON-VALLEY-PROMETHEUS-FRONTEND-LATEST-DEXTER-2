import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { normalizeNextPath } from '@/lib/auth/redirect'
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase/config'

const AUTH_PAGE_PREFIXES = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password', '/auth']
const PUBLIC_ROUTES = ['/', '/pricing', '/terms', '/privacy', '/refund']
const PROTECTED_PREFIXES = [
  '/',
  '/dashboard',
  '/projects',
  '/editor',
  '/exports',
  '/templates',
  '/assets',
  '/settings',
  '/billing',
  '/captions',
  '/highlights',
  '/broll',
  '/team',
  '/brand-kit',
]

function shouldBypassAuth(req: NextRequest) {
  const envToggle = process.env.DEV_AUTH_BYPASS
  if (envToggle === '1') return true
  if (envToggle === '0') return false

  const queryOverride = req.nextUrl.searchParams.get('devAuthBypass')
  if (queryOverride === '1') return true
  if (queryOverride === '0') return false

  return process.env.NODE_ENV !== 'production' && !isSupabaseConfigured()
}

function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (pathname.startsWith('/api')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname === '/favicon.ico') return true
  if (pathname === '/robots.txt') return true
  if (pathname === '/sitemap.xml') return true

  return AUTH_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function redirectToSignup(req: NextRequest) {
  const url = req.nextUrl.clone()
  const nextPath = normalizeNextPath(`${req.nextUrl.pathname}${req.nextUrl.search}`)

  url.pathname = '/signup'
  url.search = ''

  if (nextPath !== '/') {
    url.searchParams.set('next', nextPath)
  }

  return NextResponse.redirect(url)
}

const BOT_UA = /bot|crawler|spider|googlebot|bingbot|facebookexternalhit|twitterbot|linkedinbot/i;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || '';

  if (isPublicPath(pathname)) {
    const response = NextResponse.next()
    if (BOT_UA.test(userAgent)) {
      response.headers.set('x-preset-override', 'zus');
    }
    return response;
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (shouldBypassAuth(request)) {
    return NextResponse.next()
  }

  if (!isSupabaseConfigured()) {
    return redirectToSignup(request)
  }

  let response = NextResponse.next({
    request,
  })

  const { url, publishableKey } = getSupabaseConfig()
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  response.headers.set('Cache-Control', 'private, no-store')

  if (!user) {
    return redirectToSignup(request)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
