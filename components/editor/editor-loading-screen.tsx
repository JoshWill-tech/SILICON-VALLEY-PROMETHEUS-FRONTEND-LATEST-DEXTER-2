'use client'

import { cn } from '@/lib/utils'

import { MinimalTypographicLoader } from '@/components/ui/minimal-typographic-loader'

interface EditorLoadingScreenProps {
  caption?: string
  className?: string
}

export function EditorLoadingScreen({
  caption = 'Loading...',
  className,
}: EditorLoadingScreenProps) {
  return <MinimalTypographicLoader label={caption} message="Preparing the editor workspace." className={cn(className)} />
}
