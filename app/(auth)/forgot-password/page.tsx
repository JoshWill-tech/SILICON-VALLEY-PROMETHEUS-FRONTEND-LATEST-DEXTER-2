import { AuthShell } from '@/components/auth/AuthShell'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { Suspense } from 'react'

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Forgot password?</h1>
          <p className="text-white/50 text-base">No worries, we'll send you a recovery link.</p>
        </div>
        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </AuthShell>
  )
}
