'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function LandingHeader() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/[0.05] bg-black/10 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/branding/prometheus-logo-no-bg.png"
            alt="Prometheus"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-white">
            rometheus
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/settings/billing"
            className="text-xs font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-xs font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
          >
            Login
          </Link>
          <Button
            asChild
            variant="outline"
            className="h-8 rounded-full border-white/10 bg-white/5 px-4 text-[10px] uppercase tracking-widest text-white hover:bg-white/10"
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>

        <div className="md:hidden">
          {/* Mobile menu could go here if needed */}
          <Link href="/login" className="text-xs font-medium uppercase tracking-widest text-white">
            Login
          </Link>
        </div>
      </div>
    </header>
  )
}
