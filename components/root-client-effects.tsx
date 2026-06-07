'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useActivityDetector } from '@/hooks/useActivityDetector'
import { usePasteDetector } from '@/hooks/usePasteDetector'

const AppToaster = dynamic(() => import('@/components/ui/app-toaster').then((mod) => mod.AppToaster), {
  ssr: false,
})

const CinematicClickRipple = dynamic(
  () => import('@/components/ui/cinematic-click-ripple').then((mod) => mod.CinematicClickRipple),
  {
    ssr: false,
  },
)

const AUTH_ROUTE_REGEX = /^\/(?:login|signup|verify|forgot-password|reset-password|terms|privacy|refund)(?:\/|$)/

export function RootClientEffects() {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTE_REGEX.test(pathname)
  useActivityDetector()
  usePasteDetector()

  return (
    <>
      {isAuthRoute ? null : <CinematicClickRipple />}
      <AppToaster />
    </>
  )
}
