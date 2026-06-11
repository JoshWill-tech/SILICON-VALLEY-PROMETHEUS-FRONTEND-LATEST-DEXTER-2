'use client'

import * as React from 'react'

import { DashboardMobileSidebar } from '@/components/dashboard/mobile-sidebar'
import { DashboardRotator } from '@/components/dashboard/DashboardRotator'
import { AmbientGlow } from '@/components/editor/AmbientGlow'
import { AwwwardsSidebar } from '@/components/sidebar/AwwwardsSidebar'
import { useDeviceTier } from '@/hooks/useDeviceTier'

function dispatchDashboardEvent(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name))
}

export default function DashboardPageV2() {
  const tier = useDeviceTier()

  const handleNewProject = React.useCallback(() => {
    dispatchDashboardEvent('prometheus:dashboard:new-project')
  }, [])

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-chrome-950 text-text-primary"
      data-device-tier={tier}
      data-dashboard-shell="v2"
    >
      <AmbientGlow />

      <div className="hidden lg:block">
        <AwwwardsSidebar />
      </div>

      <DashboardMobileSidebar
        className="lg:hidden"
        onNewProject={handleNewProject}
        profileHref="/settings/profile"
        studioHref="/studio"
      />

      <main className="relative flex min-h-screen min-w-0 flex-col lg:ml-[280px]">
        <DashboardRotator />
      </main>
    </div>
  )
}
