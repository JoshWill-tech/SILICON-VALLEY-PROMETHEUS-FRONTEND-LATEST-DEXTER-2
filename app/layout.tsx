import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import localFont from 'next/font/local'
import { RootClientEffects } from '@/components/root-client-effects'
import { WorkspaceFrame } from '@/components/workspace-frame'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
import { Footer } from '@/components/Footer'
import { PresetProvider } from '@/components/chat/PresetProvider'
import './globals.css'
import './premium-vignette.css'

const vogueDisplay = localFont({
  src: '../Vogue.ttf',
  variable: '--font-vogue-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prometheus',
  description: 'Prometheus Studio is a professional video editing and production workspace for filmmakers.',
  generator: 'Prometheus',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#00f0ff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${vogueDisplay.variable} bg-[#05060a] font-sans text-foreground antialiased`}>
        <ReactQueryProvider>
          <AuthProvider>
            <PresetProvider>
              <div className="flex min-h-screen flex-col">
                <div className="flex-1">
                  <WorkspaceFrame>{children}</WorkspaceFrame>
                </div>
                <Footer />
              </div>
              <RootClientEffects />
              <Analytics />
              <SpeedInsights />
            </PresetProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
