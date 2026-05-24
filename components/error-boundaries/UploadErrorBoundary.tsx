'use client'

import * as React from 'react'

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
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-sm">
          <div className="mb-4 text-red-400 font-medium">Upload system crashed.</div>
          <div className="text-sm text-red-400/70">Please refresh the page and try again.</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
