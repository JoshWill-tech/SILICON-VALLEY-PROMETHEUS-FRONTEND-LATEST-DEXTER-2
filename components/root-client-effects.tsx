'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const AppToaster = dynamic(() => import('@/components/ui/app-toaster').then((mod) => mod.AppToaster), {
  ssr: false,
})

const CinematicClickRipple = dynamic(
  () => import('@/components/ui/cinematic-click-ripple').then((mod) => mod.CinematicClickRipple),
  {
    ssr: false,
  },
)

const AUTH_ROUTE_REGEX = /^\/(?:login|signup|verify|forgot-password|reset-password|terms|privacy)(?:\/|$)/

export function RootClientEffects() {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTE_REGEX.test(pathname)

  if (isAuthRoute) return null

  return (
    <>
      <CinematicClickRipple />
      <AppToaster />
    </>
  )
}
