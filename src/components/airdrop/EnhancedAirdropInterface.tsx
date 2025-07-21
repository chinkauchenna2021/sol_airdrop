'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coins, AlertTriangle, CheckCircle, ExternalLink, DollarSign,
  Trophy, Users, Star, Shield, Loader, Clock, Gift,
  Wallet, Twitter, Target, Crown
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

interface AirdropStatus {
  isEligible: boolean
  tier: 'HIGH' | 'MEDIUM' | 'LOW' | null
  allocation: number
  seasonActive: boolean
  claimingActive: boolean
  alreadyClaimed: boolean
  paymentRequired: number // SOL amount
  requirements: {
    twitterConnected: boolean
    walletConnected: boolean
    minimumEngagement: boolean
    emailVerified: boolean
  }
  currentSeason: {
    id: string
    name: string
    status: string
    totalAllocation: number
    claimedPercentage: number
  } | null
}

export const EnhancedAirdropInterface = () => {
  const { connected, publicKey, signTransaction } = useWallet()
  const [status, setStatus] = useState<AirdropStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info')
  const [paymentSignature, setPaymentSignature] = useState<string>('')

  useEffect(() => {
    fetchAirdropStatus()
  }, [connected])

  const fetchAirdropStatus = async () => {
    try {
      const res = await fetch('/api/airdrop/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch airdrop status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSOLPayment = async () => {
    if (!connected || !signTransaction || !publicKey || !status) {
      toast.error('Please connect your wallet first')
      return
    }

    setPaymentStep('payment')

    try {
      // Create payment transaction
      const res = await fetch('/api/airdrop/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: status.paymentRequired,
          payer: publicKey.toBase58()
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create payment transaction')
      }

      const { transaction } = await res.json()
      
      // Sign and send transaction
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)
      const tx = Transaction.from(Buffer.from(transaction, 'base64'))
      const signedTx = await signTransaction(tx)
      const signature = await connection.sendRawTransaction(signedTx.serialize())
      
      setPaymentSignature(signature)
      setPaymentStep('processing')
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      toast.success('Payment confirmed! Processing airdrop claim...')
      
      // Process airdrop claim
      await processAirdropClaim(signature)
      
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Payment failed. Please try again.')
      setPaymentStep('info')
    }
  }

  const processAirdropClaim = async (signature: string) => {
    setClaiming(true)

    try {
      const res = await fetch('/api/airdrop/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentSignature: signature
        })
      })

      const result = await res.json()

      if (res.ok) {
        setPaymentStep('success')
        toast.success(`Successfully claimed ${result.tokens} CONNECT tokens!`)
        setStatus(prev => prev ? { ...prev, alreadyClaimed: true } : null)
      } else {
        throw new Error(result.error || 'Claim failed')
      }
    } catch (error) {
      console.error('Claim error:', error)
      toast.error('Airdrop claim failed. Please contact support.')
      setPaymentStep('info')
    } finally {
      setClaiming(false)
    }
  }

  const getTierIcon = (tier: string | null) => {
    switch (tier) {
      case 'HIGH': return <Crown className="w-6 h-6 text-yellow-400" />
      case 'MEDIUM': return <Star className="w-6 h-6 text-blue-400" />
      case 'LOW': return <Target className="w-6 h-6 text-purple-400" />
      default: return <Shield className="w-6 h-6 text-gray-400" />
    }
  }

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'HIGH': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
      case 'MEDIUM': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      case 'LOW': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="bg-white/5 rounded-2xl p-8 text-center">
        <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-gray-400">Loading airdrop status...</p>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">Unable to Load Airdrop Status</h3>
        </div>
        <p className="text-gray-300">
          Please try refreshing the page or contact support if the issue persists.
        </p>
      </div>
    )
  }

  // Season not active
  if (!status.seasonActive) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">No Active Airdrop Season</h3>
        </div>
        <p className="text-gray-300 mb-4">
          There is currently no active airdrop season. Please check back later for announcements.
        </p>
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-gray-400 text-sm">
            Stay updated by following our social media channels for the latest airdrop announcements.
          </p>
        </div>
      </div>
    )
  }

  // Season active but claiming not started
  if (!status.claimingActive) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Airdrop Season Active</h3>
        </div>
        
        {status.currentSeason && (
          <div className="mb-4">
            <p className="text-gray-300 mb-2">Current Season: <span className="text-white font-semibold">{status.currentSeason.name}</span></p>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">{status.currentSeason.claimedPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${status.currentSeason.claimedPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <p className="text-gray-300 mb-4">
          The claiming phase has not started yet. Keep engaging to improve your tier!
        </p>
        
        {status.tier && status.isEligible && (
          <div className={`bg-gradient-to-r ${getTierColor(status.tier)} rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-2">
              {getTierIcon(status.tier)}
              <span className="text-white font-semibold">{status.tier} Engagement Tier</span>
            </div>
            <p className="text-gray-300">
              Expected allocation: <span className="text-white font-bold">{status.allocation.toLocaleString()} CONNECT</span>
            </p>
          </div>
        )}
      </div>
    )
  }

  // Already claimed
  if (status.alreadyClaimed) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Airdrop Claimed Successfully</h3>
        </div>
        <p className="text-gray-300 mb-4">
          You have successfully claimed your airdrop allocation for this season.
        </p>
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-green-400 font-semibold text-lg">{status.allocation.toLocaleString()} CONNECT tokens</p>
          <p className="text-gray-400 text-sm">Sent to your connected wallet</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Eligibility Check */}
      <div className="bg-white/5 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          Eligibility Requirements
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(status.requirements).map(([key, met]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300 text-sm capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              {met ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
              )}
            </div>
          ))}
        </div>

        {!status.isEligible && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">Not Eligible</span>
            </div>
            <p className="text-gray-300 text-sm">
              Please complete the missing requirements above to become eligible for the airdrop.
            </p>
          </div>
        )}
      </div>

      {/* Tier and Allocation */}
      {status.isEligible && status.tier && (
        <div className={`bg-gradient-to-r ${getTierColor(status.tier)} rounded-2xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getTierIcon(status.tier)}
              <div>
                <h3 className="text-xl font-bold text-white">{status.tier} Engagement</h3>
                <p className="text-gray-300">Your current tier level</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{status.allocation.toLocaleString()}</p>
              <p className="text-gray-300">CONNECT tokens</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Coins className="w-4 h-4" />
              <span className="font-semibold">Tier Benefits</span>
            </div>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Guaranteed token allocation: {status.allocation.toLocaleString()} CONNECT</li>
              <li>• Priority access to future airdrops</li>
              <li>• Exclusive community benefits</li>
              {status.tier === 'HIGH' && <li>• VIP community channel access</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Claim Interface */}
      {status.isEligible && (
        <AnimatePresence mode="wait">
          {paymentStep === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/5 rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                Claim Your Airdrop
              </h3>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-semibold mb-1">Payment Required</p>
                    <p className="text-gray-300 text-sm">
                      A payment of <span className="font-semibold">${status.paymentRequired} worth of SOL</span> is required to process your airdrop claim. 
                      This covers blockchain fees and prevents spam claims.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-sm">Payment Amount</span>
                  </div>
                  <p className="text-xl font-bold text-white">${status.paymentRequired} SOL</p>
                  <p className="text-gray-400 text-xs">Network fees included</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400 text-sm">You Receive</span>
                  </div>
                  <p className="text-xl font-bold text-green-400">{status.allocation.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">CONNECT tokens</p>
                </div>
              </div>

              <button
                onClick={handleSOLPayment}
                disabled={!connected || claiming}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Coins className="w-5 h-5" />
                Pay ${status.paymentRequired} SOL & Claim {status.allocation.toLocaleString()} CONNECT
              </button>

              {!connected && (
                <p className="text-center text-gray-400 text-sm mt-3">
                  Please connect your wallet to proceed with the claim
                </p>
              )}
            </motion.div>
          )}

          {paymentStep === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center"
            >
              <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
              <p className="text-gray-300">Please confirm the transaction in your wallet...</p>
            </motion.div>
          )}

          {paymentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 text-center"
            >
              <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Processing Airdrop Claim</h3>
              <p className="text-gray-300 mb-4">
                Payment confirmed! Processing your airdrop distribution...
              </p>
              {paymentSignature && (
                <a
                  href={`https://solscan.io/tx/${paymentSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  View Payment Transaction
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </motion.div>
          )}

          {paymentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Airdrop Claim Successful!</h3>
              <p className="text-gray-300 mb-4">
                You have successfully claimed <span className="text-green-400 font-bold">{status.allocation.toLocaleString()} CONNECT tokens</span>!
              </p>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-green-400 text-sm mb-2">✅ Tokens sent to your wallet</p>
                <p className="text-green-400 text-sm">✅ Transaction confirmed on blockchain</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}
