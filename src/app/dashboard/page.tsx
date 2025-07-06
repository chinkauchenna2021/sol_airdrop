'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Coins, Trophy, Twitter, TrendingUp, Users, Calendar } from 'lucide-react'
import { useWalletStore } from '@/store/useWalletStore'
import { TwitterConnect } from '@/components/twitter/TwitterConnection'
import { TwitterTasks } from '@/components/twitter/TwitterTasks'
import { PointsDisplay } from '@/components/leaderboard/PointsDisplay'
import { UserRank } from '@/components/leaderboard/UserRank'
import { EngagementChart } from '@/components/charts/EngagementChart'
import { ClaimInterface } from '@/components/claim/ClaimInterface'
import toast from 'react-hot-toast'

interface DashboardData {
  user: {
    id: string
    walletAddress: string
    totalPoints: number
    rank: number
    twitterUsername?: string
    twitterId?: string
  }
  stats: {
    todayPoints: number
    weeklyPoints: number
    totalEngagements: number
    referralCount: number
  }
  recentActivity: Array<{
    id: string
    action: string
    points: number
    createdAt: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const { connected } = useWalletStore()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    if (!connected) {
      router.push('/')
      return
    }
    fetchDashboardData()
  }, [connected, router])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/user/dashboard')
      if (res.ok) {
        const dashboardData = await res.json()
        setData(dashboardData)
      } else if (res.status === 401) {
        router.push('/')
      }
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleDailyCheckIn = async () => {
    try {
      const res = await fetch('/api/tasks/checkin', { method: 'POST' })
      if (res.ok) {
        toast.success('Daily check-in completed! +5 points')
        fetchDashboardData()
      }
    } catch (error) {
      toast.error('Check-in failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="p-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <UserRank rank={data.user.rank} />
            <PointsDisplay points={data.user.totalPoints} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Today's Points</p>
                <p className="text-2xl font-bold text-white">{data.stats.todayPoints}</p>
              </div>
              <Calendar className="w-8 h-8 text-solana-purple" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Weekly Points</p>
                <p className="text-2xl font-bold text-white">{data.stats.weeklyPoints}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-solana-green" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Engagements</p>
                <p className="text-2xl font-bold text-white">{data.stats.totalEngagements}</p>
              </div>
              <Twitter className="w-8 h-8 text-solana-purple" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="stats-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Referrals</p>
                <p className="text-2xl font-bold text-white">{data.stats.referralCount}</p>
              </div>
              <Users className="w-8 h-8 text-solana-green" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Twitter Connection */}
            {!data.user.twitterId ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-lg glass-effect"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Connect Twitter</h2>
                <p className="text-gray-400 mb-4">
                  Link your Twitter account to start earning points through social engagement
                </p>
                <TwitterConnect onConnect={fetchDashboardData} />
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-lg glass-effect"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Twitter Tasks</h2>
                  <TwitterTasks userId={data.user.id} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-lg glass-effect"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Engagement Activity</h2>
                  <EngagementChart userId={data.user.id} />
                </motion.div>
              </>
            )}

            {/* Daily Check-in */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-lg glass-effect"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Daily Check-in</h2>
              <p className="text-gray-400 mb-4">Visit daily to earn bonus points!</p>
              <button
                onClick={handleDailyCheckIn}
                className="px-6 py-3 bg-solana-purple text-white rounded-lg hover:bg-solana-purple/90 transition-all"
              >
                Check In Today
              </button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Claim Tokens */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-lg glass-effect"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Claim Tokens</h2>
              <ClaimInterface points={data.user.totalPoints} />
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-lg glass-effect"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{activity.action}</span>
                    <span className="text-solana-green font-semibold">+{activity.points}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Referral Link */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-lg glass-effect"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Invite Friends</h2>
              <p className="text-gray-400 text-sm mb-4">
                Earn 100 points for each friend who joins!
              </p>
              <button
                onClick={() => {
                  const referralLink = `${window.location.origin}?ref=${data.user.id}`
                  navigator.clipboard.writeText(referralLink)
                  toast.success('Referral link copied!')
                }}
                className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
              >
                Copy Referral Link
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}