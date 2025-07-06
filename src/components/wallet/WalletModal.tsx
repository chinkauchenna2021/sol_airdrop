'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { X } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface WalletModalProps {
  open: boolean
  onClose: () => void
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { wallets, select, connect } = useWallet()
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleWalletSelect = async (walletName: string) => {
    try {
      setConnecting(walletName)
      select(walletName as any)
      await connect()
      
      // Authenticate with backend
      const wallet = wallets.find(w => w.adapter.name === walletName)
      if (wallet?.adapter.publicKey) {
        const res = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.adapter.publicKey.toBase58()
          })
        })
        
        if (res.ok) {
          toast.success('Wallet connected successfully!')
          onClose()
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setConnecting(null)
    }
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const installedWallets = wallets.filter(
    wallet => wallet.readyState === WalletReadyState.Installed
  )
  const otherWallets = wallets.filter(
    wallet => wallet.readyState !== WalletReadyState.Installed
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl p-6 glass-effect">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Connect Wallet</h2>

        {installedWallets.length > 0 && (
          <>
            <p className="text-gray-400 text-sm mb-4">Installed wallets</p>
            <div className="space-y-2 mb-6">
              {installedWallets.map(wallet => (
                <button
                  key={wallet.adapter.name}
                  onClick={() => handleWalletSelect(wallet.adapter.name)}
                  disabled={connecting === wallet.adapter.name}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-4 disabled:opacity-50"
                >
                  <Image
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <span className="text-white font-medium">{wallet.adapter.name}</span>
                  {connecting === wallet.adapter.name && (
                    <div className="ml-auto loading-spinner w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {otherWallets.length > 0 && (
          <>
            <p className="text-gray-400 text-sm mb-4">Other wallets</p>
            <div className="space-y-2">
              {otherWallets.map(wallet => (
                <a
                  key={wallet.adapter.name}
                  href={wallet.adapter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-4"
                >
                  <Image
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <span className="text-white font-medium">{wallet.adapter.name}</span>
                  <span className="ml-auto text-gray-400 text-sm">Install</span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}