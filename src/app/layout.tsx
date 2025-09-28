// app/layout.tsx
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import 'katex/dist/katex.min.css';
import { AppProvider } from '@/contexts/AppContext'
import { AuthAwareLayout } from './AuthAwareLayout';
import type { Metadata } from 'next'
import { PWAProvider } from '@/contexts/PWAProvider'
import { Toaster } from '@/components/ui/toaster'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://stridecampus.com'),
  title: {
    default: 'Stride Campus - Campus Communities & collabs',
    template: '%s - Stride Campus'
  },
  description: 'Where student life meets collaboration. Join your campus Space, earn credits by participating, and spend them to boost your voice across the community.',
  keywords: ['campus community, student collaboration, university platform, campus spaces, student engagement, verified campus platform, campus social platform Kenya, Kenyan university student community, university collaboration platform Kenya, student engagement Kenya, campus networking Kenya, KU student platform, UoN campus connect, Strathmore university community, Kenyatta university students, Moi university network, JKUAT student resources, Egerton university connect, Maseno university platform, campus polls Kenya, student credit system Kenya, university resource sharing, verified student platform Kenya, campus Spaces Kenya, student perks Kenya, academic resource sharing Kenya, student collaboration Kenya, connect with campus mates Kenya, find study groups Kenya, share class notes Kenya, campus event updates Kenya, student discount platform Kenya, club participation Kenya, campus voice platform, student rewards Kenya, join campus community, student signup Kenya, earn campus credits, create campus polls, boost student voice, unlock campus perks, share university resources, verified student account, how to connect with students on campus Kenya, where to find study notes Kenyan universities, platform for university students Kenya, how to join student community Kenya, earn while in university Kenya, student rewards program Kenya, verified student social platform, campus collaboration app Kenya, Nairobi university students, student platform Nairobi, Eldoret campus connect, Kisumu university community, Nakuru student network, Mombasa campus platform, Thika university students, lecture notes sharing Kenya, exam preparation Kenya, group study platform, course materials Kenya, academic collaboration Kenya, student research platform, assignment help Kenya, project collaboration Kenya, choma campus platform, deki student app, varsity connect Kenya, uni life Kenya, campus vibes Kenya, student mtaani platform'],
  authors: [{ name: 'Stride Campus', url: 'https://stridecampus.com' }],
  creator: 'Stride Campus',
  manifest: '/manifest.json',
  themeColor: '#f23b36',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stride Campus',
  },
  openGraph: {
    title: 'Stride Campus - Campus Communities & collabs',
    description: 'Where student life meets collaboration. Join your campus Space, earn credits by participating, and spend them to boost your voice across the community.',
    url: 'https://stridecampus.com',
    siteName: 'Stride Campus',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Stride Campus'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stride Campus',
    description: 'Where student life meets collaboration. Join your campus community today.',
    images: ['/og-image.jpg'],
    creator: '@stridecampus',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        {/* Material Symbols */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
        />

        {/* Preload important resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Favicon and PWA icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f23b36" />
        
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Stride Campus" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Stride Campus - Campus Communities & collabs" />
        <meta property="og:description" content="Join your campus Space, earn credits by participating in polls and sharing resources, and spend them to boost your voice across the community." />
        <meta property="og:image" content="/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Stride Campus" />
        <meta property="twitter:description" content="Where student life meets collaboration. Join your campus community today." />
        <meta property="twitter:image" content="/og-image.jpg" />
      </head>
      <body className={`${poppins.className} antialiased`}>
        <PWAProvider />
        <AppProvider>
          <AuthAwareLayout>
            {children}
          </AuthAwareLayout>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  )
}