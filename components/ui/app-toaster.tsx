'use client'

import { Toaster } from 'sonner'

export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      theme="dark"
      duration={4200}
      toastOptions={{
        style: {
          background: 'linear-gradient(180deg, rgba(17, 17, 23, 0.98) 0%, rgba(8, 8, 12, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#fff',
          boxShadow: '0 24px 70px -34px rgba(0, 0, 0, 0.92), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(18px)',
        },
      }}
    />
  )
}
