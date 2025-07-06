'use client'

import { useState, useEffect } from 'react'
import { Coins, ArrowRight, Info, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface ClaimInterfaceProps {
  points: number
}

interface ClaimConfig {
  minClaimAmount: number
  claimRate: number
  claimsEnabled: boolean
  feePercentage: number
}

export function ClaimInterface({ points }: ClaimInterfaceProps) {
  const [claimAmount, setClaimAmount] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [config, setConfig] = useState<ClaimConfig>({
    minClaimAmount: 100,
    claimRate: 0.001,
    claimsEnabled: true,
    feePercentage: 2.5,
  })

  useEffect(() => {
    fetchClaimConfig()
  }, [])

  const fetchClaimConfig = async () => {
    try {
      const res = await fetch('/api/claims/config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch claim config:', error)
    }
  }

  const maxClaimAmount = points
  const tokenAmount = parseFloat(claimAmount || '0') * config.claimRate
  const feeAmount = tokenAmount * (config.feePercentage / 100)
  const netTokenAmount = tokenAmount - feeAmount

  const handleClaim = async () => {
    const amount = parseFloat(claimAmount)
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount < config.minClaimAmount) {
      toast.error(`Minimum claim amount is ${config.minClaimAmount} points`)
      return
    }

    if (amount > points) {
      toast.error('Insufficient points')
      return
    }

    try {
      setClaiming(true)
      
      const res = await fetch('/api/claims/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: amount,
          paymentMethod: 'SOLANA',
        }),
      })

      if (res.ok) {
        const { claimId, transactionHash } = await res.json()
        toast.success('Claim submitted successfully!')
        setClaimAmount('')
        
        // Monitor claim status
        monitorClaimStatus(claimId)
      } else {
        const error = await res.json()
        toast.error(error.message || 'Claim failed')
      }
    } catch (error) {
      toast.error('Failed to process claim')
    } finally {
      setClaiming(false)
    }
  }

  const monitorClaimStatus = async (claimId: string) => {
    let attempts = 0
    const maxAttempts = 30

    const checkStatus = setInterval(async () => {
      try {
        const res = await fetch(`/api/claims/${claimId}/status`)
        if (res.ok) {
          const { status, transactionHash } = await res.json()
          
          if (status === 'COMPLETED') {
            clearInterval(checkStatus)
            toast.success('Tokens transferred successfully!')
          } else if (status === 'FAILED') {
            clearInterval(checkStatus)
            toast.error('Claim failed. Please try again.')
          }
        }
      } catch (error) {
        console.error('Status check error:', error)
      }

      attempts++
      if (attempts >= maxAttempts) {
        clearInterval(checkStatus)
      }
    }, 2000)
  }

  if (!config.claimsEnabled) {
    return (
      <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Claims are temporarily disabled</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Available Points</span>
          <span className="text-white font-semibold">{points.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Conversion Rate</span>
          <span className="text-white text-sm">1 point = {config.claimRate} tokens</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-white text-sm font-medium">Points to Claim</label>
        <input
          type="number"
          value={claimAmount}
          onChange={(e) => setClaimAmount(e.target.value)}
          placeholder={`Min: ${config.minClaimAmount}`}
          max={maxClaimAmount}
          className="input-field"
        />
      </div>

      {claimAmount && parseFloat(claimAmount) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4 space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Token Amount</span>
            <span className="text-white">{tokenAmount.toFixed(4)} tokens</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network Fee ({config.feePercentage}%)</span>
            <span className="text-red-400">-{feeAmount.toFixed(4)} tokens</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between">
            <span className="text-white font-medium">You Receive</span>
            <span className="text-solana-green font-bold">{netTokenAmount.toFixed(4)} tokens</span>
          </div>
        </motion.div>
      )}

      <button
        onClick={handleClaim}
        disabled={claiming || !claimAmount || parseFloat(claimAmount) < config.minClaimAmount}
        className="w-full px-4 py-3 bg-solana-green text-black font-semibold rounded-lg hover:bg-solana-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {claiming ? (
          <>
            <div className="loading-spinner w-5 h-5 border-black" />
            Processing...
          </>
        ) : (
          <>
            <Coins className="w-5 h-5" />
            Claim Tokens
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <div className="flex items-start gap-2 text-gray-400 text-xs">
        <Info className="w-4 h-4 mt-0.5" />
        <p>
          Claims are processed on the Solana blockchain. Tokens will be sent to your connected wallet address.
        </p>
      </div>
    </div>
  )
}