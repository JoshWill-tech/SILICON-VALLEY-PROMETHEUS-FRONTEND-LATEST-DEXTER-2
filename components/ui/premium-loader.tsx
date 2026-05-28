'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type PremiumLoaderProps = {
  className?: string
  factClassName?: string
  label?: string
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'screen' | 'panel' | 'inline'
}

const SIZE_CLASS_NAMES = {
  sm: 'h-14 w-28',
  md: 'h-20 w-40',
  lg: 'h-24 w-48',
} as const

export function PremiumLoader({
  className,
  label = 'Loading...',
  message,
  size = 'md',
  variant = 'panel',
}: PremiumLoaderProps) {
  const uniqueId = React.useId().replace(/:/g, '')
  const pathId = `${uniqueId}-orbit`
  const gradientId = `${uniqueId}-neon-gradient`
  const bloomFilterId = `${uniqueId}-bloom`
  const packetFilterId = `${uniqueId}-packet`

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden text-center text-white',
        variant === 'screen' && 'min-h-screen bg-black px-6',
        variant === 'panel' && 'rounded-[28px] border border-white/8 bg-black px-6 py-10 shadow-[0_34px_90px_-58px_rgba(0,0,0,0.95)]',
        variant === 'inline' && 'bg-transparent px-4 py-5',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={message ? `${label} ${message}` : label}
    >
      <style>{`
        @keyframes premium-loader-orbit {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -1; }
        }

        @keyframes premium-loader-core-orbit {
          from { stroke-dashoffset: -0.022; }
          to { stroke-dashoffset: -1.022; }
        }

        @keyframes premium-loader-ambient {
          0% {
            opacity: 0.34;
            transform: translate(-50%, -50%) scale(0.95);
          }
          45% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.16);
          }
          100% {
            opacity: 0.36;
            transform: translate(-50%, -50%) scale(0.98);
          }
        }

        @keyframes premium-loader-haze {
          0%, 100% {
            opacity: 0.18;
            transform: translate(-50%, -50%) scaleX(1);
          }
          50% {
            opacity: 0.32;
            transform: translate(-50%, -50%) scaleX(1.1);
          }
        }

        @keyframes premium-loader-text {
          0%, 100% {
            opacity: 0.62;
          }
          50% {
            opacity: 0.95;
          }
        }

        @keyframes premium-loader-track {
          0%, 100% { opacity: 0.34; }
          50% { opacity: 0.56; }
        }
      `}</style>

      <div aria-hidden className="relative isolate">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-44 rounded-full bg-[#0080ff]/18 blur-3xl"
          style={{ animation: 'premium-loader-ambient 2.7s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-52 rounded-full bg-[#8b5cf6]/14 blur-2xl"
          style={{ animation: 'premium-loader-haze 2.7s ease-in-out infinite' }}
        />
        <svg viewBox="0 0 220 120" className={cn('relative z-10 overflow-visible', SIZE_CLASS_NAMES[size])} fill="none">
          <defs>
            <linearGradient id={gradientId} x1="8%" y1="20%" x2="92%" y2="80%">
              <stop offset="0%" stopColor="#00f0ff">
                <animate attributeName="stop-color" values="#00f0ff;#0080ff;#8b5cf6;#00f0ff" dur="2.7s" repeatCount="indefinite" />
              </stop>
              <stop offset="45%" stopColor="#0080ff">
                <animate attributeName="stop-color" values="#0080ff;#8b5cf6;#00f0ff;#0080ff" dur="2.7s" repeatCount="indefinite" />
              </stop>
              <stop offset="78%" stopColor="#8b5cf6">
                <animate attributeName="stop-color" values="#8b5cf6;#00f0ff;#0080ff;#8b5cf6" dur="2.7s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <filter id={bloomFilterId} x="-45%" y="-75%" width="190%" height="250%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0.62 0 0 0 0 1 0 0 0 0.85 0"
                result="blueGlow"
              />
              <feMerge>
                <feMergeNode in="blueGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={packetFilterId} x="-350%" y="-350%" width="800%" height="800%">
              <feGaussianBlur stdDeviation="3.4" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.15 0 0 0 0 0.78 0 0 0 0 1 0 0 0 0.95 0"
                result="packetGlow"
              />
              <feMerge>
                <feMergeNode in="packetGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            id={pathId}
            pathLength={1}
            d="M38 60 C38 31 67 26 92 52 C98 58 103 62 110 60 C117 58 122 52 128 46 C153 20 182 31 182 60 C182 89 153 100 128 74 C122 68 117 62 110 60 C103 58 98 62 92 68 C67 94 38 89 38 60"
            stroke="rgba(148,163,184,0.13)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'premium-loader-track 3.2s ease-in-out infinite' }}
          />
          <path
            pathLength={1}
            d="M38 60 C38 31 67 26 92 52 C98 58 103 62 110 60 C117 58 122 52 128 46 C153 20 182 31 182 60 C182 89 153 100 128 74 C122 68 117 62 110 60 C103 58 98 62 92 68 C67 94 38 89 38 60"
            stroke={`url(#${gradientId})`}
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.28 0.72"
            filter={`url(#${bloomFilterId})`}
            opacity="0.38"
            style={{ animation: 'premium-loader-orbit 2.7s linear infinite' }}
          />
          <path
            pathLength={1}
            d="M38 60 C38 31 67 26 92 52 C98 58 103 62 110 60 C117 58 122 52 128 46 C153 20 182 31 182 60 C182 89 153 100 128 74 C122 68 117 62 110 60 C103 58 98 62 92 68 C67 94 38 89 38 60"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.18 0.82"
            filter={`url(#${bloomFilterId})`}
            style={{ animation: 'premium-loader-orbit 2.7s linear infinite' }}
          />
          <path
            pathLength={1}
            d="M38 60 C38 31 67 26 92 52 C98 58 103 62 110 60 C117 58 122 52 128 46 C153 20 182 31 182 60 C182 89 153 100 128 74 C122 68 117 62 110 60 C103 58 98 62 92 68 C67 94 38 89 38 60"
            fill="none"
            stroke="rgba(255,255,255,0.96)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.038 0.962"
            filter={`url(#${packetFilterId})`}
            style={{ animation: 'premium-loader-core-orbit 2.7s linear infinite' }}
          />
          <g filter={`url(#${packetFilterId})`}>
            <circle r="5.2" fill="#00f0ff" opacity="0.3">
              <animateMotion dur="2.7s" repeatCount="indefinite" rotate="auto">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
            <circle r="3.6" fill="#ffffff">
              <animateMotion dur="2.7s" repeatCount="indefinite" rotate="auto">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
            <circle r="2.2" fill="#8b5cf6" opacity="0.72" transform="translate(3 -1.5)">
              <animateMotion dur="2.7s" repeatCount="indefinite" rotate="auto">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
          </g>
        </svg>
      </div>

      <p className="relative mt-8 text-sm font-light tracking-wide text-[#475569]" style={{ animation: 'premium-loader-text 2.4s ease-in-out infinite' }}>
        {label}
      </p>
      {message ? <span className="sr-only">{message}</span> : null}
    </div>
  )
}

export function PremiumLoadingScreen(props: Omit<PremiumLoaderProps, 'variant'>) {
  return <PremiumLoader {...props} variant="screen" />
}
