
// components/twitter/TwitterStatus.tsx - Twitter Status Display
'use client'

import { motion } from 'framer-motion'
import { Twitter, Users, Activity, TrendingUp } from 'lucide-react'
import { useTwitterAuth } from '@/hooks/better/useBetterTwitterAuth'
import { useUserStore } from '@/store/useUserStore'

export function TwitterStatus() {
  const { isTwitterConnected, authUser } = useTwitterAuth()
  const { user } = useUserStore()

  if (!isTwitterConnected || !user) {
    return null
  }

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'HIGH': return 'text-green-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'LOW': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getTokenAllocation = (activity: string) => {
    switch (activity) {
      case 'HIGH': return '4,000'
      case 'MEDIUM': return '3,500'
      case 'LOW': return '3,000'
      default: return '3,000'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#1DA1F2]/20">
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Twitter Account</h3>
            <p className="text-gray-400 text-sm">@{user.twitterUsername}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${getActivityColor(user.twitterActivity || 'LOW')}`}>
            {user.twitterActivity  || 'LOW'} Activity
          </p>
          <p className="text-gray-400 text-sm">
            {getTokenAllocation(user.twitterActivity || 'LOW')} tokens
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-white">
            {user.twitterFollowers?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-400">Followers</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-white">
            {user.totalPoints?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-400">Total Points</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-white">
            #{user.rank || '?'}
          </p>
          <p className="text-xs text-gray-400">Rank</p>
        </div>
      </div>
    </motion.div>
  )
}