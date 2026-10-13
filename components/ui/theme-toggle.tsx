'use client'

import { Moon, MoonStar, Sun } from 'lucide-react'

import { useThemePreferenceStore } from '@/lib/theme/theme-store'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  variant?: 'switch' | 'icon'
}

export function ThemeToggle({ className, variant = 'switch' }: ThemeToggleProps = {}) {
  const colorMode = useThemePreferenceStore((state) => state.colorMode)
  const setColorMode = useThemePreferenceStore((state) => state.setColorMode)
  const isDark = colorMode === 'dark'
  const Icon = isDark ? MoonStar : Sun

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setColorMode(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
        variant === 'icon'
          ? 'w-11 text-white/80 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white motion-reduce:transition-none'
          : 'w-16',
        className,
      )}
    >
      {variant === 'icon' ? (
        <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
      ) : (
        <span
          aria-hidden="true"
          data-theme-independent="control"
          className={cn(
            'flex h-8 w-16 rounded-full border p-1 transition-colors duration-300 motion-reduce:transition-none',
            isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white',
          )}
        >
          <span className="flex w-full items-center justify-between">
            <span
              data-theme-toggle-thumb=""
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none',
                isDark ? 'translate-x-0 bg-zinc-800' : 'translate-x-8 bg-gray-200',
              )}
            >
              {isDark ? (
                <Moon className="h-4 w-4 text-white" strokeWidth={1.5} />
              ) : (
                <Sun className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
              )}
            </span>
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none',
                isDark ? 'bg-transparent' : '-translate-x-8',
              )}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
              ) : (
                <Moon className="h-4 w-4 text-black" strokeWidth={1.5} />
              )}
            </span>
          </span>
        </span>
      )}
    </button>
  )
}
