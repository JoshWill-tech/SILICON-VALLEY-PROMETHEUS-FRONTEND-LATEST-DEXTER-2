'use client'

import * as React from 'react'
import { MotionBrainStaging, type MotionBrainStagingProps } from '@/components/editor/staging/motion-brain-staging'
import { cn } from '@/lib/utils'

export interface MotionBrainPanelV2Props extends MotionBrainStagingProps {
  panelClassName?: string
}

export function MotionBrainPanelV2({ className, panelClassName, ...props }: MotionBrainPanelV2Props) {
  return (
    <div className={cn('flex h-full w-80 flex-col border-l border-border-subtle glass-panel', panelClassName)}>
      <MotionBrainStaging {...props} className={cn('h-full rounded-none border-0 bg-transparent shadow-none', className)} />
    </div>
  )
}
