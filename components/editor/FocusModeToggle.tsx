'use client'

import { useEffect, useState } from 'react'
import { Focus, Minimize2 } from 'lucide-react'

export function FocusModeToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => setReduced(event.matches)

    mq.addEventListener('change', handleChange)

    return () => mq.removeEventListener('change', handleChange)
  }, [])

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`fixed right-4 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition-all ${reduced ? 'duration-0' : 'duration-300'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan ${
        active
          ? 'border-accent-gold/30 bg-accent-gold-glow text-accent-gold shadow-glow-gold'
          : 'border-border-subtle glass-panel text-text-tertiary hover:text-text-primary'
      }`}
      style={{ backdropFilter: 'blur(16px)' }}
      aria-pressed={active}
      aria-label={active ? 'Exit focus mode' : 'Enter focus mode'}
      title={reduced ? 'Animations disabled' : active ? 'Exit focus mode' : 'Enter focus mode'}
    >
      {active ? <Minimize2 className="h-4 w-4" /> : <Focus className="h-4 w-4" />}
    </button>
  )
}
