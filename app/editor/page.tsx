'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { EditorLoadingScreen } from '@/components/editor/editor-loading-screen'
import { EditorStage } from '@/app/editor/components/editor-stage'
import { projects } from '@/lib/projects'

export default function EditorPage() {
  const searchParams = useSearchParams()

  if (searchParams.get('redirect') === 'project') {
    return <ProjectRedirectFallback />
  }

  return <EditorStage />
}

function ProjectRedirectFallback() {
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
