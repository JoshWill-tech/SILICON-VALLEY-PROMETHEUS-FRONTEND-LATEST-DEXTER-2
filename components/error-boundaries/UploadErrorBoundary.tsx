'use client'

import * as React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export class UploadErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[UPLOAD_CRASH]', error, info)
    // DO NOT redirect. Show fallback UI only.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[18rem] w-full flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,23,0.96)_0%,rgba(7,7,10,0.98)_100%)] p-8 text-center shadow-[0_30px_90px_-48px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="grid size-12 place-items-center rounded-2xl border border-amber-200/16 bg-amber-300/10 text-amber-100">
            <AlertTriangle className="size-5" />
          </div>
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/36">
            Upload Recovery
          </div>
          <div className="mt-2 text-xl font-medium tracking-tight text-white/92">The ingestion surface paused</div>
          <div className="mt-3 max-w-[340px] text-sm leading-6 text-white/56">
            Prometheus contained the upload failure. Refresh the surface and choose the source again.
          </div>
          <Button
            type="button"
            onClick={() => window.location.reload()}
            variant="secondary"
            className="mt-6 rounded-full border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12]"
          >
            <RotateCcw className="mr-2 size-4" />
            Refresh upload surface
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
