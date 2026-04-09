import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/components/ui/QueryProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'TripZync®',
  description: 'Your personal travel logbook',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,500;0,700;0,900;1,700;1,900&family=Noto+Sans+JP:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
