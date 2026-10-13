'use client'

import { useRouter } from 'next/navigation'
import { PrometheusShell } from '@/components/prometheus-shell'
import { PageHeader } from '@/components/page-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export default function TeamPage() {
  const router = useRouter()
  const workspaceHref = '/settings?panel=workspace'

  return (
    <PrometheusShell header={<PageHeader title="Team" description="Team collaboration is not available yet." showBackButton backHref={workspaceHref} onBack={() => router.push(workspaceHref)} />}>
      <div className="px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Team collaboration</CardTitle>
            <CardDescription>Invites, roles, and shared access will appear here when available.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/60">
              Continue creating in your workspace. Team management is currently unavailable.
            </div>
          </CardContent>
        </Card>
      </div>
    </PrometheusShell>
  )
}
