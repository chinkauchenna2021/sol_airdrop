'use client'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'
import { X } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useWalletStore } from '@/store/useWalletStore'


interface WalletModalProps {
  open: boolean
  onClose: () => void
}

export function WalletModal({ open, onClose }: WalletModalProps) {
 const { wallet: currentWallet,wallets, select, connect, connected, connecting: walletConnecting, publicKey } = useWallet()
  const [connecting, setConnecting] = useState<string | null>(null)
  // const {publicKey , connected} = useWalletStore()
 const [selectedWalletName, setSelectedWalletName] = useState<string | null>(null)
const {publicKey: walletAddress} = useWalletStore()
// Auto-connect when wallet is selected
useEffect(() => {
  const autoConnect = async () => {
    if (currentWallet && selectedWalletName && !connected && !walletConnecting) {
      try {
        await connect()
        // Your backend auth here...
        setSelectedWalletName(null)
      } catch (error) {
        console.error('Auto-connect failed:', error)
      }
    }
  }
  autoConnect()
}, [currentWallet, selectedWalletName, connected, walletConnecting])

const handleWalletSelect = async (walletName: WalletName) => {
  if (currentWallet?.adapter.name === walletName) {
    // Same wallet, connect immediately
    if (!connected && !walletConnecting) {
      await connect()
    }
  } else {
    // Different wallet, select and let useEffect handle connection
    select(walletName)
    setSelectedWalletName(walletName)
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

  console.log(walletAddress, "=========Wallet Address======")

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