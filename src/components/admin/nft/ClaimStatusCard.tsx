// /components/admin/nft/ClaimStatusCard.tsx
'use client'

import { motion } from 'framer-motion'
import { 
  Shield, Crown, Star, Award, CheckCircle, 
  AlertTriangle, Clock, DollarSign, 
  Activity
} from 'lucide-react'

interface ClaimStatus {
  userTier: 'HIGH' | 'MEDIUM' | 'LOW' | null
  allocation: number
  claimingFee: number
  requirements: {
    nftPassRequired: boolean
    twitterConnected: boolean
    walletConnected: boolean
    minimumEngagement: boolean
    adminApproval: boolean
  }
}

interface ClaimStatusCardProps {
  claimStatus: ClaimStatus
  className?: string
}

export function ClaimStatusCard({ claimStatus, className = '' }: ClaimStatusCardProps) {
  const getEligibilityColor = (tier: string | null) => {
    switch (tier) {
      case 'HIGH': return 'text-green-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'LOW': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getEligibilityIcon = (tier: string | null) => {
    switch (tier) {
      case 'HIGH': return Crown
      case 'MEDIUM': return Star
      case 'LOW': return Award
      default: return Shield
    }
  }

  const getTierBadgeStyle = (tier: string | null) => {
    switch (tier) {
      case 'HIGH': return 'bg-green-600/20 text-green-400 border-green-500/30'
      case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
      case 'LOW': return 'bg-blue-600/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30'
    }
  }

  const requirementsList = [
    { key: 'nftPassRequired', label: 'NFT Pass Required', icon: Shield },
    { key: 'twitterConnected', label: 'Twitter Connected', icon: Star },
    { key: 'walletConnected', label: 'Wallet Connected', icon: CheckCircle },
    { key: 'minimumEngagement', label: 'Minimum Engagement', icon: Activity },
    { key: 'adminApproval', label: 'Admin Approval', icon: Crown }
  ]

  const IconComponent = getEligibilityIcon(claimStatus.userTier)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-600/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-yellow-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">Eligibility Status</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Your Tier</span>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getTierBadgeStyle(claimStatus.userTier)}`}>
                <div className="flex items-center gap-1">
                  <IconComponent className="w-4 h-4" />
                  <span>{claimStatus.userTier || 'Not Eligible'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Token Allocation</span>
            <span className="text-white font-bold text-lg">
              {claimStatus.allocation.toLocaleString()} TOKENS
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Claiming Fee</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-white font-bold">
                ${claimStatus.claimingFee} USD
              </span>
            </div>
          </div>

          {/* Tier Benefits */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg border border-blue-500/20">
            <h4 className="text-sm font-medium text-blue-400 mb-2">Tier Benefits</h4>
            <div className="text-xs text-gray-300 space-y-1">
              {claimStatus.userTier === 'HIGH' && (
                <>
                  <div>• Maximum token allocation</div>
                  <div>• Priority claim processing</div>
                  <div>• Exclusive airdrop access</div>
                </>
              )}
              {claimStatus.userTier === 'MEDIUM' && (
                <>
                  <div>• High token allocation</div>
                  <div>• Fast claim processing</div>
                  <div>• Early access features</div>
                </>
              )}
              {claimStatus.userTier === 'LOW' && (
                <>
                  <div>• Standard token allocation</div>
                  <div>• Regular claim processing</div>
                  <div>• Basic platform access</div>
                </>
              )}
              {!claimStatus.userTier && (
                <div className="text-red-400">• Complete requirements to unlock tier</div>
              )}
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Requirements Checklist</h3>
          
          <div className="space-y-3">
            {requirementsList.map(({ key, label, icon: Icon }) => {
              const met = claimStatus.requirements[key as keyof typeof claimStatus.requirements]
              
              return (
                <div key={key} className="flex items-center gap-3">
                  {met ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <Icon className={`w-4 h-4 ${met ? 'text-green-400' : 'text-red-400'}`} />
                  <span className={`text-sm ${met ? 'text-green-300' : 'text-red-300'}`}>
                    {label}
                  </span>
                  {met && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Completion Progress</span>
              <span className="text-white">
                {Object.values(claimStatus.requirements).filter(Boolean).length}/
                {Object.values(claimStatus.requirements).length}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(Object.values(claimStatus.requirements).filter(Boolean).length / Object.values(claimStatus.requirements).length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}