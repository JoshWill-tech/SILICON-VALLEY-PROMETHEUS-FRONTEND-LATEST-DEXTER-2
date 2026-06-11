'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { getMostRecentProject } from '@/lib/mock'

export default function EditorIndexPage() {
  const router = useRouter()

  React.useEffect(() => {
    const recentProject = getMostRecentProject()
    router.replace(recentProject ? `/editor/${recentProject.id}` : '/projects')
  }, [router])

  return null
}
