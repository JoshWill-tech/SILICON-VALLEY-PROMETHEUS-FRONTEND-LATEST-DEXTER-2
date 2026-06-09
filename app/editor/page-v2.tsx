'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { AmbientGlow } from '@/components/editor/AmbientGlow'
import { BeatMapper } from '@/components/editor/BeatMapper'
import { EditorLoadingScreen } from '@/components/editor/editor-loading-screen'
import { LiquidChromeOrb } from '@/components/editor/LiquidChromeOrb'
import { MotionBrainPanel } from '@/components/editor/MotionBrainPanel'
import { SemanticVectorGrid } from '@/components/editor/SemanticVectorGrid'
import { useEditor } from '@/components/editor/EditorProvider'
import { WorkspaceCanvas } from '@/components/editor/WorkspaceCanvas'
import { EditorMobileWorkspaceV2 } from '@/app/components/editor/mobile/EditorMobileWorkspaceV2'
import { projects } from '@/lib/projects'

const mockBeats = [
  { time: 0.7, type: 'emphasis', intensity: 0.9 },
  { time: 1.6, type: 'build', intensity: 0.7 },
  { time: 2.4, type: 'climax', intensity: 1 },
]

const mockVectors = [
  { word: 'Welcome', embedding: [0.1, 0.2, 0.3, 0.4], timestamp: 0 },
  { word: 'to', embedding: [0.2, 0.1, 0.4, 0.3], timestamp: 0.5 },
  { word: 'Prometheus', embedding: [0.9, 0.8, 0.7, 0.6], timestamp: 0.7 },
  { word: 'future', embedding: [0.7, 0.6, 0.8, 0.9], timestamp: 1.6 },
  { word: 'content', embedding: [0.8, 0.9, 0.6, 0.7], timestamp: 2.4 },
]

export default function EditorPageV2() {
  const searchParams = useSearchParams()
  const { projectId } = useEditor()
  const canvasRef = useRef<HTMLDivElement>(null)
  const beatTargetRef = canvasRef as RefObject<HTMLElement | null>

  if (searchParams.get('redirect') === 'project') {
    return <ProjectRedirectFallbackV2 />
  }

  const canvas = (
    <div className="relative flex h-full w-full overflow-hidden">
      <AmbientGlow />
      <LiquidChromeOrb />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div ref={canvasRef} className="relative min-h-0 flex-1">
          <WorkspaceCanvas />
          <BeatMapper beats={mockBeats} targetRef={beatTargetRef} />
        </div>

        <div className="glass-panel h-48 border-t border-border-subtle p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
              Semantic Vector Space
            </span>
            <span className="text-xs text-text-tertiary">
              {mockVectors.length} tokens {projectId ? `/${projectId}` : ''}
            </span>
          </div>
          <SemanticVectorGrid vectors={mockVectors} />
        </div>
      </div>

      <div className="relative z-10 hidden md:block">
        <MotionBrainPanel />
      </div>
    </div>
  )

  return (
    <>
      <div className="hidden h-full w-full md:block">{canvas}</div>
      <EditorMobileWorkspaceV2 projectTitle={projectId ? `Project ${projectId}` : 'Untitled Project'}>
        {canvas}
      </EditorMobileWorkspaceV2>
    </>
  )
}

function ProjectRedirectFallbackV2() {
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
