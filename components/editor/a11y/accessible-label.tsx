'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AccessibleLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  srOnly?: boolean
}

export function AccessibleLabel({ className, srOnly = false, children, ...props }: AccessibleLabelProps) {
  return (
    <label
      {...props}
      className={cn(
        srOnly
          ? 'sr-only'
          : 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/48',
        className,
      )}
    >
      {children}
    </label>
  )
}
