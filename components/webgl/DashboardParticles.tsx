'use client'

import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWebGLSupport } from '@/hooks/useWebGLSupport'
import { isMobileWebglMode } from '@/lib/webgl/scene-routing'

type ParticleDescriptor = {
  basePosition: THREE.Vector3
  scale: number
  phase: number
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function DashboardParticles() {
  const instancedRef = React.useRef<THREE.InstancedMesh | null>(null)
  const dummy = React.useMemo(() => new THREE.Object3D(), [])
  const geometry = React.useMemo(() => new THREE.SphereGeometry(0.018, 12, 12), [])
  const material = React.useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#8cc7ff'),
        transparent: true,
        opacity: 0.18,
      }),
    [],
  )
  const webglSupported = useWebGLSupport()
  const reduceMotion = useReducedMotion()
  const mobileMode =
    typeof navigator !== 'undefined' && isMobileWebglMode(navigator.hardwareConcurrency)

  const particleCount = mobileMode ? 90 : 200
  const particles = React.useMemo<ParticleDescriptor[]>(() => {
    return Array.from({ length: particleCount }, (_, index) => ({
      basePosition: new THREE.Vector3(
        (pseudoRandom(index + 1) - 0.5) * 7.5,
        (pseudoRandom(index + 11) - 0.5) * 5.5,
        -2.5 - pseudoRandom(index + 101) * 2,
      ),
      scale: 0.4 + pseudoRandom(index + 1001) * 1.2,
      phase: (index / particleCount) * Math.PI * 2,
    }))
  }, [particleCount])

  React.useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    if (!instancedRef.current) return

    const time = state.clock.elapsedTime
    particles.forEach((particle, index) => {
      dummy.position.set(
        particle.basePosition.x,
        particle.basePosition.y + (reduceMotion ? 0 : Math.sin(time * 0.18 + particle.phase) * 0.05),
        particle.basePosition.z,
      )
      dummy.scale.setScalar(particle.scale)
      dummy.updateMatrix()
      instancedRef.current?.setMatrixAt(index, dummy.matrix)
    })
    instancedRef.current.instanceMatrix.needsUpdate = true
  })

  if (!webglSupported) return null

  return <instancedMesh ref={instancedRef} args={[geometry, material, particleCount]} />
}
