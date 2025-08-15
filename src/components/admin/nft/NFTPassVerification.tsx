// /components/admin/nft/NFTPassVerification.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, CheckCircle, AlertTriangle, Copy, 
  ExternalLink, RefreshCw, Eye, EyeOff 
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NFTPass {
  mint: string
  name: string
  symbol: string
  image?: string
}

interface NFTPassStatus {
  hasValidPass: boolean
  passNFTs: NFTPass[]
  requiredPasses: string[]
  isEligible: boolean
}

interface NFTPassVerificationProps {
  walletAddress?: string
  onStatusChange?: (status: NFTPassStatus) => void
  className?: string
}

export function NFTPassVerification({ 
  walletAddress, 
  onStatusChange, 
  className = '' 
}: NFTPassVerificationProps) {
  const [passStatus, setPassStatus] = useState<NFTPassStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAllRequired, setShowAllRequired] = useState(false)

  useEffect(() => {
    if (walletAddress) {
      fetchPassStatus()
    }
  }, [walletAddress])

  const fetchPassStatus = async () => {
    if (!walletAddress) return

    setLoading(true)
    try {
      const response = await fetch(`/api/nft-claims/pass-status?wallet=${walletAddress}`)
      if (response.ok) {
        const data = await response.json()
        setPassStatus(data)
        onStatusChange?.(data)
      } else {
        throw new Error('Failed to fetch pass status')
      }
    } catch (error) {
      console.error('Error fetching pass status:', error)
      toast.error('Failed to verify NFT pass status')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  if (!walletAddress) {
    return (
      <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">NFT Pass Verification</h2>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-400">Connect your wallet to verify NFT pass status</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">NFT Pass Verification</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying NFT passes...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">NFT Pass Verification</h2>
        </div>
        <button
          onClick={fetchPassStatus}
          className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          title="Refresh verification"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {passStatus?.hasValidPass ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Success Status */}
          <div className="flex items-center gap-2 p-4 bg-green-600/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400 font-medium">Valid NFT Pass Detected</p>
              <p className="text-green-300/80 text-sm">
                You have {passStatus.passNFTs.length} valid pass{passStatus.passNFTs.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          
          {/* Pass NFTs Grid */}
          <div className="grid gap-4">
            {passStatus.passNFTs.map((nft, index) => (
              <motion.div
                key={nft.mint}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-green-600/5 border border-green-500/20 rounded-lg"
              >
                {nft.image ? (
                  <img 
                    src={nft.image} 
                    alt={nft.name} 
                    className="w-16 h-16 rounded-lg object-cover border border-green-500/30" 
                  />
                ) : (
                  <div className="w-16 h-16 bg-green-600/20 rounded-lg flex items-center justify-center border border-green-500/30">
                    <Shield className="w-8 h-8 text-green-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{nft.name}</h3>
                  <p className="text-green-400 text-sm font-medium">{nft.symbol}</p>
                  <p className="text-gray-400 text-xs font-mono mt-1">
                    {nft.mint.slice(0, 8)}...{nft.mint.slice(-8)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(nft.mint, 'NFT mint address')}
                    className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                    title="Copy mint address"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={`https://solscan.io/token/${nft.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                    title="View on Solscan"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Error Status */}
          <div className="flex items-center gap-2 p-4 bg-red-600/10 border border-red-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">No Valid NFT Pass Found</p>
              <p className="text-red-300/80 text-sm">
                You need at least one of the required NFT passes to claim tokens
              </p>
            </div>
          </div>
          
          {/* Required Passes */}
          <div className="bg-red-600/5 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-red-300 font-medium">Required NFT Passes:</h3>
              <button
                onClick={() => setShowAllRequired(!showAllRequired)}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                {showAllRequired ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAllRequired ? 'Hide' : 'Show All'}
              </button>
            </div>
            
            <div className="space-y-2">
              {passStatus?.requiredPasses
                .slice(0, showAllRequired ? undefined : 3)
                .map((mint, index) => (
                <div key={mint} className="flex items-center justify-between p-2 bg-red-500/5 rounded">
                  <p className="text-sm text-gray-300 font-mono">
                    {mint.slice(0, 8)}...{mint.slice(-8)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(mint, 'Required pass address')}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Copy address"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <a
                      href={`https://solscan.io/token/${mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="View on Solscan"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
              
              {!showAllRequired && passStatus && passStatus.requiredPasses.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  ... and {passStatus.requiredPasses.length - 3} more
                </p>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-500/20 rounded">
              <p className="text-yellow-300 text-sm">
                <strong>How to get a pass:</strong> NFT passes are distributed through special events, 
                partnerships, or can be purchased from holders on secondary markets.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}