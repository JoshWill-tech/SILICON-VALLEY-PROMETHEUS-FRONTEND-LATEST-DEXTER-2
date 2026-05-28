'use client'

import * as React from 'react'
import { gsap } from 'gsap'

import { cn } from '@/lib/utils'

type Hero3DGeometricLoaderProps = {
  className?: string
  label?: string
  message?: string
}

type ThreeModule = typeof import('three')
type ThreeBufferGeometry = import('three').BufferGeometry
type ThreeMaterial = import('three').Material

const SHARD_LAYOUT = [
  { x: -1.32, y: 0.36, z: -0.2, rx: 0.42, ry: -0.28, rz: -0.72, scale: 0.46 },
  { x: 1.28, y: -0.12, z: -0.18, rx: -0.36, ry: 0.4, rz: 0.66, scale: 0.4 },
  { x: -0.54, y: -0.94, z: 0.1, rx: -0.82, ry: -0.16, rz: 0.2, scale: 0.32 },
  { x: 0.52, y: 0.96, z: 0.08, rx: 0.78, ry: 0.2, rz: -0.24, scale: 0.3 },
  { x: 0.0, y: -1.26, z: -0.3, rx: -1.1, ry: 0.12, rz: 0.06, scale: 0.24 },
] as const

function supportsWebGL() {
  if (typeof window === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      (window.WebGL2RenderingContext && canvas.getContext('webgl2')) ||
        (window.WebGLRenderingContext && canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(query.matches)

    update()
    query.addEventListener('change', update)

    return () => query.removeEventListener('change', update)
  }, [])

  return prefersReducedMotion
}

function disposeAll(geometries: ThreeBufferGeometry[], materials: ThreeMaterial[]) {
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}

function createHeroAsset(THREE: ThreeModule) {
  const group = new THREE.Group()
  const geometries: ThreeBufferGeometry[] = []
  const materials: ThreeMaterial[] = []

  const glass = new THREE.MeshPhysicalMaterial({
    color: '#10151c',
    emissive: '#010307',
    emissiveIntensity: 0.18,
    metalness: 0.66,
    roughness: 0.18,
    clearcoat: 0.86,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.98,
    reflectivity: 0.78,
    ior: 1.75,
    transmission: 0.04,
  })
  materials.push(glass)

  const coreGeometry = new THREE.IcosahedronGeometry(1, 1)
  geometries.push(coreGeometry)

  const core = new THREE.Mesh(coreGeometry, glass)
  core.castShadow = false
  core.receiveShadow = false
  group.add(core)

  const edgeGeometry = new THREE.EdgesGeometry(coreGeometry, 28)
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: '#e4f1ff',
    transparent: true,
    opacity: 0.5,
  })
  geometries.push(edgeGeometry)
  materials.push(edgeMaterial)

  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
  edges.scale.setScalar(1.006)
  group.add(edges)

  const wireGeometry = new THREE.IcosahedronGeometry(1.012, 1)
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: '#8fbfff',
    transparent: true,
    opacity: 0.075,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  geometries.push(wireGeometry)
  materials.push(wireMaterial)

  const wire = new THREE.Mesh(wireGeometry, wireMaterial)
  group.add(wire)

  const coreGlowGeometry = new THREE.IcosahedronGeometry(0.74, 1)
  const coreGlowMaterial = new THREE.MeshBasicMaterial({
    color: '#d8ecff',
    transparent: true,
    opacity: 0.035,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  geometries.push(coreGlowGeometry)
  materials.push(coreGlowMaterial)

  const coreGlow = new THREE.Mesh(coreGlowGeometry, coreGlowMaterial)
  group.add(coreGlow)

  const shardGeometry = new THREE.TetrahedronGeometry(0.48, 0)
  const shardEdgeGeometry = new THREE.EdgesGeometry(shardGeometry, 16)
  geometries.push(shardGeometry)
  geometries.push(shardEdgeGeometry)

  SHARD_LAYOUT.forEach((shard) => {
    const mesh = new THREE.Mesh(shardGeometry, glass)
    mesh.position.set(shard.x, shard.y, shard.z)
    mesh.rotation.set(shard.rx, shard.ry, shard.rz)
    mesh.scale.setScalar(shard.scale)
    group.add(mesh)

    const shardEdges = new THREE.LineSegments(shardEdgeGeometry, edgeMaterial)
    shardEdges.position.copy(mesh.position)
    shardEdges.rotation.copy(mesh.rotation)
    shardEdges.scale.setScalar(shard.scale * 0.48)
    group.add(shardEdges)
  })

  return { group, geometries, materials }
}

function FallbackGeometry({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-500',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="relative h-[clamp(10rem,28vw,21rem)] w-[clamp(10rem,28vw,21rem)]">
        <div className="absolute inset-[18%] rotate-45 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(20,24,30,0.92)_28%,rgba(0,0,0,0.98)_70%,rgba(181,209,238,0.18))] shadow-[0_0_44px_rgba(190,220,255,0.12)] [clip-path:polygon(50%_0%,92%_28%,82%_82%,50%_100%,18%_82%,8%_28%)]" />
        <div className="absolute left-[22%] top-[18%] h-16 w-16 -rotate-12 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(8,10,14,0.96))] [clip-path:polygon(50%_0%,100%_100%,0%_76%)]" />
        <div className="absolute bottom-[20%] right-[18%] h-14 w-14 rotate-12 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(7,9,12,0.98))] [clip-path:polygon(50%_0%,100%_100%,0%_76%)]" />
      </div>
    </div>
  )
}

export function Hero3DGeometricLoader({
  className,
  label = 'Loading...',
  message = 'Preparing the workspace.',
}: Hero3DGeometricLoaderProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [webglFailed, setWebglFailed] = React.useState(false)
  const rootRef = React.useRef<HTMLElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const atmosphereRef = React.useRef<HTMLDivElement | null>(null)
  const textRef = React.useRef<HTMLParagraphElement | null>(null)
  const textMaskRef = React.useRef<HTMLDivElement | null>(null)
  const bloomRef = React.useRef<HTMLDivElement | null>(null)
  const fallbackRef = React.useRef<HTMLDivElement | null>(null)
  const ariaLabel = message ? `${label} ${message}` : label

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const atmosphere = atmosphereRef.current
    const text = textRef.current
    const textMask = textMaskRef.current
    const bloom = bloomRef.current
    const fallback = fallbackRef.current

    if (!root || !canvas || !atmosphere || !text || !textMask || !bloom || !fallback) return

    let disposed = false
    let animationFrame = 0
    let resizeObserver: ResizeObserver | null = null
    let renderer: import('three').WebGLRenderer | null = null
    let removeResizeListener: (() => void) | null = null
    let removeContextLostListener: (() => void) | null = null
    const timelineItems: gsap.core.Animation[] = []
    const geometries: ThreeBufferGeometry[] = []
    const materials: ThreeMaterial[] = []

    const revealFallback = () => {
      if (disposed) return

      setWebglFailed(true)
      gsap.set(canvas, { autoAlpha: 0 })
      gsap.set(atmosphere, { autoAlpha: 1 })
      gsap.set(bloom, { autoAlpha: 0.64 })
      gsap.set(fallback, { autoAlpha: 1, scale: 1 })
      gsap.set(textMask, { autoAlpha: 1 })
      gsap.set(text, {
        autoAlpha: 0.58,
        clipPath: 'inset(0% 0% 0% 0%)',
        filter: 'blur(0px)',
        y: 0,
      })
    }

    if (!supportsWebGL()) {
      revealFallback()
      return () => {
        disposed = true
      }
    }

    gsap.set([atmosphere, bloom, textMask, fallback], { autoAlpha: 0 })
    gsap.set(text, {
      autoAlpha: 0,
      clipPath: 'inset(0% 48% 0% 48%)',
      filter: 'blur(18px)',
      y: 8,
    })

    const contextLostHandler = (event: Event) => {
      event.preventDefault()
      revealFallback()
    }

    canvas.addEventListener('webglcontextlost', contextLostHandler, false)
    removeContextLostListener = () => {
      canvas.removeEventListener('webglcontextlost', contextLostHandler, false)
    }

    void import('three')
      .then((THREE) => {
        if (disposed) return

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
        camera.position.set(0, 0, 5.4)

        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          depth: true,
          stencil: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        })
        renderer.setClearColor(0x000000, 0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.94

        const ambient = new THREE.AmbientLight(0x8290a4, 0.08)
        const rim = new THREE.DirectionalLight(0xe8f2ff, 0.18)
        rim.position.set(-4.2, 3.6, 4.8)
        const edge = new THREE.DirectionalLight(0x8fbfff, 0.74)
        edge.position.set(3.8, -2.4, 2.2)
        scene.add(ambient, rim, edge)

        const asset = createHeroAsset(THREE)
        geometries.push(...asset.geometries)
        materials.push(...asset.materials)
        asset.group.position.set(0, 0.02, -7.4)
        asset.group.rotation.set(-0.68, 0.78, -0.18)
        asset.group.scale.setScalar(0.001)
        scene.add(asset.group)

        const syncSize = () => {
          if (!renderer || disposed) return

          const width = Math.max(root.clientWidth, 1)
          const height = Math.max(root.clientHeight, 1)
          renderer.setSize(width, height, false)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.render(scene, camera)
        }

        const render = () => {
          if (!renderer || disposed) return

          renderer.render(scene, camera)
          animationFrame = window.requestAnimationFrame(render)
        }

        const ResizeObserverConstructor = window.ResizeObserver
        if (ResizeObserverConstructor) {
          resizeObserver = new ResizeObserverConstructor(syncSize)
          resizeObserver.observe(root)
        } else {
          window.addEventListener('resize', syncSize)
          removeResizeListener = () => window.removeEventListener('resize', syncSize)
        }

        syncSize()

        if (prefersReducedMotion) {
          asset.group.position.z = 0
          asset.group.rotation.set(-0.18, 0.12, 0)
          asset.group.scale.setScalar(1)
          ambient.intensity = 0.16
          rim.intensity = 2.85
          edge.intensity = 1.05
          gsap.set(canvas, { autoAlpha: 1 })
          gsap.set(atmosphere, { autoAlpha: 1 })
          gsap.set(bloom, { autoAlpha: 0.5 })
          gsap.set(textMask, { autoAlpha: 1 })
          gsap.set(text, {
            autoAlpha: 0.58,
            clipPath: 'inset(0% 0% 0% 0%)',
            filter: 'blur(0px)',
            y: 0,
          })
          renderer.render(scene, camera)
          return
        }

        const intro = gsap.timeline()

        intro
          // Phase A: anticipation pressure, 0.25s.
          .to(atmosphere, { autoAlpha: 0.55, duration: 0.25, ease: 'power1.in' }, 0)
          .to(bloom, { autoAlpha: 0.22, duration: 0.25, ease: 'power1.in' }, 0)
          .to(rim, { intensity: 0.72, duration: 0.25, ease: 'power1.in' }, 0)
          // Phase B: z-axis ingress, 1.1s, heavy deceleration.
          .to(asset.group.position, { z: 0, duration: 1.1, ease: 'expo.out' }, 0.25)
          .to(asset.group.scale, { x: 1.04, y: 1.04, z: 1.04, duration: 1.1, ease: 'expo.out' }, 0.25)
          .to(asset.group.rotation, { x: -0.2, y: 0.18, z: 0.02, duration: 1.1, ease: 'expo.out' }, 0.25)
          .to(rim, { intensity: 4.2, duration: 0.7, ease: 'power2.out' }, 0.25)
          .to(edge, { intensity: 1.2, duration: 0.7, ease: 'power2.out' }, 0.25)
          .to(canvas, { autoAlpha: 1, duration: 0.18, ease: 'power1.out' }, 0.25)
          // Phase C: text reveal starts 0.2s after ingress begins.
          .to(textMask, { autoAlpha: 1, duration: 0.01 }, 0.45)
          .to(
            text,
            {
              autoAlpha: 0.58,
              clipPath: 'inset(0% 0% 0% 0%)',
              filter: 'blur(0px)',
              y: 0,
              duration: 0.82,
              ease: 'power3.out',
            },
            0.45,
          )
          .to(bloom, { autoAlpha: 0.72, duration: 0.74, ease: 'power2.out' }, 0.48)
          // Phase D: hero lock with minimal overshoot.
          .to(asset.group.scale, { x: 1, y: 1, z: 1, duration: 0.36, ease: 'power3.out' }, 1.35)
          .to(asset.group.rotation, { x: -0.18, y: 0.12, z: 0, duration: 0.4, ease: 'power3.out' }, 1.35)
          .to(rim, { intensity: 2.85, duration: 0.36, ease: 'power3.out' }, 1.35)
          .to(bloom, { autoAlpha: 0.52, duration: 0.38, ease: 'power3.out' }, 1.35)

        const idle = gsap.timeline({
          paused: true,
          repeat: -1,
          yoyo: true,
          defaults: { ease: 'sine.inOut' },
        })

        idle
          // Phase E: almost-invisible idle life after 1.6s.
          .to(asset.group.rotation, { x: -0.198, y: 0.17, z: 0.006, duration: 5.4 }, 0)
          .to(asset.group.scale, { x: 1.006, y: 1.006, z: 1.006, duration: 4.6 }, 0)
          .to(rim.position, { x: -3.8, y: 3.28, duration: 5.4 }, 0)
          .to(bloom, { autoAlpha: 0.6, duration: 4.6 }, 0)

        intro.call(() => idle.play(0), undefined, 1.6)
        timelineItems.push(intro, idle)
        render()
      })
      .catch(revealFallback)

    return () => {
      disposed = true
      timelineItems.forEach((item) => item.kill())
      window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      removeResizeListener?.()
      removeContextLostListener?.()
      renderer?.dispose()
      disposeAll(geometries, materials)
    }
  }, [prefersReducedMotion])

  return (
    <section
      ref={rootRef}
      className={cn(
        'relative isolate min-h-dvh overflow-hidden bg-[#000000] text-white',
        'flex items-center justify-center px-6 py-12',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div aria-hidden className="absolute inset-0 z-0 bg-[#000000]" />

      <div
        ref={atmosphereRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-0"
        style={{
          background:
            'radial-gradient(circle at 50% 44%, rgba(160, 186, 216, 0.14) 0%, rgba(70, 87, 110, 0.07) 24%, rgba(0, 0, 0, 0) 58%)',
        }}
      />

      <div
        ref={textMaskRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-center opacity-0"
      >
        <p
          ref={textRef}
          className="select-none text-center font-sans text-[clamp(3rem,11vw,10rem)] font-light leading-none tracking-normal text-white/[0.58]"
          style={{
            fontFamily: 'var(--font-ui)',
            textShadow: '0 0 34px rgba(210, 226, 244, 0.16)',
          }}
        >
          {label}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 h-full w-full opacity-0"
      />

      <div ref={fallbackRef}>
        <FallbackGeometry visible={webglFailed} />
      </div>

      <div
        ref={bloomRef}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 right-0 z-40 opacity-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(190, 220, 255, 0.075), rgba(255, 255, 255, 0) 18%, rgba(255, 255, 255, 0) 82%, rgba(190, 220, 255, 0.075))',
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.54) 100%), radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0) 32%), repeating-radial-gradient(circle at 18% 22%, rgba(255, 255, 255, 0.11) 0 0.48px, rgba(255, 255, 255, 0) 0.8px 2.6px)',
          mixBlendMode: 'screen',
          opacity: 0.42,
        }}
      />

      <span className="sr-only">{message}</span>
    </section>
  )
}
