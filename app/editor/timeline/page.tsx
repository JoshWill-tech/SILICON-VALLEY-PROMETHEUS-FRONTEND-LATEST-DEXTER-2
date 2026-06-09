'use client'

import { Clock3 } from 'lucide-react'

import { MobileEditorPageShell } from '@/app/editor/components/mobile-editor-page-shell'

export default function EditorTimelinePage() {
  return (
    <MobileEditorPageShell title="Timeline" description="Placeholder" icon={Clock3}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-white/40">
        <Clock3 className="mb-4 size-12 opacity-30" />
        <p className="text-sm">Timeline coming soon</p>
      </div>
    </MobileEditorPageShell>
  )
}
