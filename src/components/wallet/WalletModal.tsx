'use client'
import { useEffect, useState, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'
import { X } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useWalletStore } from '@/store/useWalletStore'
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

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
           <div className="my-8">
            <WalletMultiButton 
            />
          </div>

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