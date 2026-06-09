'use client'

import { Activity } from 'lucide-react'

import { MobileEditorPageShell } from '@/app/editor/components/mobile-editor-page-shell'

export default function EditorStatusPage() {
  return (
    <MobileEditorPageShell title="Status" description="Placeholder" icon={Activity}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-white/40">
        <Activity className="mb-4 size-12 opacity-30" />
        <p className="text-sm">Status coming soon</p>
      </div>
    </MobileEditorPageShell>
  )
}
