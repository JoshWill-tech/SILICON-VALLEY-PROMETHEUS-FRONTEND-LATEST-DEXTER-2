import Link from 'next/link'
import type { ReactNode } from 'react'

export const LEGAL_V2_LAST_UPDATED = 'June 8, 2026'

const LEGAL_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refund' },
  { href: '/contact', label: 'Contact' },
]

export interface LegalPageShellProps {
  title: string
  eyebrow?: string
  description: string
  currentPath: string
  lastUpdated?: string
  children: ReactNode
}

export interface LegalPageSectionProps {
  title: string
  children: ReactNode
}

export interface LegalPageSubsectionProps {
  title: string
  children: ReactNode
}

export function LegalPageShell({
  title,
  eyebrow = 'Legal',
  description,
  currentPath,
  lastUpdated = LEGAL_V2_LAST_UPDATED,
  children,
}: LegalPageShellProps) {
  return (
    <main className="relative min-h-screen bg-neutral-950 text-white">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-accent-cyan/[0.035] blur-[130px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-4xl px-6 py-24 md:py-32">
        <nav
          aria-label="Legal pages"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.68rem] uppercase tracking-[0.32em] text-neutral-500"
        >
          <Link href="/" className="transition-colors hover:text-white">
            Prometheus
          </Link>
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={currentPath === link.href ? 'page' : undefined}
              className={currentPath === link.href ? 'text-white' : 'transition-colors hover:text-white'}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <header className="mt-16 space-y-6 sm:mt-20">
          <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">{eyebrow}</p>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-medium leading-none tracking-[-0.06em] text-white sm:text-6xl">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-neutral-400 sm:text-lg">{description}</p>
          </div>
          <p className="text-sm uppercase tracking-[0.22em] text-neutral-500">Last updated {lastUpdated}</p>
        </header>

        <div className="mt-20 space-y-16">{children}</div>
      </div>
    </main>
  )
}

export function LegalPageSection({ title, children }: LegalPageSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-medium tracking-[-0.04em] text-white sm:text-3xl">{title}</h2>
      <div className="space-y-4 text-[15px] leading-8 text-neutral-400 sm:text-base">{children}</div>
    </section>
  )
}

export function LegalPageSubsection({ title, children }: LegalPageSubsectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium tracking-[-0.03em] text-white sm:text-xl">{title}</h3>
      <div className="space-y-4 text-[15px] leading-8 text-neutral-400 sm:text-base">{children}</div>
    </div>
  )
}

export function LegalTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-left text-sm leading-6">{children}</table>
    </div>
  )
}
