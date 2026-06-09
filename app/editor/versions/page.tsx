'use client'

import { GitBranch } from 'lucide-react'

import { MobileEditorPageShell } from '@/app/editor/components/mobile-editor-page-shell'

export default function EditorVersionsPage() {
  return (
    <MobileEditorPageShell title="Versions" description="Placeholder" icon={GitBranch}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-white/40">
        <GitBranch className="mb-4 size-12 opacity-30" />
        <p className="text-sm">Versions coming soon</p>
      </div>
    </MobileEditorPageShell>
  )
}
