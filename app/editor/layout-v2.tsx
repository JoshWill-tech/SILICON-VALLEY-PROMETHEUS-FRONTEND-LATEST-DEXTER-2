import type { ReactNode } from 'react'

import { EditorProvider } from '@/components/editor/EditorProvider'
import { EditorRouteShell } from '@/components/editor/EditorRouteShell'

export const metadata = {
  title: 'Prometheus Editor',
  description: 'AI-powered motion intelligence workspace with mobile editor tools drawer',
}

export default function EditorLayoutV2({ children }: { children: ReactNode }) {
  return (
    <EditorProvider>
      <EditorRouteShell>{children}</EditorRouteShell>
    </EditorProvider>
  )
}
