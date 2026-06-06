import { AuthShell } from '@/components/auth/AuthShell'
import { VerifyForm } from '@/components/auth/VerifyForm'
import { Suspense } from 'react'

export default function VerifyPage() {
  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Confirm your email</h1>
          <p className="text-white/50 text-base">We sent a magic link to your inbox.</p>
        </div>
        <Suspense fallback={null}>
          <VerifyForm />
        </Suspense>
      </div>
    </AuthShell>
  )
}
