// /components/admin/nft/NFTCollectionsList.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coins, Copy, ExternalLink, CheckCircle, AlertTriangle,
  Calendar, Hash, Users, Eye, MoreHorizontal
} from 'lucide-react'
import toast from 'react-hot-toast'

interface MintedNFT {
  mintAddress: string
  name: string
  symbol: string
  supply: number
  createdAt: string
  distributionResults?: DistributionResult[]
}

interface DistributionResult {
  user: string
  success: boolean
  signature?: string
  error?: string
}

interface NFTCollectionsListProps {
  collections: MintedNFT[]
  loading: boolean
  onRefresh: () => void
}

export function NFTCollectionsList({ collections, loading, onRefresh }: NFTCollectionsListProps) {
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const getDistributionStats = (results?: DistributionResult[]) => {
    if (!results) return { total: 0, successful: 0, failed: 0 }
    
    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading collections...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Coins className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Minted Collections</h2>
          <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-sm">
            {collections.length} Collections
          </span>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12">
          <Coins className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No NFT collections created yet</p>
          <p className="text-sm text-gray-500 mt-1">Create your first collection to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {collections.map((nft) => {
            const stats = getDistributionStats(nft.distributionResults)
            const isExpanded = expandedCollection === nft.mintAddress
            
            return (
              <motion.div
                key={nft.mintAddress}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-700/50 rounded-lg border border-gray-600 overflow-hidden"
              >
                {/* Main Collection Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{nft.name}</h3>
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">
                          {nft.symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>Supply: {nft.supply.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(nft.createdAt).toLocaleDateString()}</span>
                        </div>
                        {stats.total > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Distributed: {stats.successful}/{stats.total}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(nft.mintAddress, 'Mint address')}
                        className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                        title="Copy mint address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://solscan.io/token/${nft.mintAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {nft.distributionResults && (
                        <button
                          onClick={() => setExpandedCollection(isExpanded ? null : nft.mintAddress)}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="View distribution details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Mint Address Display */}
                  <div className="bg-gray-800/50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-gray-400 mb-1">Mint Address:</p>
                    <p className="text-sm text-gray-300 font-mono break-all">
                      {nft.mintAddress}
                    </p>
                  </div>
                </div>

                {/* Distribution Results (Expandable) */}
                <AnimatePresence>
                  {isExpanded && nft.distributionResults && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-600"
                    >
                      <div className="p-4 bg-gray-800/30">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-white">Distribution Results</h4>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-400">✓ {stats.successful} Success</span>
                            {stats.failed > 0 && (
                              <span className="text-red-400">✗ {stats.failed} Failed</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {nft.distributionResults.map((result, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between p-2 bg-gray-700/50 rounded text-sm"
                            >
                              <div className="flex items-center gap-2">
                                {result.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-red-400" />
                                )}
                                <span className="text-gray-300 font-mono">
                                  {result.user.slice(0, 8)}...{result.user.slice(-8)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {result.success && result.signature ? (
                                  <a
                                    href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                    title="View transaction"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : result.error ? (
                                  <span className="text-red-400 text-xs max-w-32 truncate" title={result.error}>
                                    {result.error}
                                  </span>
                                ) : null}
                                
                                <button
                                  onClick={() => copyToClipboard(result.user, 'User address')}
                                  className="text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
