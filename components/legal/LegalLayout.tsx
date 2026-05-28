import Link from 'next/link'
import type { ReactNode } from 'react'

export const LEGAL_LAST_UPDATED = 'May 28, 2026'

const LEGAL_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refund' },
]

type LegalLayoutProps = {
  title: string
  description: string
  currentPath: string
  lastUpdated?: string
  children: ReactNode
}

type LegalSectionProps = {
  title: string
  children: ReactNode
}

type LegalSubsectionProps = {
  title: string
  children: ReactNode
}

export function LegalLayout({
  title,
  description,
  currentPath,
  lastUpdated = LEGAL_LAST_UPDATED,
  children,
}: LegalLayoutProps) {
  return (
    <main className="relative min-h-screen bg-neutral-950">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-white/[0.02] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-6 py-24 md:py-32 md:pb-24">
        <nav
          aria-label="Legal pages"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.68rem] uppercase tracking-[0.32em] text-neutral-500"
        >
          <Link href="/" className="transition-colors hover:text-white">
            Prometheus
          </Link>
          {LEGAL_LINKS.map((link) => {
            const isActive = currentPath === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'text-white' : 'transition-colors hover:text-white'}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <header className="mt-16 space-y-6 sm:mt-20">
          <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">Legal</p>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-5xl font-medium leading-none tracking-[-0.06em] text-white sm:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-neutral-400 sm:text-lg">{description}</p>
          </div>
          <p className="text-sm uppercase tracking-[0.22em] text-neutral-500">
            Last updated {lastUpdated}
          </p>
        </header>

        <div className="mt-20 space-y-16">{children}</div>
      </div>
    </main>
  )
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-medium tracking-[-0.04em] text-white sm:text-3xl">{title}</h2>
      <div className="space-y-4 text-[15px] leading-8 text-neutral-400 sm:text-base">{children}</div>
    </section>
  )
}

export function LegalSubsection({ title, children }: LegalSubsectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium tracking-[-0.03em] text-white sm:text-xl">{title}</h3>
      <div className="space-y-4 text-[15px] leading-8 text-neutral-400 sm:text-base">{children}</div>
    </div>
  )
}
