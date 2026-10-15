'use client'

import { useEffect } from 'react'
import { initClientAntiTamper } from '@/lib/security/client-anti-tamper'

export interface DevToolsShieldProps {
  blockShortcuts?: boolean
  neutralizeConsole?: boolean
  blockContextMenu?: boolean
}

export function DevToolsShield({
  blockShortcuts = true,
  neutralizeConsole = process.env.NODE_ENV === 'production',
  blockContextMenu = process.env.NODE_ENV === 'production',
}: DevToolsShieldProps) {
  useEffect(() => {
    const teardown = initClientAntiTamper({
      blockShortcuts,
      neutralizeConsole,
      blockContextMenu,
    })
    return () => {
      teardown()
    }
  }, [blockShortcuts, neutralizeConsole, blockContextMenu])

  return null
}
