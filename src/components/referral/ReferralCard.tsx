'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Share2, Users, Gift, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReferralCardProps {
  referralCode: string
  stats: {
    totalReferrals: number
    totalEarned: number
  }
}

export function ReferralCard({ referralCode, stats }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  const generateReferralLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    return `${baseUrl}?ref=${referralCode}`
  }

  const copyReferralLink = async () => {
    const link = generateReferralLink()
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Referral link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const shareOnTwitter = () => {
    const link = generateReferralLink()
    const text = "🚀 Join me on the Solana Airdrop Platform and earn rewards through social engagement! Use my referral link to get bonus points:"
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`
    window.open(tweetUrl, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Invite Friends</h3>
          <p className="text-gray-400">Earn 100 points per successful referral</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <div className="text-2xl font-bold text-purple-400">{stats.totalReferrals}</div>
          <div className="text-sm text-gray-400">Total Referrals</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <div className="text-2xl font-bold text-green-400">{stats.totalEarned}</div>
          <div className="text-sm text-gray-400">Points Earned</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="space-y-4">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Your Referral Link</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyReferralLink}
              className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            </motion.button>
          </div>
          <div className="mt-2 text-white font-mono text-sm break-all">
            {generateReferralLink()}
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyReferralLink}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={shareOnTwitter}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </motion.button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-green-400" />
          <span className="font-semibold text-green-400">How it works</span>
        </div>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span>Share your unique referral link</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span>Friends connect their wallet using your link</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span>You both earn 100 bonus points instantly!</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
