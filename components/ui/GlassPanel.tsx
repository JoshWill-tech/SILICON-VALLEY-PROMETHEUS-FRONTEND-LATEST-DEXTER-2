import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
  blur?: string | number
  radius?: string | number
  border?: string
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      children,
      className,
      blur = '24px',
      radius = '16px',
      border = 'rgba(255,255,255,0.08)',
      style,
      ...props
    },
    ref
  ) => {
    const blurValue = typeof blur === 'number' ? `${blur}px` : blur
    const radiusValue = typeof radius === 'number' ? `${radius}px` : radius

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          className
        )}
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
          backgroundColor: 'var(--glass-bg, rgba(17, 17, 24, 0.55))',
          backdropFilter: `blur(${blurValue}) saturate(140%)`,
          WebkitBackdropFilter: `blur(${blurValue}) saturate(140%)`,
          border: `1px solid ${border}`,
          borderRadius: radiusValue,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassPanel.displayName = 'GlassPanel'
