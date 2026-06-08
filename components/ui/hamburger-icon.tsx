'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface HamburgerIconProps {
  isOpen?: boolean
  className?: string
  onClick?: () => void
}

export const HamburgerIcon = React.forwardRef<HTMLButtonElement, HamburgerIconProps>(function HamburgerIcon(
  { isOpen = false, className, onClick },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      role="button"
      aria-label={isOpen ? 'Close mobile navigation' : 'Open mobile navigation'}
      aria-expanded={isOpen}
      data-menu-state={isOpen ? 'open' : 'closed'}
      onClick={onClick}
      className={cn(
        'group fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/88 shadow-[0_14px_36px_rgba(0,0,0,0.36)] outline-none transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-cyan md:hidden',
        className
      )}
      style={{
        backgroundColor: 'rgba(8, 8, 12, 0.84)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
      }}
    >
      <span className="relative block h-5 w-6" aria-hidden="true">
        <span
          className={cn(
            'absolute left-0 top-[5px] h-[2.5px] w-6 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
            'group-data-[menu-state=open]:top-[9px] group-data-[menu-state=open]:w-5 group-data-[menu-state=open]:translate-x-0.5 group-data-[menu-state=open]:rotate-45'
          )}
        />
        <span
          className={cn(
            'absolute left-0 top-[13px] h-[2.5px] w-4 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
            'group-data-[menu-state=open]:top-[9px] group-data-[menu-state=open]:w-5 group-data-[menu-state=open]:translate-x-0.5 group-data-[menu-state=open]:-rotate-45'
          )}
        />
      </span>
    </button>
  )
})
