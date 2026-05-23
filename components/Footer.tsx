'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full px-8 pb-8 pt-10">
      <div className="flex flex-col gap-2">
        <span className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
          Legal
        </span>
        <Link href="/terms" className="text-sm text-neutral-500 transition-colors hover:text-white">
          Terms
        </Link>
        <Link href="/privacy" className="text-sm text-neutral-500 transition-colors hover:text-white">
          Privacy
        </Link>
        <Link href="/refund" className="text-sm text-neutral-500 transition-colors hover:text-white">
          Refund
        </Link>
      </div>
    </footer>
  )
}
