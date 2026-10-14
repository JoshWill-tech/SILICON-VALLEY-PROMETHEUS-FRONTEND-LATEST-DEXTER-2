import Link from 'next/link'

import { BrandWordmark } from '@/components/brand-wordmark'

import { CookieSettingsButton } from '@/components/cookie-consent/cookie-settings-button'

const FOOTER_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/contact', label: 'Contact' },
]

export function Footer() {
  return (
    <footer className="prometheus-footer w-full border-t border-white/[0.07] bg-[#05060a] px-5 py-14 text-white sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)] lg:items-end">
        <div className="max-w-lg">
          <BrandWordmark />
          <p className="mt-3 text-sm leading-6 text-white/50">
            Professional video editing and production workspace for filmmakers, motion designers,
            and modern production teams.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/34">
            © 2026 Prometheus Studio. All rights reserved.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/56 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <CookieSettingsButton className="text-sm font-medium text-white/56 transition-colors hover:text-white">
            Cookie Settings
          </CookieSettingsButton>
          <CookieSettingsButton className="text-sm font-medium text-white/56 transition-colors hover:text-white">
            Do Not Sell or Share My Personal Information
          </CookieSettingsButton>
          <a
            href="mailto:support@prometheusstudio.tech"
            className="text-sm font-medium text-white/56 transition-colors hover:text-white"
          >
            Support
          </a>
        </nav>
      </div>
    </footer>
  )
}
