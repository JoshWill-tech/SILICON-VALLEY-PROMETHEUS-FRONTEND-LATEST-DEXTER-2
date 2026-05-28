'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { EditorLoadingScreen } from '@/components/editor/editor-loading-screen'
import { projects } from '@/lib/projects'

export default function EditorLandingPage() {
  const router = useRouter()
  const didNavigateRef = useRef(false)

  useEffect(() => {
    if (didNavigateRef.current) return
    didNavigateRef.current = true

    const project = projects.list()[0] ?? projects.create({ title: 'Untitled Project' })
    const editorHref = `/editor/${project.id}`

    router.replace(editorHref)
  }, [router])

  return <EditorLoadingScreen caption="Loading..." />
}
