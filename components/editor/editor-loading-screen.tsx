'use client'

import { cn } from '@/lib/utils'

import { Hero3DGeometricLoader } from '@/components/ui/hero-3d-geometric-loader'

interface EditorLoadingScreenProps {
  caption?: string
  className?: string
}

export function EditorLoadingScreen({
  caption = 'Loading...',
  className,
}: EditorLoadingScreenProps) {
  return <Hero3DGeometricLoader label={caption} message="Preparing the editor workspace." className={cn(className)} />
}
