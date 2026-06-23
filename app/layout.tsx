import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'

export const metadata: Metadata = {
  title: {
    default: 'Keuangan Masjid',
    template: '%s | Keuangan Masjid',
  },
  description: 'Sistem pencatatan keuangan masjid',
  // manifest is now served dynamically via app/manifest.ts
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Keuangan Masjid',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
