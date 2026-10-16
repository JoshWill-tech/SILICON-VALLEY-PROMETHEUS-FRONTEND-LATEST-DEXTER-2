'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { InlineLoadingAnimation } from '@/components/loading-animation'
import { ConnectedAccountsExperience } from '@/components/settings/connected-accounts-experience'
import { SettingsDetailShell } from '@/components/settings/settings-detail-shell'
import { getProviderMetadata } from '@/lib/oauth/provider-metadata'

function SocialAccountsContent() {
  const searchParams = useSearchParams()
  const connectedProvider = searchParams.get('connected') || searchParams.get('success')
  const errorCode = searchParams.get('error')
  const errorProvider = searchParams.get('provider') || connectedProvider
  const handledRef = React.useRef<string | null>(null)
  const [connectingProvider, setConnectingProvider] = React.useState<string | null>(null)

  React.useEffect(() => {
    const currentKey = `${connectedProvider || ''}:${errorCode || ''}:${errorProvider || ''}`
    if (handledRef.current === currentKey) return
    handledRef.current = currentKey

    if (connectedProvider) {
      const providerName = getProviderMetadata(connectedProvider)?.name ?? connectedProvider
      toast.success(`${providerName} connected successfully`)
    }

    if (errorCode) {
      const providerName = errorProvider ? getProviderMetadata(errorProvider)?.name ?? errorProvider : 'provider'
      const message = errorCode === 'invalid_state'
        ? 'The provider returned an invalid security state. No account was connected; try again.'
        : errorCode === 'integration_unavailable'
          ? `${providerName} is not configured for this deployment yet.`
          : errorCode === 'access_denied'
            ? `${providerName} authorization was canceled. No account changes were made.`
            : errorCode === 'expired_state'
              ? `${providerName} authorization expired before it finished. Try connecting again.`
              : `Could not connect ${providerName}. No connected account was confirmed; try again.`
      toast.error(message)
    }

    if (connectedProvider || errorCode) {
      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.delete('connected')
      nextUrl.searchParams.delete('success')
      nextUrl.searchParams.delete('error')
      nextUrl.searchParams.delete('provider')
      nextUrl.searchParams.delete('reason')
      window.history.replaceState({}, '', nextUrl.toString())
    }
  }, [connectedProvider, errorCode, errorProvider])

  const handleConnect = React.useCallback(async (provider: string) => {
    if (connectingProvider) return
    setConnectingProvider(provider)
    try {
      const response = await fetch(`/api/oauth/${encodeURIComponent(provider)}/initiate`, { method: 'POST', cache: 'no-store' })
      const payload = await response.json().catch(() => null) as { url?: string; error?: string } | null
      if (!response.ok || !payload?.url) throw new Error(payload?.error || 'The authorization service did not return a provider URL.')
      window.location.assign(payload.url)
    } catch (error) {
      const providerName = getProviderMetadata(provider)?.name ?? provider
      toast.error(`Could not start ${providerName}: ${error instanceof Error ? error.message : 'connection service unavailable'}`)
      setConnectingProvider(null)
    }
  }, [connectingProvider])

  return <ConnectedAccountsExperience onConnect={handleConnect} connectingProvider={connectingProvider} />
}

export default function SocialAccountsPage() {
  return (
    <SettingsDetailShell
      eyebrow="Publishing"
      title="Connected accounts"
      description="Manage the channels Prometheus can publish to on your behalf."
      contentClassName="max-w-[1120px]"
    >
      <React.Suspense
        fallback={
          <div className="flex min-h-80 justify-center p-10">
            <InlineLoadingAnimation size={120} label="Loading connected accounts" />
          </div>
        }
      >
        <SocialAccountsContent />
      </React.Suspense>
    </SettingsDetailShell>
  )
}
