import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Geist, Inter, JetBrains_Mono, Playfair_Display, Space_Grotesk } from 'next/font/google'
import localFont from 'next/font/local'
import { RootClientEffects } from '@/components/root-client-effects'
import { AuthProvider } from '@/components/auth/auth-provider'
import { RootLayoutFrame } from '@/components/root-layout-frame'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { CookieConsentBanner } from '@/components/cookie-consent/banner'
import { ConsentGatedAnalytics } from '@/components/cookie-consent/consent-gated-analytics'
import { CookieConsentProvider } from '@/components/cookie-consent/consent-context'
import './globals.css'
import './premium-vignette.css'
import './studio-motion.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  preload: false,
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
  preload: false,
})

const geist = Geist({ subsets: ['latin'], display: 'swap', variable: '--font-geist', preload: false })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space-grotesk', preload: false })
const vogueDisplay = localFont({ src: '../Vogue.ttf', variable: '--font-vogue-display', display: 'swap', preload: false })
const blackDelights = localFont({ src: '../black_delights/Black Delights.ttf', variable: '--font-black-delights', display: 'swap', preload: false })
const migraDisplay = localFont({
  src: [
    { path: '../public/fonts/migra/Migra-Extralight.woff2', weight: '200', style: 'normal' },
    { path: '../public/fonts/migra/Migra-Extrabold.woff2', weight: '800', style: 'normal' },
    { path: '../public/fonts/migra/MigraItalic-ExtraboldItalic.woff2', weight: '800', style: 'italic' },
  ],
  variable: '--font-migra',
  display: 'swap',
  preload: false,
})
const elegistDisplay = localFont({
  src: '../elegist/Elegist.otf',
  variable: '--font-elegist',
  display: 'block',
  preload: true,
  adjustFontFallback: false,
  fallback: [],
})
const ztOtezItalic = localFont({ src: '../zt_otez/ZTOtez-Italic.ttf', variable: '--font-zt-otez', display: 'swap', preload: false })

export const metadata: Metadata = {
  metadataBase: new URL('https://prometheusstudio.tech'),
  title: 'Prometheus Studio ? Record once. Publish fast.',
  description: 'Record once. Publish fast. Edit source footage, refine your cut, and prepare delivery in Prometheus Studio.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Prometheus Studio ? Record once. Publish fast.',
    description: 'Your footage, edit, and delivery in one workspace.',
    url: 'https://prometheusstudio.tech',
    siteName: 'Prometheus Studio',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Prometheus Studio ? record once, publish fast' }],
  },
  twitter: { card: 'summary_large_image', title: 'Prometheus Studio ? Record once. Publish fast.', description: 'Your footage, edit, and delivery in one workspace.', images: ['/opengraph-image'] },
  icons: { icon: '/favicon.ico' },
}

export const viewport = { themeColor: '#38BDF8' }

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // A per-request CSP nonce requires Next to render bootstrap scripts per request.
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? undefined

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/audio/netflix-intro.mp3" as="audio" type="audio/mpeg" />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(typeof window==='undefined'||window.__PROMETHEUS_INTRO_PLAYED__)return;var audio=new Audio('/audio/netflix-intro.mp3');audio.preload='auto';audio.volume=0.75;window.__prometheus_intro_audio=audio;function tryPlay(){if(window.__PROMETHEUS_INTRO_PLAYED__)return;try{var p=audio.play();if(p!==undefined){p.then(function(){window.__PROMETHEUS_INTRO_PLAYED__=true;window.dispatchEvent(new CustomEvent('prometheus:intro-sound-played'));cleanup();}).catch(function(){});}else{window.__PROMETHEUS_INTRO_PLAYED__=true;cleanup();}}catch(e){}}function onAct(){tryPlay();}function cleanup(){window.removeEventListener('pointerdown',onAct,true);window.removeEventListener('mousedown',onAct,true);window.removeEventListener('keydown',onAct,true);window.removeEventListener('touchstart',onAct,true);window.removeEventListener('click',onAct,true);}window.addEventListener('pointerdown',onAct,{capture:true,passive:true});window.addEventListener('mousedown',onAct,{capture:true,passive:true});window.addEventListener('keydown',onAct,{capture:true,passive:true});window.addEventListener('touchstart',onAct,{capture:true,passive:true});window.addEventListener('click',onAct,{capture:true,passive:true});tryPlay();}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,400..700;1,400..700&family=Italiana&family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,400..900;1,400..900&family=Oswald:wght@400..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} ${geist.variable} ${spaceGrotesk.variable} ${vogueDisplay.variable} ${blackDelights.variable} ${migraDisplay.variable} ${elegistDisplay.variable} ${ztOtezItalic.variable} bg-background font-sans text-foreground antialiased`}>
        <CookieConsentProvider>
          <LoadingProvider>
            <AuthProvider>
              <div className="relative z-10">
                <RootLayoutFrame>{children}</RootLayoutFrame>
              </div>
              <RootClientEffects />
              <ConsentGatedAnalytics />
              <CookieConsentBanner />
            </AuthProvider>
          </LoadingProvider>
        </CookieConsentProvider>
      </body>
    </html>
  )
}
