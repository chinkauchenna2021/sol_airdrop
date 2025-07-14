// components/twitter/TwitterConnectionButton.tsx - Enhanced Twitter Connection
'use client'

import { useState } from 'react'
import { X,ExternalLink, CheckCircle, AlertCircle, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTwitterAuth } from '@/hooks/better/useBetterTwitterAuth'
import { useWalletStore } from '@/store/useWalletStore'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface TwitterConnectionButtonProps {
  onConnect?: () => void
  onDisconnect?: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'minimal'
}

export function TwitterConnectionButton({ 
  onConnect, 
  onDisconnect,
  size = 'md',
  variant = 'default'
}: TwitterConnectionButtonProps) {
  const { 
    isTwitterConnected, 
    isConnecting, 
    connectTwitter, 
    disconnectTwitter,
    authUser 
  } = useTwitterAuth()
  const { connected, publicKey } = useWalletStore()
  const [showDetails, setShowDetails] = useState(false)

  console.log(connected,"=========Wallet connected=======")

  const handleConnect = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first')
      return
    }

    const success = await connectTwitter()
    if (success) {
      onConnect?.()
    }
  }

  const handleDisconnect = async () => {
    await disconnectTwitter()
    onDisconnect?.()
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  if (isTwitterConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="flex items-center gap-3">
          <Button
            variant={variant === 'minimal' ? 'ghost' : 'outline'}
            onClick={() => setShowDetails(!showDetails)}
            className={`${sizeClasses[size]} border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400`}
          >
            <CheckCircle className={`${iconSizes[size]} mr-2`} />
            Twitter Connected
            {authUser?.user.name && (
              <span className="ml-2 text-xs opacity-75">
                @{authUser?.user.name}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDisconnect}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 p-4 bg-gray-900/95 backdrop-blur-xl rounded-lg border border-green-500/20 min-w-[250px] z-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Twitter Connected</p>
                  <p className="text-green-400 text-sm">@{authUser?.user.name}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Connected:</span>
                  <span className="text-white">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Your Twitter activity is being tracked for rewards
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {!connected ? (
        <Button
          variant="outline"
          disabled
          className={`${sizeClasses[size]} border-gray-600 text-gray-500 cursor-not-allowed`}
        >
          <AlertCircle className={`${iconSizes[size]} mr-2`} />
          Connect Wallet First
        </Button>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`${sizeClasses[size]} bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white border-0`}
        >
          {isConnecting ? (
            <>
              <div className={`${iconSizes[size]} mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white`} />
              Connecting...
            </>
          ) : (
            <>
              <X className={`${iconSizes[size]} mr-2`} />
              Connect Twitter
              <ExternalLink className={`${iconSizes[size]} ml-2`} />
            </>
          )}
        </Button>
      )}
    </motion.div>
  )
}
