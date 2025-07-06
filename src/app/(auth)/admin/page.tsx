'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Coins, TrendingUp, Activity, DollarSign, Twitter } from 'lucide-react'
import { CountUp } from '@/components/animations/CountUp'
import { UserGrowthChart } from '@/components/charts/UserGrowthChart'
import { TokenDistribution } from '@/components/charts/TokenDistribution'
import toast from 'react-hot-toast'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalPoints: number
  totalClaims: number
  pendingClaims: number
  totalDistributed: number
  totalEngagements: number
  newUsersToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      toast.error('Failed to load admin stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      change: '+8%',
    },
    {
      title: 'Total Points',
      value: stats.totalPoints,
      icon: Coins,
      color: 'from-purple-500 to-purple-600',
      change: '+25%',
    },
    {
      title: 'Tokens Distributed',
      value: stats.totalDistributed,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      change: '+15%',
      prefix: '$',
    },
    {
      title: 'Total Claims',
      value: stats.totalClaims,
      icon: TrendingUp,
      color: 'from-red-500 to-red-600',
      change: '+5%',
    },
    {
      title: 'Engagements',
      value: stats.totalEngagements,
      icon: Twitter,
      color: 'from-blue-400 to-blue-500',
      change: '+30%',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Platform overview and statistics</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <button className="px-4 py-2 bg-solana-purple text-white rounded-lg hover:bg-solana-purple/90 transition-all">
          Toggle Claims
        </button>
        <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
          Export Data
        </button>
        <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
          Send Announcement
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-lg glass-effect"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">{stat.change}</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-white">
                <CountUp end={stat.value} prefix={stat.prefix} />
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-lg glass-effect"
        >
          <h2 className="text-xl font-semibold text-white mb-4">User Growth</h2>
          <UserGrowthChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-lg glass-effect"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Token Distribution</h2>
          <TokenDistribution />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg glass-effect"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-gray-300">New user registered</span>
            </div>
            <span className="text-gray-500 text-sm">2 mins ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-gray-300">Twitter task completed</span>
            </div>
            <span className="text-gray-500 text-sm">5 mins ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-gray-300">Token claim processed</span>
            </div>
            <span className="text-gray-500 text-sm">10 mins ago</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}