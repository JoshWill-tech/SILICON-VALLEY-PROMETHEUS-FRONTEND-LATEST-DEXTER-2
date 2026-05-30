'use client'

import { useEffect, useRef } from 'react'

export function useTextareaResize(value: string, minRows = 1, maxRows?: number) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'

    const computedStyle = getComputedStyle(textarea)
    const lineHeight = Number.parseInt(computedStyle.lineHeight) || 20
    const paddingBlock =
      (Number.parseFloat(computedStyle.paddingTop) || 0) +
      (Number.parseFloat(computedStyle.paddingBottom) || 0)
    const minHeight = lineHeight * minRows + paddingBlock
    const maxHeight = maxRows ? lineHeight * maxRows + paddingBlock : Number.POSITIVE_INFINITY
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)

    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [value, minRows, maxRows])

  return textareaRef
}
