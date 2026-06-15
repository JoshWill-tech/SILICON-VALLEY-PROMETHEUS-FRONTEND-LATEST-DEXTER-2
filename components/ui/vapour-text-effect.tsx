'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type VapourParticle = {
  x: number
  y: number
  originX: number
  originY: number
  alpha: number
  velocityX: number
  velocityY: number
  drift: number
}

export type PrometheusVapourTextProps = {
  className?: string
  delayMs?: number
  density?: number
  label?: string
  text?: string
}

function sampleTextParticles({
  canvas,
  context,
  text,
  density,
  dpr,
}: {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  text: string
  density: number
  dpr: number
}) {
  const width = canvas.width
  const height = canvas.height
  const fontSize = Math.max(26, Math.floor(height * 0.4))
  const fontFamily = 'var(--font-migra), "Times New Roman", Georgia, serif'

  context.clearRect(0, 0, width, height)
  context.fillStyle = 'rgba(255,255,255,0.96)'
  context.font = `800 ${fontSize}px ${fontFamily}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, width / 2, height * 0.52)

  const imageData = context.getImageData(0, 0, width, height)
  const particles: VapourParticle[] = []
  const sampleStep = Math.max(3, Math.floor(7 - density))

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const alpha = imageData.data[(y * width + x) * 4 + 3]
      if (alpha < 90) continue

      const driftSeed = (x * 0.013 + y * 0.021) % Math.PI
      particles.push({
        x,
        y,
        originX: x,
        originY: y,
        alpha: alpha / 255,
        velocityX: (Math.random() - 0.5) * 0.16 * dpr,
        velocityY: (-0.16 - Math.random() * 0.34) * dpr,
        drift: driftSeed,
      })
    }
  }

  context.clearRect(0, 0, width, height)
  return particles
}

export function PrometheusVapourText({
  className,
  delayMs = 260,
  density = 4.6,
  label = 'Prometheus loading',
  text = 'Prometheus',
}: PrometheusVapourTextProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const particlesRef = React.useRef<VapourParticle[]>([])
  const frameRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!wrapper || !canvas || !context) return

    let disposed = false
    let startedAt = 0
    const dpr = Math.min(2.5, window.devicePixelRatio || 1)

    const renderStatic = () => {
      const rect = wrapper.getBoundingClientRect()
      const width = Math.max(220, Math.floor(rect.width * dpr))
      const height = Math.max(72, Math.floor(rect.height * dpr))

      canvas.width = width
      canvas.height = height
      canvas.style.width = `${Math.round(width / dpr)}px`
      canvas.style.height = `${Math.round(height / dpr)}px`
      particlesRef.current = sampleTextParticles({
        canvas,
        context,
        text,
        density,
        dpr,
      })
    }

    const draw = (timestamp: number) => {
      if (disposed) return
      if (!startedAt) startedAt = timestamp

      const elapsed = timestamp - startedAt
      const delayedProgress = Math.max(0, elapsed - delayMs)
      const vaporProgress = Math.min(1, delayedProgress / 1700)
      const fadeIn = Math.min(1, elapsed / 420)

      context.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particlesRef.current) {
        const wave = Math.sin(vaporProgress * Math.PI * 2 + particle.drift)
        const release = particle.originX / Math.max(1, canvas.width)
        const unlocked = vaporProgress > release * 0.88

        if (unlocked) {
          particle.x += particle.velocityX + wave * 0.09 * dpr
          particle.y += particle.velocityY
          particle.alpha = Math.max(0.04, particle.alpha - 0.006)
        } else {
          particle.x += (particle.originX - particle.x) * 0.08
          particle.y += (particle.originY - particle.y) * 0.08
        }

        context.fillStyle = `rgba(255,255,255,${Math.min(particle.alpha, fadeIn)})`
        context.fillRect(particle.x, particle.y, 1.15 * dpr, 1.15 * dpr)
      }

      if (vaporProgress >= 1) {
        particlesRef.current = particlesRef.current.map((particle) => ({
          ...particle,
          x: particle.originX,
          y: particle.originY,
          alpha: Math.max(0.34, particle.alpha),
        }))
        startedAt = timestamp
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    renderStatic()

    const observer = new ResizeObserver(renderStatic)
    observer.observe(wrapper)
    frameRef.current = requestAnimationFrame(draw)

    return () => {
      disposed = true
      observer.disconnect()
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [delayMs, density, text])

  return (
    <span
      ref={wrapperRef}
      className={cn(
        'relative inline-flex h-16 w-[min(19rem,72vw)] items-center justify-center overflow-visible',
        className,
      )}
      role="status"
      aria-label={label}
      style={{
        fontFamily: 'var(--font-migra), var(--font-playfair-display), Georgia, serif',
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </span>
  )
}
