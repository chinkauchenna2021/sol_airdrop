'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
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
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { publicKey: walletAddress } = useWalletStore()

  // PERFORMANCE FIX: Debounced connection handler
  const debouncedConnect = useCallback(
    debounce(async (walletName: WalletName) => {
      if (connectingRef.current) return
      
      try {
        connectingRef.current = true
        setConnecting(walletName)
        
        // Set connection timeout (15 seconds)
        connectionTimeoutRef.current = setTimeout(() => {
          if (connectingRef.current) {
            connectingRef.current = false
            setConnecting(null)
            toast.error('Connection timeout. Please try again.')
          }
        }, 15000)

        console.log('🔄 Fast connecting to wallet:', walletName)

        // OPTIMIZATION: Skip selection if already selected
        if (currentWallet?.adapter.name !== walletName) {
          select(walletName)
          // Reduced wait time from 500ms to 100ms
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // OPTIMIZATION: Check if already connected before connecting
        if (!connected && !walletConnecting) {
          await connect()
        }

      } catch (error) {
        console.error('❌ Wallet connection failed:', error)
        handleConnectionError(error)
      } finally {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
        }
        setConnecting(null)
        connectingRef.current = false
      }
    }, 300), // 300ms debounce
    [currentWallet, select, connect, connected, walletConnecting]
  )

  // PERFORMANCE FIX: Optimized connection success handler
  useEffect(() => {
    if (connected && publicKey && open && !connectingRef.current) {
      console.log('✅ Wallet connected successfully:', publicKey.toBase58())
      
      // Clear any pending timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
      
      setConnecting(null)
      setHasTriedConnect(false)
      connectingRef.current = false
      
      // OPTIMIZATION: Slight delay before closing to show success state
      setTimeout(() => onClose(), 200)
    }
  }, [connected, publicKey, open, onClose])

  // PERFORMANCE FIX: Optimized wallet selection
  const handleWalletSelect = useCallback(async (walletName: WalletName) => {
    if (connecting || connectingRef.current) {
      console.log('⚠️ Connection already in progress')
      return
    }

    // OPTIMIZATION: Pre-check wallet availability
    const wallet = wallets.find(w => w.adapter.name === walletName)
    if (!wallet || wallet.readyState !== WalletReadyState.Installed) {
      toast.error('Wallet not installed. Please install the wallet extension.')
      return
    }

    await debouncedConnect(walletName)
  }, [connecting, wallets, debouncedConnect])

  // OPTIMIZATION: Better error handling
  const handleConnectionError = useCallback((error: any) => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('user rejected') || message.includes('rejected')) {
        toast.error('Connection cancelled by user')
      } else if (message.includes('not found') || message.includes('install')) {
        toast.error('Wallet not found. Please install the wallet extension.')
      } else if (message.includes('timeout')) {
        toast.error('Connection timeout. Please try again.')
      } else if (message.includes('network')) {
        toast.error('Network error. Please check your connection.')
      } else {
        toast.error('Failed to connect wallet. Please try again.')
      }
    } else {
      toast.error('Failed to connect wallet. Please try again.')
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
    }
  }, [])

  // Rest of your component code remains the same...
  // [Previous modal JSX structure with optimized rendering]

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

        {/* ENHANCED: Better connection status */}
        {connecting && (
          <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              <p className="text-blue-300 text-sm">
                Connecting to {connecting}... Please approve in your wallet.
              </p>
            </div>
          </div>
        )}

        {/* Wallet list with optimized rendering */}
        <div className="space-y-2">
          {wallets
            .filter(wallet => wallet.readyState === WalletReadyState.Installed)
            .map(wallet => {
              const isConnecting = connecting === wallet.adapter.name
              const isConnected = connected && currentWallet?.adapter.name === wallet.adapter.name
              
              return (
                <button
                  key={wallet.adapter.name}
                  onClick={() => handleWalletSelect(wallet.adapter.name)}
                  disabled={connecting !== null}
                  className={`w-full p-4 rounded-lg transition-all flex items-center gap-4 ${
                    isConnected 
                      ? 'bg-green-500/20 border border-green-500/50' 
                      : isConnecting
                      ? 'bg-blue-500/20 border border-blue-500/50'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Image
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{wallet.adapter.name}</p>
                    <p className="text-gray-400 text-sm">
                      {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Click to connect'}
                    </p>
                  </div>
                  {isConnecting && (
                    <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  )}
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}

// UTILITY: Debounce function for performance
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}