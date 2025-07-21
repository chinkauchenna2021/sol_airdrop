'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coins, AlertTriangle, CheckCircle, ExternalLink,
  Trophy, Users, Star, Shield, DollarSign
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useWallet } from '@solana/wallet-adapter-react'
import { connection } from '@/lib/solana'

interface AirdropData {
  isEligible: boolean
  tier: 'HIGH' | 'MEDIUM' | 'LOW' | null
  allocation: number
  seasonActive: boolean
  claimingActive: boolean
  alreadyClaimed: boolean
  requirements: {
    twitterConnected: boolean
    walletConnected: boolean
    minimumEngagement: boolean
  }
}

export const AirdropClaimInterface = () => {
  const { connected, publicKey, signTransaction } = useWallet()
  const [data, setData] = useState<AirdropData>({
    isEligible: false,
    tier: null,
    allocation: 0,
    seasonActive: false,
    claimingActive: false,
    alreadyClaimed: false,
    requirements: {
      twitterConnected: false,
      walletConnected: false,
      minimumEngagement: false
    }
  })
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
        const airdropData = await res.json()
        setData(airdropData)
      }
    } catch (error) {
      console.error('Failed to fetch airdrop status:', error)
    }
  }

  const handleSOLPayment = async () => {
    if (!connected || !signTransaction || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }

    setPaymentStep('payment')

    try {
      // Create payment transaction for $4 worth of SOL
      const res = await fetch('/api/solana/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 4, // $4 USD
          payer: publicKey.toBase58()
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create payment transaction')
      }

      const { transaction } = await res.json()
      
      // Sign and send transaction
      const signedTx = await signTransaction(transaction)
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
        setData(prev => ({ ...prev, alreadyClaimed: true }))
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
      case 'HIGH': return <Trophy className="w-6 h-6 text-yellow-400" />
      case 'MEDIUM': return <Star className="w-6 h-6 text-blue-400" />
      case 'LOW': return <Users className="w-6 h-6 text-purple-400" />
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

  if (!data.seasonActive) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Airdrop Season Not Active</h3>
        </div>
        <p className="text-gray-300">
          The current airdrop season has ended. Please wait for the next season announcement.
        </p>
      </div>
    )
  }

  if (!data.claimingActive) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Airdrop Season Active</h3>
        </div>
        <p className="text-gray-300 mb-4">
          The airdrop season is currently active. Keep engaging to improve your tier!
        </p>
        {data.tier && (
          <div className={`bg-gradient-to-r ${getTierColor(data.tier)} rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-2">
              {getTierIcon(data.tier)}
              <span className="text-white font-semibold">{data.tier} Engagement Tier</span>
            </div>
            <p className="text-gray-300">
              Expected allocation: <span className="text-white font-bold">{data.allocation.toLocaleString()} CONNECT</span>
            </p>
          </div>
        )}
      </div>
    )
  }

  if (data.alreadyClaimed) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Airdrop Claimed</h3>
        </div>
        <p className="text-gray-300">
          You have successfully claimed your airdrop for this season.
        </p>
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
        
        <div className="space-y-3">
          {Object.entries(data.requirements).map(([key, met]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-300 capitalize">
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
      </div>

      {/* Tier and Allocation */}
      {data.isEligible && data.tier && (
        <div className={`bg-gradient-to-r ${getTierColor(data.tier)} rounded-2xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getTierIcon(data.tier)}
              <div>
                <h3 className="text-xl font-bold text-white">{data.tier} Engagement</h3>
                <p className="text-gray-300">Your current tier</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{data.allocation.toLocaleString()}</p>
              <p className="text-gray-300">CONNECT tokens</p>
            </div>
          </div>
        </div>
      )}

      {/* Claim Interface */}
      {data.isEligible && (
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
                      A $4 SOL payment is required to process your airdrop claim. 
                      This covers network fees and prevents spam claims.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSOLPayment}
                disabled={!connected || claiming}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Coins className="w-5 h-5" />
                Pay $4 SOL & Claim {data.allocation.toLocaleString()} CONNECT
              </button>
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
              <h3 className="text-xl font-bold text-white mb-2">Processing Claim</h3>
              <p className="text-gray-300 mb-4">
                Payment confirmed! Processing your airdrop claim...
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
              <h3 className="text-2xl font-bold text-white mb-2">Claim Successful!</h3>
              <p className="text-gray-300 mb-4">
                You have successfully claimed {data.allocation.toLocaleString()} CONNECT tokens!
              </p>
              <p className="text-green-400 text-sm">
                Tokens have been sent to your connected wallet address.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {!data.isEligible && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-bold text-white">Not Eligible</h3>
          </div>
          <p className="text-gray-300 mb-4">
            You don't meet the requirements for this airdrop season. 
            Complete the missing requirements above to become eligible.
          </p>
        </div>
      )}
    </motion.div>
  )
}
