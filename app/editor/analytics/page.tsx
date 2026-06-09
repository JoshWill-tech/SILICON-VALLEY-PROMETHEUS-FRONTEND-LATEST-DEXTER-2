'use client'

import { BarChart3 } from 'lucide-react'

import { MobileEditorPageShell } from '@/app/editor/components/mobile-editor-page-shell'

export default function EditorAnalyticsPage() {
  return (
    <MobileEditorPageShell title="Analytics" description="Placeholder" icon={BarChart3}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-white/40">
        <BarChart3 className="mb-4 size-12 opacity-30" />
        <p className="text-sm">Analytics coming soon</p>
      </div>
    </MobileEditorPageShell>
  )
}
