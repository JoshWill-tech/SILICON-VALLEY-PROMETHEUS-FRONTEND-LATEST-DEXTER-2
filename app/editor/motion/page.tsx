'use client'

import { Zap } from 'lucide-react'

import { MobileEditorPageShell } from '@/app/editor/components/mobile-editor-page-shell'

export default function MotionBrainPage() {
  return (
    <MobileEditorPageShell title="Motion Brain" description="Primary mobile motion workspace" icon={Zap}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-white/40">
        <Zap className="mb-4 size-12 opacity-30" />
        <p className="text-sm">Motion Brain workspace coming soon</p>
      </div>
    </MobileEditorPageShell>
  )
}
