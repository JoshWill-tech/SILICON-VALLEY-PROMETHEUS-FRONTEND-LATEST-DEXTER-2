'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

import { InfinityTrailLoader } from '@/components/editor/infinity-trail-loader'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { cn } from '@/lib/utils'

export type SourceStageStatus = 'empty' | 'loading' | 'error'

interface SourceStagePlaceholderProps {
  status: SourceStageStatus
  isDragActive?: boolean
  onPickSource: () => void
  onDragOver: React.DragEventHandler<HTMLButtonElement>
  onDragLeave: React.DragEventHandler<HTMLButtonElement>
  onDrop: React.DragEventHandler<HTMLButtonElement>
}

export function SourceStagePlaceholder({
  status,
  isDragActive = false,
  onPickSource,
  onDragOver,
  onDragLeave,
  onDrop,
}: SourceStagePlaceholderProps) {
  const reduceMotion = useStableReducedMotion()
  const isLoading = status === 'loading'
  const isError = status === 'error'

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[clamp(250px,40vh,460px)] w-full items-center justify-center rounded-[18px] border border-white/10 bg-[#07070a]">
        <InfinityTrailLoader
          label="Restoring source preview"
          subtitle="Rebuilding the media stage inside the editor."
          variant="stacked"
          className="w-full max-w-[360px]"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-label="Stage a source video"
      onClick={onPickSource}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'group relative flex h-full min-h-[clamp(250px,40vh,460px)] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer',
        isDragActive
          ? 'border-[#9ff6e3]/50 bg-[#9ff6e3]/5 shadow-[0_0_30px_rgba(159,246,227,0.1)]'
          : isError
            ? 'border-rose-400/28 bg-rose-400/5'
            : 'border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900/50',
      )}
    >
      <Plus className={cn(
        "w-16 h-16 transition-colors duration-300",
        isDragActive ? "text-[#9ff6e3]" : "text-neutral-600 group-hover:text-white"
      )} />
      <span className={cn(
        "absolute mt-24 text-sm transition-colors duration-300",
        isDragActive ? "text-[#9ff6e3]/70" : "text-neutral-500 group-hover:text-neutral-300"
      )}>
        {isError ? 'Upload failed. Click to retry.' : 'Click to upload video'}
      </span>
    </button>
  )
}
