'use client'

import * as React from 'react'

import { EditorRouteShellMediaV2 } from '@/components/editor/editor-route-shell-media-v2'
import { EditorProvider } from '@/components/editor/EditorProvider'
import { useEditorSession } from '@/hooks/use-editor-session'

function EditorSessionBridge() {
  const { restoring } = useEditorSession()
  return <span data-editor-session-restoring={restoring ? 'true' : 'false'} hidden />
}

export default function EditorLayoutV2({ children }: { children: React.ReactNode }) {
  return (
    <EditorProvider>
      <EditorSessionBridge />
      <EditorRouteShellMediaV2>{children}</EditorRouteShellMediaV2>
    </EditorProvider>
  )
}
