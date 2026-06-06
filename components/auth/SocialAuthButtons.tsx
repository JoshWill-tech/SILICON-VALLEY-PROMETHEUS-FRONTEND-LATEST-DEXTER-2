'use client'

import * as React from 'react'
import { GithubIcon, ArrowRight, Chrome, Apple } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { getSiteOrigin, normalizeNextPath } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/client'
import { normalizeUxError } from '@/lib/ux/errors'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type SocialProvider = 'google' | 'apple' | 'github'

const SOCIAL_OPTIONS: Array<{
  provider: SocialProvider
  label: string
  Icon: React.ComponentType<{ className?: string }>
}> = [
  { provider: 'google', label: 'Continue with Google', Icon: Chrome },
  { provider: 'apple', label: 'Continue with Apple', Icon: Apple },
  { provider: 'github', label: 'Continue with GitHub', Icon: GithubIcon },
]

const SUPABASE_CLIENT_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)

export function SocialAuthButtons() {
  const searchParams = useSearchParams()
  const [busyProvider, setBusyProvider] = React.useState<SocialProvider | null>(null)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [slowProvider, setSlowProvider] = React.useState<SocialProvider | null>(null)

  const nextPath = normalizeNextPath(searchParams.get('next'))

  React.useEffect(() => {
    const resetBusyState = () => {
      setBusyProvider(null)
    }
    window.addEventListener('pageshow', resetBusyState)
    return () => window.removeEventListener('pageshow', resetBusyState)
  }, [])

  const handleOAuth = React.useCallback(
    async (provider: SocialProvider) => {
      if (!SUPABASE_CLIENT_READY) {
        const message = 'Secure sign-in unavailable. Use email for now.'
        setServerError(message)
        toast.error('Identity provider unavailable', { description: message })
        return
      }

      setBusyProvider(provider)
      setSlowProvider(null)
      setServerError(null)
      const slowTimer = window.setTimeout(() => {
        setSlowProvider(provider)
      }, 3000)

      try {
        const supabase = createClient()
        const origin = getSiteOrigin()
        const redirectTo = new URL('/auth/confirm', origin)

        if (nextPath !== '/') {
          redirectTo.searchParams.set('next', nextPath)
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectTo.toString(),
            queryParams: provider === 'google' ? {
              prompt: 'select_account',
            } : undefined,
          },
        })

        if (error) throw error
      } catch (error) {
        const message = normalizeUxError(error, 'oauth')
        setServerError(message)
        toast.error('Identity handoff paused', { description: message })
        setBusyProvider(null)
        setSlowProvider(null)
      } finally {
        window.clearTimeout(slowTimer)
      }
    },
    [nextPath],
  )

  return (
    <div className="space-y-3">
      {SOCIAL_OPTIONS.map(({ provider, label, Icon }) => (
        <Button
          key={provider}
          type="button"
          disabled={busyProvider !== null}
          className="relative h-14 w-full rounded-full bg-white/5 border border-white/10 px-6 font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between shadow-none"
          onClick={() => void handleOAuth(provider)}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/70">
              <Icon className="size-4" />
            </div>
            <span>{busyProvider === provider ? (slowProvider === provider ? 'Connecting...' : 'Redirecting...') : label}</span>
          </div>
          <ArrowRight className="size-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Button>
      ))}

      {serverError ? <div className="text-xs text-red-500/80 px-2">{serverError}</div> : null}
    </div>
  )
}
