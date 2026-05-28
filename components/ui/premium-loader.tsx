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
  sm: 'h-12 w-24',
  md: 'h-16 w-32',
  lg: 'h-20 w-40',
} as const

export function PremiumLoader({
  className,
  label = 'Loading...',
  message,
  size = 'md',
  variant = 'panel',
}: PremiumLoaderProps) {
  const gradientId = React.useId().replace(/:/g, '')

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden text-center text-white',
        variant === 'screen' && 'min-h-screen bg-[#050505] px-6',
        variant === 'panel' && 'rounded-[28px] border border-white/8 bg-[#050505] px-6 py-10 shadow-[0_34px_90px_-58px_rgba(0,0,0,0.95)]',
        variant === 'inline' && 'bg-transparent px-4 py-5',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={message ? `${label} ${message}` : label}
    >
      <style>{`
        @keyframes premium-loader-draw {
          0% {
            stroke-dashoffset: 132;
            opacity: 0.42;
            filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.48)) drop-shadow(0 0 14px rgba(99, 102, 241, 0.18));
          }
          36% {
            stroke-dashoffset: 0;
            opacity: 1;
            filter: drop-shadow(0 0 9px rgba(167, 139, 250, 0.9)) drop-shadow(0 0 24px rgba(139, 92, 246, 0.44));
          }
          68% {
            stroke-dashoffset: -3;
            opacity: 0.84;
            filter: drop-shadow(0 0 8px rgba(196, 181, 253, 0.76)) drop-shadow(0 0 19px rgba(99, 102, 241, 0.28));
          }
          100% {
            stroke-dashoffset: -132;
            opacity: 0.36;
            filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.42)) drop-shadow(0 0 12px rgba(99, 102, 241, 0.16));
          }
        }

        @keyframes premium-loader-breathe {
          0%, 100% {
            opacity: 0.42;
            transform: translate(-50%, -50%) scale(1.08);
          }
          46% {
            opacity: 0.76;
            transform: translate(-50%, -50%) scale(1.28);
          }
        }

        @keyframes premium-loader-dot {
          0%, 100% {
            opacity: 0.86;
            transform: scale(0.92);
            filter: drop-shadow(0 0 8px rgba(255,255,255,0.72)) drop-shadow(0 0 18px rgba(167,139,250,0.46));
          }
          48% {
            opacity: 1;
            transform: scale(1.14);
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.92)) drop-shadow(0 0 24px rgba(167,139,250,0.68));
          }
        }

        @keyframes premium-loader-ghost {
          0%, 100% { opacity: 0.42; }
          50% { opacity: 0.62; }
        }
      `}</style>

      <div aria-hidden className="relative isolate">
        <div
          className="pointer-events-none absolute left-[33%] top-1/2 h-14 w-24 rounded-full bg-violet-500/20 blur-2xl"
          style={{ animation: 'premium-loader-breathe 3.2s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute left-[40%] top-1/2 h-8 w-16 rounded-full bg-[#6366f1]/16 blur-xl"
          style={{ animation: 'premium-loader-breathe 3.2s ease-in-out 0.28s infinite' }}
        />
        <svg viewBox="0 0 200 100" className={cn('relative z-10 overflow-visible', SIZE_CLASS_NAMES[size])} fill="none">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="52%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <path
            d="M30,50 C30,20 70,20 100,50 C130,80 170,80 170,50 C170,20 130,20 100,50 C70,80 30,80 30,50"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M100,50 C130,80 170,80 170,50 C170,20 130,20 100,50"
            stroke="rgba(255,255,255,0.115)"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ animation: 'premium-loader-ghost 3.2s ease-in-out infinite' }}
          />
          <path
            d="M30,50 C30,20 70,20 100,50"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="132"
            strokeDashoffset="132"
            style={{
              animation: 'premium-loader-draw 2.9s cubic-bezier(0.52, 0, 0.22, 1) infinite',
            }}
          />
          <circle
            cx="100"
            cy="50"
            r="4"
            fill="white"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: 'premium-loader-dot 2.9s ease-in-out infinite',
            }}
          />
        </svg>
      </div>

      <p className="relative mt-8 text-sm font-light tracking-wide text-white/30">{label}</p>
      {message ? <span className="sr-only">{message}</span> : null}
    </div>
  )
}

export function PremiumLoadingScreen(props: Omit<PremiumLoaderProps, 'variant'>) {
  return <PremiumLoader {...props} variant="screen" />
}
