'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type AiResponseLoaderProps = {
  className?: string
  label?: string
}

export function AiResponseLoader({ className, label = 'Generating' }: AiResponseLoaderProps) {
  const letters = React.useMemo(() => Array.from(label), [label])

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
