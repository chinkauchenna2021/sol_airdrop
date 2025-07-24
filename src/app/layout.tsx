import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Providers } from './providers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CryptoNavbar from '@/components/layout/Navbar'
import { generateMetadata, siteConfig, generateStructuredData } from '@/lib/metadata'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
}


const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = generateMetadata({})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
   const structuredData = generateStructuredData()

  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/logo_ico.ico" sizes="any" />
        <link rel="icon" href="/logo_svg.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/images/logo/sol_logo.jpg" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        
        {/* Web3 meta tags */}
        <meta name="web3-site-verification" content="solana-platform" />
        <meta name="wallet-support" content="phantom,solflare,sollet" />
      </head>
      <body className={inter.className}>
        <Providers>
          <CryptoNavbar />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
               {children}

            <Footer />
        </Providers>
      </body>
    </html>
  )
}