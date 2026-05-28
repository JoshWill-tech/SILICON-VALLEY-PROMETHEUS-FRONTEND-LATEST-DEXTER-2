'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const FOOTER_EXACT_PATHS = new Set([
  '/',
  '/pricing',
  '/signup',
  '/login',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/refund',
])

const FOOTER_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund', label: 'Refund Policy' },
]

export function shouldRenderFooterForPath(pathname: string | null) {
  if (!pathname || pathname.startsWith('/api')) return false

  const normalizedPathname =
    pathname === '/' ? '/' : pathname.replace(/\/+$/, '')

  if (FOOTER_EXACT_PATHS.has(normalizedPathname)) return true

  return normalizedPathname === '/auth' || normalizedPathname.startsWith('/auth/')
}

export function RouteScopedFooter() {
  const pathname = usePathname()

  if (!shouldRenderFooterForPath(pathname)) return null

  return <Footer />
}

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.05] bg-black/20 px-8 py-12 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <p className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
            © 2026 Prometheus AI. All rights reserved.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium tracking-wider text-slate-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
