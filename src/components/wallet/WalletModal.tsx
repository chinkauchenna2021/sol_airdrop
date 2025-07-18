'use client'
import { useEffect, useState, useRef } from 'react'
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
  const { 
    wallet: currentWallet, 
    wallets, 
    select, 
    connect, 
    connected, 
    connecting: walletConnecting, 
    publicKey 
  } = useWallet()
  
  const [connecting, setConnecting] = useState<string | null>(null)
  const [hasTriedConnect, setHasTriedConnect] = useState(false)
  const connectingRef = useRef(false)
  const { publicKey: walletAddress } = useWalletStore()

  // Handle successful connection
  useEffect(() => {
    if (connected && publicKey && open && !connectingRef.current) {
      console.log('✅ Wallet connected successfully:', publicKey.toBase58())
      setConnecting(null)
      setHasTriedConnect(false)
      connectingRef.current = false
      onClose()
    }
  }, [connected, publicKey, open, onClose])

  // Handle wallet selection with improved error handling
  const handleWalletSelect = async (walletName: WalletName) => {
    if (connecting || connectingRef.current) {
      console.log('⚠️ Connection already in progress')
      return
    }

    try {
      setConnecting(walletName)
      connectingRef.current = true
      
      console.log('🔄 Attempting to connect to wallet:', walletName)

      // If it's a different wallet, select it first
      if (currentWallet?.adapter.name !== walletName) {
        select(walletName)
        
        console.log('🔄 Selecting new wallet:', walletName)
        // Wait a moment for the selection to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Try to connect
      if (!connected && !walletConnecting) {
        console.log('🔄 Connecting to wallet...')
        await connect()
      }

    } catch (error) {
      console.error('❌ Wallet connection failed:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          toast.error('Connection cancelled by user')
        } else if (error.message.includes('not found')) {
          toast.error('Wallet not found. Please install the wallet extension.')
        } else {
          toast.error('Failed to connect wallet. Please try again.')
        }
      } else {
        toast.error('Failed to connect wallet. Please try again.')
      }
    } finally {
      setConnecting(null)
      connectingRef.current = false
      setHasTriedConnect(true)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setConnecting(null)
      setHasTriedConnect(false)
      connectingRef.current = false
    }
  }, [open])

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
          disabled={connecting !== null}
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Connect Wallet</h2>

        {/* Connection Status */}
        {connecting && (
          <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <p className="text-blue-300 text-sm">
              Connecting to {connecting}... Please approve the connection in your wallet.
            </p>
          </div>
        )}

        {/* Installed Wallets */}
        {installedWallets.length > 0 && (
          <>
            <p className="text-gray-400 text-sm mb-4">Installed wallets</p>
            <div className="space-y-2 mb-6">
              {installedWallets.map(wallet => {
                const isConnecting = connecting === wallet.adapter.name
                const isConnected = connected && currentWallet?.adapter.name === wallet.adapter.name
                
                return (
                  <button
                    key={wallet.adapter.name}
                    onClick={() => handleWalletSelect(wallet.adapter.name)}
                    disabled={connecting !== null}
                    className={`w-full p-4 rounded-lg transition-all flex items-center gap-4 ${
                      isConnected 
                        ? 'bg-green-500/20 border border-green-500/30'
                        : isConnecting
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    } ${connecting !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Image
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
                    <span className="text-white font-medium flex-1 text-left">
                      {wallet.adapter.name}
                    </span>
                    
                    {isConnected && (
                      <span className="text-green-400 text-sm">Connected</span>
                    )}
                    
                    {isConnecting && (
                      <div className="loading-spinner w-5 h-5" />
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Other Wallets */}
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

        {/* Help Text */}
        <div className="mt-6 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400 text-xs">
            Make sure you have a Solana wallet installed. Popular options include Phantom, Solflare, and Backpack.
          </p>
        </div>
      </div>
    </div>
  )
}