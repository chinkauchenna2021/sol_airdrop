'use client'

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import  WalletContextProvider  from '@/components/wallet/WalletProvider'
import { ErrorBoundary } from '@/components/ErrorBoundry'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
      <WalletContextProvider>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#14F195',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF6B6B',
                  secondary: '#fff',
                },
              },
            }}
          />
          {children}
      </QueryClientProvider>
    </ErrorBoundary>
     </WalletContextProvider>
  )
}