import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { WalletProvider } from '@/components/wallet/WalletProvider'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Solana Airdrop Platform',
  description: 'Earn rewards by engaging with our community',
  keywords: 'solana, airdrop, crypto, tokens, rewards',
  openGraph: {
    title: 'Solana Airdrop Platform',
    description: 'Earn rewards by engaging with our community',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Airdrop Platform',
    description: 'Earn rewards by engaging with our community',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
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

        </Providers>
      </body>
    </html>
  )
}