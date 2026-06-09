'use client'

import { MessageSquare } from 'lucide-react'

import { MobileEditorPageShell } from '@/app/editor/components/mobile-editor-page-shell'

export default function EditorChatPage() {
  return (
    <MobileEditorPageShell title="Chat" description="Placeholder" icon={MessageSquare}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-white/40">
        <MessageSquare className="mb-4 size-12 opacity-30" />
        <p className="text-sm">Chat coming soon</p>
      </div>
    </MobileEditorPageShell>
  )
}
