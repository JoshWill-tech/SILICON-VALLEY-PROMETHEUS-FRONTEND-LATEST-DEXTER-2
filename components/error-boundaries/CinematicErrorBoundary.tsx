'use client'

import * as React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { normalizeUxError, type UxErrorContext } from '@/lib/ux/errors'

interface Props {
  children: React.ReactNode
  scope?: UxErrorContext
  title?: string
  description?: string
  resetLabel?: string
  className?: string
  onReset?: () => void
}

interface State {
  error: Error | null
}

export class CinematicErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[PROMETHEUS_RENDER_BOUNDARY:${this.props.scope ?? 'generic'}]`, error, info)
  }

  private reset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <div
        className={cn(
          'flex h-full min-h-[280px] w-full items-center justify-center rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,23,0.96)_0%,rgba(7,7,10,0.98)_100%)] p-6 text-center shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)]',
          this.props.className,
        )}
      >
        <div className="max-w-[360px]">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-amber-200/16 bg-amber-300/10 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <AlertTriangle className="size-5" />
          </div>
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/36">
            Protected Surface
          </div>
          <h2 className="mt-2 text-xl font-medium tracking-tight text-white/92">
            {this.props.title ?? 'This render surface paused'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/56">
            {this.props.description ?? 'Prometheus contained the failure so the rest of the workspace can keep running.'}
          </p>
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-xs leading-5 text-white/52">
            {normalizeUxError(error, this.props.scope ?? 'render')}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={this.reset}
            className="mt-5 rounded-full border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12]"
          >
            <RotateCcw className="mr-2 size-4" />
            {this.props.resetLabel ?? 'Retry surface'}
          </Button>
        </div>
      </div>
    )
  }
}
