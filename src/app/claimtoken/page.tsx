'use client'
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coins, 
  TrendingUp, 
  Award, 
  Clock, 
  ExternalLink,
  Sparkles,
  Shield,
  Gift,
  BarChart3,
  Users,
  Trophy,
  Target,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UserBalance {
  totalPoints: number
  claimableTokens: number
  totalClaimed: number
  claimMultiplier: number
}

interface ClaimHistory {
  id: string
  amount: number
  timestamp: string
  status: string
  transactionHash?: string
  feesPaid: number
  type: string
}

interface AdminControls {
  claimingEnabled: boolean
  minClaimAmount: number
  maxClaimAmount: number
  claimFeePercentage: number
}

interface NFTPassStatus {
  hasValidPass: boolean
  passCount: number
  requiredPasses: string[]
  multiplierBonus: number
}

export default function ConnectTokenPage() {
  const { publicKey, connected } = useWallet()
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([])
  const [adminControls, setAdminControls] = useState<AdminControls | null>(null)
  const [nftPassStatus, setNFTPassStatus] = useState<NFTPassStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimAmount, setClaimAmount] = useState('')
  const [showClaimDialog, setShowClaimDialog] = useState(false)

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserData()
      fetchClaimHistory()
      fetchAdminControls()
      fetchNFTPassStatus()
    }
  }, [connected, publicKey])

  const fetchUserData = async () => {
    if (!publicKey) return

    try {
      const response = await fetch(`/api/claim/balance?wallet=${publicKey.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUserBalance(data)
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
    }
  }

  const fetchClaimHistory = async () => {
    if (!publicKey) return

    try {
      const response = await fetch(`/api/claim/history?wallet=${publicKey.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setClaimHistory(data.claims || [])
      }
    } catch (error) {
      console.error('Error fetching claim history:', error)
    }
  }

  const fetchAdminControls = async () => {
    try {
      const response = await fetch('/api/claim/controls')
      if (response.ok) {
        const data = await response.json()
        setAdminControls(data)
      }
    } catch (error) {
      console.error('Error fetching admin controls:', error)
    }
  }

  const fetchNFTPassStatus = async () => {
    if (!publicKey) return

    try {
      const response = await fetch(`/api/nft-claims/pass-status?wallet=${publicKey.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNFTPassStatus(data)
      }
    } catch (error) {
      console.error('Error fetching NFT pass status:', error)
    }
  }

  const handleClaimTokens = async () => {
    if (!publicKey || !userBalance) return

    try {
      setClaiming(true)
      const claimAmountNum = parseInt(claimAmount) || userBalance.claimableTokens

      const response = await fetch('/api/claim/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: claimAmountNum,
          walletAddress: publicKey.toString(),
          hasNFTPass: nftPassStatus?.hasValidPass || false
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Successfully claimed ${claimAmountNum} CONNECT tokens!`)
        setShowClaimDialog(false)
        setClaimAmount('')
        
        // Refresh data
        await Promise.all([
          fetchUserData(),
          fetchClaimHistory()
        ])
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Claim failed')
      }
    } catch (error) {
      console.error('Claim error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to claim tokens')
    } finally {
      setClaiming(false)
    }
  }

  const formatSolValue = (lamports: number) => {
    return (lamports / 1000000000).toFixed(4)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400'
      case 'PENDING': return 'text-yellow-400'
      case 'FAILED': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <Coins className="w-10 h-10 text-white" />
          </div>
          <div suppressHydrationWarning>
            <h1 className="text-3xl font-bold text-white mb-4">Connect Token Claiming</h1>
            <p className="text-gray-300 mb-8">
              Connect your wallet to start claiming CONNECT tokens
            </p>
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-500 !to-purple-500 hover:!from-blue-600 hover:!to-purple-600" />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Coins className="w-10 h-10 text-yellow-400" />
            Connect Token Platform
          </h1>
          <p className="text-gray-300 text-lg">
            Claim your CONNECT tokens and boost your rewards with NFT passes
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Overview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                Your Balance
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 text-center">
                  <Coins className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Total Points</p>
                  <p className="text-2xl font-bold text-white">
                    {userBalance?.totalPoints.toLocaleString() || 0}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 text-center">
                  <Gift className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Claimable Tokens</p>
                  <p className="text-2xl font-bold text-green-400">
                    {userBalance?.claimableTokens.toLocaleString() || 0}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 text-center">
                  <Trophy className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Total Claimed</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {userBalance?.totalClaimed.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* NFT Pass Status */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                NFT Pass Benefits
              </h3>
              
              {nftPassStatus?.hasValidPass ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-semibold">Active NFT Pass</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Pass Count:</span>
                      <span className="text-white ml-2">{nftPassStatus.passCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Multiplier Bonus:</span>
                      <span className="text-green-400 ml-2">+{nftPassStatus.multiplierBonus * 100}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-yellow-400 font-semibold">No NFT Pass</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Get an NFT Pass to unlock bonus multipliers and exclusive benefits!
                  </p>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all">
                    Learn More
                  </button>
                </div>
              )}
            </motion.div>

            {/* Claim History */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0}}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                Claim History
              </h3>
              
              {claimHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No claims yet</p>
                  <p className="text-gray-500 text-sm">Your claim history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {claimHistory.map((claim) => (
                    <div key={claim.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Coins className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {claim.amount.toLocaleString()} CONNECT
                          </p>
                          <p className="text-gray-400 text-sm">
                            {new Date(claim.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getStatusColor(claim.status)}`}>
                            {claim.status}
                          </span>
                          {claim.transactionHash && (
                            <button
                              onClick={() => window.open(`https://solscan.io/tx/${claim.transactionHash}?cluster=devnet`, '_blank')}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs">
                          Fee: {formatSolValue(claim.feesPaid)} SOL
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Claim Panel */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                Claim Tokens
              </h3>

              {!adminControls?.claimingEnabled ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-yellow-400 font-semibold mb-2">Claims Temporarily Disabled</p>
                  <p className="text-gray-400 text-sm">Token claiming is currently disabled by administrators</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Available to Claim */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm">Available to Claim</p>
                    <p className="text-3xl font-bold text-green-400 mb-2">
                      {userBalance?.claimableTokens.toLocaleString() || 0}
                    </p>
                    <p className="text-gray-400 text-sm">CONNECT Tokens</p>
                  </div>

                  {/* Claim Input */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Claim Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                        placeholder={`Max: ${userBalance?.claimableTokens || 0}`}
                        max={userBalance?.claimableTokens || 0}
                        min={adminControls?.minClaimAmount || 1}
                        className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                      />
                      <button
                        onClick={() => setClaimAmount(userBalance?.claimableTokens.toString() || '0')}
                        className="absolute right-2 top-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-all"
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <button
                    onClick={() => setShowClaimDialog(true)}
                    disabled={!userBalance?.claimableTokens || claiming || !claimAmount}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {claiming ? 'Processing...' : 'Claim Tokens'}
                  </button>

                  {/* Claim Info */}
                  <div className="bg-black/20 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Claim:</span>
                      <span className="text-white">{adminControls?.minClaimAmount || 1} CONNECT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Claim:</span>
                      <span className="text-white">{adminControls?.maxClaimAmount || 'Unlimited'} CONNECT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network Fee:</span>
                      <span className="text-white">{adminControls?.claimFeePercentage || 0}%</span>
                    </div>
                    {nftPassStatus?.hasValidPass && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">NFT Bonus:</span>
                        <span className="text-green-400">+{nftPassStatus.multiplierBonus * 100}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0}}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Platform Stats
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">Solana Devnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Symbol:</span>
                  <span className="text-white">CONNECT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Users:</span>
                  <span className="text-white">Loading...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Claims:</span>
                  <span className="text-white">Loading...</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Claim Confirmation Dialog */}
        <AnimatePresence>
          {showClaimDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowClaimDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-4 text-center">Confirm Token Claim</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Claim Amount:</span>
                    <span className="text-white font-semibold">{parseInt(claimAmount || '0').toLocaleString()} CONNECT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee:</span>
                    <span className="text-white">{adminControls?.claimFeePercentage || 0}%</span>
                  </div>
                  {nftPassStatus?.hasValidPass && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">NFT Pass Bonus:</span>
                      <span className="text-green-400">+{nftPassStatus.multiplierBonus * 100}%</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClaimDialog(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClaimTokens}
                    disabled={claiming}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50"
                  >
                    {claiming ? 'Processing...' : 'Confirm Claim'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}