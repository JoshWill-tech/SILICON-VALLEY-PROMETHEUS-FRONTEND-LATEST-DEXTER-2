'use client'

import * as React from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { usePathname } from 'next/navigation'

import { useDeviceTier } from '@/hooks/useDeviceTier'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWebGLSupport } from '@/hooks/useWebGLSupport'
import { DEFAULT_SCENE_MANAGER_CONFIG, getDeviceWebglTier } from '@/lib/webgl/config'
import { getSceneDpr, getSceneRouteFlags, isMobileWebglMode } from '@/lib/webgl/scene-routing'
import { cn } from '@/lib/utils'

import { DashboardParticles } from './DashboardParticles'
import { EditorGrid } from './EditorGrid'
import { HeroGradient } from './HeroGradient'
import { PostProcessingPipeline } from './PostProcessingPipeline'

export interface SceneManagerProps {
  className?: string
  enableBackground?: boolean
  enableOverlay?: boolean
}

function InvisiblePlane() {
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

export function SceneManager({
  className,
  enableBackground = true,
  enableOverlay = false,
}: SceneManagerProps) {
  const pathname = usePathname()
  const deviceTier = useDeviceTier()
  const reduceMotion = useReducedMotion()
  const webglEnabled = useWebGLSupport()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !webglEnabled) return null

  const derivedTier = getDeviceWebglTier({
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : null,
    prefersReducedMotion: reduceMotion,
  })
  const mobileMode =
    deviceTier === 'low' ||
    derivedTier === 'lite' ||
    (typeof navigator !== 'undefined' && isMobileWebglMode(navigator.hardwareConcurrency))
  const dpr = getSceneDpr({
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    maxDpr: DEFAULT_SCENE_MANAGER_CONFIG.maxDpr,
    mobileMode,
  })
  const routeFlags = getSceneRouteFlags(pathname)

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)}
    >
      {enableBackground ? (
        <Canvas
          className="pointer-events-none absolute inset-0"
          dpr={dpr}
          gl={{
            alpha: true,
            antialias: deviceTier !== 'low',
            powerPreference: 'high-performance',
          }}
          frameloop={reduceMotion ? 'never' : 'always'}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color('#000000'), 0)
          }}
        >
          {routeFlags.hero ? <HeroGradient /> : null}
          {routeFlags.dashboard ? <DashboardParticles /> : null}
          {routeFlags.editor ? <EditorGrid /> : null}
          <PostProcessingPipeline enabled={!reduceMotion} reduceMotion={reduceMotion} />
        </Canvas>
      ) : null}

      {enableOverlay ? (
        <Canvas
          className="pointer-events-none absolute inset-0"
          dpr={dpr}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
          }}
          frameloop={reduceMotion ? 'never' : 'always'}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color('#000000'), 0)
          }}
        >
          <InvisiblePlane />
        </Canvas>
      ) : null}
    </div>
  )
}
