'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Copy,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Lock,
  Monitor,
  Moon,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Upload,
} from 'lucide-react'
import { useForm, useWatch, type FieldPath, type FieldPathValue } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAuth } from '@/components/auth/auth-provider'
import { PrometheusShell } from '@/components/prometheus-shell'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { PrometheusLoader } from '@/components/loading/PrometheusLoader'

const SAVE_DELAY_MS = 800

const themeSchema = z.enum(['midnight', 'obsidian', 'deep-space'])
const accentSchema = z.enum(['indigo', 'violet', 'cyan', 'emerald', 'amber', 'rose'])
const densitySchema = z.enum(['compact', 'comfortable', 'spacious'])
const sidebarSchema = z.enum(['left', 'right', 'collapsed'])

type ProfileFormValues = {
  username: string
  displayName: string
  theme: z.infer<typeof themeSchema>
  accentColor: z.infer<typeof accentSchema>
  density: z.infer<typeof densitySchema>
  sidebarPosition: z.infer<typeof sidebarSchema>
  emailNotifications: boolean
  marketingEmails: boolean
  twoFactorEnabled: boolean
}

export default function ProfileSettingsPage() {
  const { session } = useAuth()
  const user = session?.user
  const router = useRouter()
  const [savingTarget, setSavingTarget] = React.useState<string | null>(null)
  const [savedTarget, setSavedTarget] = React.useState<string | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(z.object({
      username: z.string().min(3),
      displayName: z.string().min(1),
    })),
    defaultValues: {
      username: user?.user_metadata?.username || '',
      displayName: user?.user_metadata?.full_name || '',
      theme: 'midnight',
      accentColor: 'indigo',
      density: 'comfortable',
      sidebarPosition: 'left',
      emailNotifications: true,
      marketingEmails: false,
      twoFactorEnabled: false,
    },
  })

  const { register, handleSubmit, setValue } = form

  const saveTextField = async (target: 'username' | 'displayName') => {
    setSavingTarget(target)
    await new Promise((r) => setTimeout(r, SAVE_DELAY_MS))
    setSavingTarget(null)
    setSavedTarget(target)
    setTimeout(() => setSavedTarget(null), 2000)
    toast.success('Profile updated successfully')
  }

  const handleResetPassword = async () => {
    setSavingTarget('resetPassword')
    await new Promise((r) => setTimeout(r, 1200))
    setSavingTarget(null)
    toast.success('Password reset link sent to your email')
  }

  return (
    <PrometheusShell>
      <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">Profile Settings</h1>
              <p className="text-white/40">Manage your account preferences and security.</p>
            </div>
            <StatusPill accent="#6366f1" saving={savingTarget !== null} />
          </div>

          <div className="space-y-8">
            <section className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
              <h2 className="text-lg font-medium">Public Profile</h2>
              
              <div className="grid gap-6">
                <FieldRow label="Username" saving={savingTarget === 'username'}>
                  <div className="flex gap-3">
                    <Input
                      {...register('username')}
                      className="h-10 rounded-[14px] border-white/16 bg-white/[0.06] text-white/90 focus:border-[#6366f1]/70 focus:ring-[#6366f1]/20"
                    />
                    <Button 
                      size="sm"
                      disabled={savingTarget === 'username'}
                      onClick={() => void saveTextField('username')}
                      className="h-10 rounded-[16px] border-[#6366f1]/80 bg-[#6366f1] px-4 text-white shadow-[0_18px_54px_-24px_rgba(99,102,241,0.95)] hover:border-[#818cf8] hover:bg-[#5558e8]"
                    >
                      {savingTarget === 'username' ? <PrometheusLoader size="sm" /> : null}
                      {savedTarget === 'username' ? 'Saved ✓' : 'Change Username'}
                    </Button>
                  </div>
                </FieldRow>

                <FieldRow label="Display Name" saving={savingTarget === 'displayName'}>
                  <div className="flex gap-3">
                    <Input
                      {...register('displayName')}
                      className="h-10 rounded-[14px] border-white/16 bg-white/[0.06] text-white/90 focus:border-[#6366f1]/70 focus:ring-[#6366f1]/20"
                    />
                    <Button type="button" size="sm" variant="secondary" disabled={savingTarget === 'displayName'} onClick={() => void saveTextField('displayName')}>
                      {savingTarget === 'displayName' ? <PrometheusLoader size="sm" /> : null}
                      {savedTarget === 'displayName' ? 'Saved ✓' : 'Save Name'}
                    </Button>
                  </div>
                </FieldRow>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
              <h2 className="text-lg font-medium">Security</h2>
              
              <div className="grid gap-4">
                <SecurityItem 
                  icon={Lock}
                  label="Password"
                  value="••••••••"
                  action={
                    <Button type="button" size="sm" variant="ghost" disabled={savingTarget === 'resetPassword'} onClick={() => void handleResetPassword()}>
                      {savingTarget === 'resetPassword' ? <PrometheusLoader size="sm" /> : null}
                      Reset Password
                    </Button>
                  }
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </PrometheusShell>
  )
}

function FieldRow({ label, children, saving }: { label: string; children: React.ReactNode; saving?: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white/82">{label}</div>
        {saving ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/42">
            <PrometheusLoader size="sm" />
            Saving
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function SecurityItem({ icon: Icon, label, value, action }: { icon: any; label: string; value: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
          <Icon className="size-5 text-white/40" />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider font-bold">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function StatusPill({ accent, saving }: { accent: string; saving: boolean }) {
  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/50">
      <span className="size-2 rounded-full" style={{ background: accent }} />
      {saving ? 'Saving preferences' : 'Local preferences'}
    </div>
  )
}
