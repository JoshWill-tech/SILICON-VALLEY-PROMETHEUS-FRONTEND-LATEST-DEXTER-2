'use client'

import * as React from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useIsMobile } from '@/lib/hooks/use-is-mobile'

type MobileEditorPageShellProps = {
  actions?: ReactNode
  children: ReactNode
  description?: string
  desktopHref?: string
  icon?: LucideIcon
  title: string
}

export function MobileEditorPageShell({
  actions,
  children,
  description,
  desktopHref = '/editor',
  icon: Icon,
  title,
}: MobileEditorPageShellProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [hasMeasuredViewport, setHasMeasuredViewport] = React.useState(false)

  React.useEffect(() => {
    setHasMeasuredViewport(true)
  }, [])

  React.useEffect(() => {
    if (!hasMeasuredViewport || isMobile) return
    router.replace(desktopHref)
  }, [desktopHref, hasMeasuredViewport, isMobile, router])

  if (!hasMeasuredViewport) return null

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05060a]/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </button>
          {Icon ? <Icon className="size-5 text-accent-cyan" aria-hidden="true" /> : null}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{title}</h1>
            {description ? <p className="truncate text-xs text-white/40">{description}</p> : null}
          </div>
          {actions}
        </div>
      </header>

      <div className="px-4 pb-24 pt-4">{children}</div>
    </div>
  )
}
