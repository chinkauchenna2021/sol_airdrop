'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coins, Clock, Flame, Gift, CheckCircle, 
  Calendar, TrendingUp, Star 
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DailyEarningData {
  canClaim: boolean
  lastClaim?: string
  currentStreak: number
  totalEarned: number
  nextClaimIn: number
  claiming: boolean
}

export const DailyEarningCard = () => {
  const [data, setData] = useState<DailyEarningData>({
    canClaim: true,
    currentStreak: 0,
    totalEarned: 0,
    nextClaimIn: 0,
    claiming: false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchEarningStatus()
    
    // Update countdown every minute
    const interval = setInterval(fetchEarningStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchEarningStatus = async () => {
    try {
      const res = await fetch('/api/earning/status')
      if (res.ok) {
        const earningData = await res.json()
        setData(earningData)
      }
    } catch (error) {
      console.error('Failed to fetch earning status:', error)
    }
  }

  const handleDailyClaim = async () => {
    if (!data.canClaim || data.claiming) return

    setData(prev => ({ ...prev, claiming: true }))

    try {
      const res = await fetch('/api/earning/daily-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(result.message)
        setData(prev => ({
          ...prev,
          canClaim: false,
          currentStreak: result.currentStreak,
          totalEarned: prev.totalEarned + result.tokens + (result.streakBonus || 0),
          nextClaimIn: result.nextClaimIn,
          lastClaim: new Date().toISOString()
        }))
      } else {
        toast.error(result.error || 'Failed to claim daily reward')
        if (result.nextClaimIn) {
          setData(prev => ({ ...prev, nextClaimIn: result.nextClaimIn }))
        }
      }
    } catch (error) {
      console.error('Daily claim error:', error)
      toast.error('Failed to claim daily reward')
    } finally {
      setData(prev => ({ ...prev, claiming: false }))
    }
  }

  const formatTimeLeft = (hours: number) => {
    if (hours <= 0) return "Ready to claim!"
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m remaining`
  }

  const getStreakReward = (streak: number) => {
    if (streak >= 30) return 15
    if (streak >= 7) return 5
    return 0
  }

  if (!mounted) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <Coins className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Daily Earning</h3>
            <p className="text-gray-400 text-sm">5 CONNECT tokens per day</p>
          </div>
        </div>
        
        {data.currentStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-full">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 font-semibold">{data.currentStreak}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalEarned.toLocaleString()}</p>
          <p className="text-green-400 text-sm">CONNECT tokens</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.currentStreak}</p>
          <p className="text-blue-400 text-sm">days in a row</p>
        </div>
      </div>

      {/* Streak Bonuses */}
      {data.currentStreak > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Streak Bonuses
          </h4>
          <div className="space-y-2">
            <div className={`flex justify-between p-2 rounded-lg ${
              data.currentStreak >= 7 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              <span>7-day streak</span>
              <span>+5 tokens</span>
              {data.currentStreak >= 7 && <CheckCircle className="w-4 h-4" />}
            </div>
            <div className={`flex justify-between p-2 rounded-lg ${
              data.currentStreak >= 30 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              <span>30-day streak</span>
              <span>+15 tokens</span>
              {data.currentStreak >= 30 && <CheckCircle className="w-4 h-4" />}
            </div>
          </div>
        </div>
      )}

      {/* Claim Button */}
      <motion.button
        onClick={handleDailyClaim}
        disabled={!data.canClaim || data.claiming}
        whileHover={{ scale: data.canClaim ? 1.02 : 1 }}
        whileTap={{ scale: data.canClaim ? 0.98 : 1 }}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          data.canClaim
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {data.claiming ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Claiming...
          </>
        ) : data.canClaim ? (
          <>
            <Gift className="w-5 h-5" />
            Claim 5 CONNECT
            {getStreakReward(data.currentStreak) > 0 && (
              <span className="px-2 py-1 bg-yellow-500/30 text-yellow-400 rounded-full text-xs">
                +{getStreakReward(data.currentStreak)} bonus
              </span>
            )}
          </>
        ) : (
          <>
            <Clock className="w-5 h-5" />
            {formatTimeLeft(data.nextClaimIn)}
          </>
        )}
      </motion.button>

      {data.lastClaim && (
        <p className="text-center text-gray-400 text-sm mt-3">
          Last claimed: {new Date(data.lastClaim).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  )
}