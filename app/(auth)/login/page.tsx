import { AuthShell } from '@/components/auth/AuthShell'
import { ProgressiveAuthForm } from '@/components/auth/ProgressiveAuthForm'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ProgressiveAuthForm initialMode="login" />
      </Suspense>
    </AuthShell>
  )
}
