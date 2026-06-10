'use client'

import * as React from 'react'

type ToastContainerProps = {
  active?: boolean
  message?: string
}

export function ToastContainer({ active = false, message = 'Link copied' }: ToastContainerProps) {
  const [visible, setVisible] = React.useState(false)
  const timerRef = React.useRef<number | null>(null)

  const resetTimer = React.useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      window.sessionStorage.setItem('prometheus_copy_link_toast_dismissed', 'true')
      setVisible(false)
    }, 8000)
  }, [])

  React.useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }

    if (window.sessionStorage.getItem('prometheus_copy_link_toast_dismissed') === 'true') return
    setVisible(true)
    resetTimer()

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [active, resetTimer])

  if (!visible) return <div className="toast-container" aria-live="polite" />

  return (
    <div className="toast-container active" aria-live="polite" onPointerDown={resetTimer} onMouseEnter={resetTimer}>
      <div className="rounded-2xl border border-white/10 bg-black/85 px-4 py-2.5 text-center text-xs font-semibold uppercase leading-5 tracking-[0.16em] text-white/80 shadow-2xl backdrop-blur-xl">
        {message}
      </div>
    </div>
  )
}
