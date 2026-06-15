'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { PrometheusVapourText } from '@/components/ui/vapour-text-effect'

type AiResponseLoaderProps = {
  className?: string
  delayMs?: number
  label?: string
  variant?: 'letters' | 'vapour'
}

export function AiResponseLoader({
  className,
  delayMs = 240,
  label = 'Generating',
  variant = 'letters',
}: AiResponseLoaderProps) {
  const letters = React.useMemo(() => Array.from(label), [label])

  if (variant === 'vapour') {
    return (
      <div
        className={cn('ai-loader-wrapper', className)}
        role="status"
        aria-live="polite"
        aria-label={`${label} response`}
      >
        <PrometheusVapourText
          text={label}
          label={`${label} response`}
          delayMs={delayMs}
          className="h-12 w-[min(18rem,68vw)]"
        />
      </div>
    )
  }

  return (
    <div
      className={cn('ai-loader-wrapper', className)}
      role="status"
      aria-live="polite"
      aria-label={`${label} response`}
    >
      <span className="ai-loader-letters" aria-hidden="true">
        {letters.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className="loader-letter"
            style={{ '--letter-index': index } as React.CSSProperties}
          >
            {letter}
          </span>
        ))}
      </span>
      <span className="loader-orb" aria-hidden="true" />
    </div>
  )
}
