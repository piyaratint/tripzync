import type { Metadata, Viewport } from 'next'
import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/components/ui/QueryProvider'
import { ToastProvider } from '@/components/ui/Toaster'
import SiteFooter from '@/components/SiteFooter'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import './globals.css'

const BASE_URL = 'https://tripzync.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: 'Marenn — Every Trip, Carefully Planned', template: '%s | Marenn' },
  description: 'Marenn is your personal AI-powered travel planner. Build custom itineraries, track expenses, and keep your hotel loyalty program in sync — all in one calm, considered place.',
  keywords: ['travel planner', 'trip itinerary', 'travel app', 'hotel loyalty', 'travel organizer', 'travel logbook'],
  authors: [{ name: 'Marenn' }],
  creator: 'Marenn',
  publisher: 'Marenn',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Marenn',
    title: 'Marenn — Every Trip, Carefully Planned',
    description: 'Build custom itineraries, track expenses, and keep hotel loyalty rewards in sync — your personal AI travel companion.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marenn — Every Trip, Carefully Planned',
    description: 'Build custom itineraries, track expenses, and keep hotel loyalty rewards in sync.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: BASE_URL },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,500;0,700;0,900;1,700;1,900&family=Noto+Sans+JP:wght@300;400;500&family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="t-arctic" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('tripzync_theme');document.body.className=(t===null?'t-arctic':t)}catch(e){}` }} />
        <SessionProvider>
          <QueryProvider>
            <ToastProvider>
              <div style={{ flex: 1 }}>{children}</div>
              <SiteFooter />
              <ThemeToggle />
            </ToastProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
