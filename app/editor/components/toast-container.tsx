'use client'

type ToastContainerProps = {
  active?: boolean
  message?: string
}

export function ToastContainer({ active = false, message = 'Link copied' }: ToastContainerProps) {
  return (
    <div className={active ? 'toast-container active' : 'toast-container'} aria-live="polite">
      {active ? (
        <div className="rounded-full border border-white/10 bg-black/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 shadow-2xl backdrop-blur-xl">
          {message}
        </div>
      ) : null}
    </div>
  )
}
