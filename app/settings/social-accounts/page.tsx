'use client'

import * as React from 'react'
import {
  CheckCircle2,
  Clock3,
  Facebook,
  Instagram,
  Linkedin,
  Lock,
  Music2,
  ShieldCheck,
  Twitter,
  Youtube,
} from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { PrometheusShell } from '@/components/prometheus-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SocialAccountPlatform = 'linkedin' | 'youtube' | 'instagram' | 'tiktok' | 'x' | 'facebook'

type SocialAccountCard = {
  id: SocialAccountPlatform
  name: string
  accent: string
  toneClass: string
  icon: React.ComponentType<{ className?: string }>
  connectedUsername?: string
  lastSynced: string
}

const SOCIAL_ACCOUNT_CARDS: SocialAccountCard[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    accent: '#0A66C2',
    toneClass: 'from-[#0A66C2]/22 to-[#0A66C2]/4',
    icon: Linkedin,
    connectedUsername: '@prometheusstudio',
    lastSynced: 'Synced 12 minutes ago',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    accent: '#FF0000',
    toneClass: 'from-[#FF0000]/20 to-[#FF0000]/4',
    icon: Youtube,
    lastSynced: 'Not synced yet',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    accent: '#E1306C',
    toneClass: 'from-[#833AB4]/26 via-[#E1306C]/14 to-[#FCAF45]/8',
    icon: Instagram,
    lastSynced: 'Not synced yet',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    accent: '#25F4EE',
    toneClass: 'from-black/60 to-[#25F4EE]/10',
    icon: Music2,
    lastSynced: 'Not synced yet',
  },
  {
    id: 'x',
    name: 'X / Twitter',
    accent: '#FFFFFF',
    toneClass: 'from-white/14 to-black/50',
    icon: Twitter,
    lastSynced: 'Not synced yet',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    accent: '#1877F2',
    toneClass: 'from-[#1877F2]/24 to-[#1877F2]/5',
    icon: Facebook,
    lastSynced: 'Not synced yet',
  },
]

function formatPlatformForConsole(platform: SocialAccountCard) {
  return platform.name.replace(' / Twitter', '')
}

export default function SocialAccountsPage() {
  const [disconnectTarget, setDisconnectTarget] = React.useState<SocialAccountCard | null>(null)

  return (
    <PrometheusShell
      header={<PageHeader title="Social Accounts" description="Connect channels for publishing from Prometheus Studio." />}
    >
      <div className="px-5 py-6 sm:px-8">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-100">
              <Lock className="size-4" />
            </div>
            <div>
              <Badge className="border-emerald-300/20 bg-emerald-400/10 text-emerald-100">
                <ShieldCheck className="mr-1 size-3.5" />
                Tokens encrypted at rest
              </Badge>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/56">
                We never store your passwords. OAuth tokens are encrypted and refreshed automatically.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-white/42">
            <Clock3 className="size-3.5" />
            Last synced: LinkedIn, 12 minutes ago
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIAL_ACCOUNT_CARDS.map((platform) => {
            const Icon = platform.icon
            const connected = Boolean(platform.connectedUsername)

            return (
              <Card
                key={platform.id}
                className={cn(
                  'group overflow-hidden border-white/10 bg-white/[0.025] transition-all duration-200 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.045]',
                  `bg-gradient-to-br ${platform.toneClass}`,
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/24 text-white shadow-[0_18px_48px_-32px_rgba(0,0,0,0.95)]"
                        style={{ color: platform.accent }}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base text-white">{platform.name}</CardTitle>
                        <CardDescription className="mt-1 text-xs">{platform.lastSynced}</CardDescription>
                      </div>
                    </div>
                    {connected ? <CheckCircle2 className="size-5 shrink-0 text-emerald-300" /> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {connected ? (
                    <div className="rounded-xl border border-emerald-300/14 bg-emerald-400/8 px-3 py-2 text-sm text-emerald-50">
                      Connected as <span className="font-medium">{platform.connectedUsername}</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/18 px-3 py-2 text-sm text-white/52">
                      Not connected
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="flex-1"
                      variant={connected ? 'secondary' : 'default'}
                      onClick={() => {
                        // TODO: Backend — OAuth token exchange
                        console.log(`OAuth flow to ${formatPlatformForConsole(platform)} — backend handles token exchange`)
                      }}
                    >
                      {connected ? 'Reconnect' : 'Connect'}
                    </Button>
                    {connected ? (
                      <Button type="button" variant="outline" onClick={() => setDisconnectTarget(platform)}>
                        Disconnect
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {disconnectTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#101116] p-5 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)]">
            <div className="text-lg font-medium">Disconnect {disconnectTarget.name}?</div>
            <p className="mt-2 text-sm leading-6 text-white/54">
              This only removes the local mock connection state. Backend token revocation will run from the account
              service.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDisconnectTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // TODO: Backend — OAuth token exchange
                  console.log(`Disconnect ${disconnectTarget.name} — backend revokes OAuth tokens`)
                  setDisconnectTarget(null)
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PrometheusShell>
  )
}
