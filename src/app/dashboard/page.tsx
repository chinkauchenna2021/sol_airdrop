import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Twitter, Trophy, TrendingUp, Users, Coins, 
  Star, Activity, Target, Gift, Zap, ArrowUpRight,
  CheckCircle, Circle, Calendar, Award,
  Eye, Heart, MessageCircle, Repeat, UserPlus
} from 'lucide-react'

interface DashboardData {
  user: {
    id: string
    walletAddress: string
    totalPoints: number
    rank: number
    level: number
    streak: number
    twitterUsername?: string
    twitterFollowers: number
    twitterActivity: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  stats: {
    todayPoints: number
    weeklyPoints: number
    totalEngagements: number
    referralCount: number
    tokenAllocation: number
  }
  recentActivity: Array<{
    id: string
    action: string
    points: number
    createdAt: string
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    unlocked: boolean
    progress: number
  }>
}

export default function EnhancedDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showClaim, setShowClaim] = useState(false)
  const containerRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/user/enhanced-dashboard')
      if (res.ok) {
        const dashboardData = await res.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">Failed to load dashboard</h2>
          <button onClick={fetchDashboardData} className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'HIGH': return 'from-green-500 to-emerald-600'
      case 'MEDIUM': return 'from-yellow-500 to-orange-600'
      case 'LOW': return 'from-blue-500 to-purple-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getActivityTokens = (activity: string) => {
    switch (activity) {
      case 'HIGH': return 4000
      case 'MEDIUM': return 3500
      case 'LOW': return 3000
      default: return 3000
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black overflow-hidden">
      {/* Animated Background */}
      <motion.div 
        style={{ y: backgroundY }}
        className="fixed inset-0 opacity-20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 transform rotate-12 scale-150" />
        <div className="absolute inset-0 bg-gradient-to-l from-blue-600/20 to-green-600/20 transform -rotate-12 scale-150" />
      </motion.div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3 + i * 0.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header 
        style={{ opacity: headerOpacity }}
        className="relative z-10 p-6 lg:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl lg:text-4xl font-bold text-white mb-2"
            >
              Welcome back, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {data.user.twitterUsername || 'Anon'}
              </span>!
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
            >
              Level {data.user.level} • Rank #{data.user.rank} • {data.user.streak} day streak 🔥
            </motion.p>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-4"
          >
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{data.user.totalPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Points</div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <div className="relative z-10 px-6 lg:px-8 mb-8">
        <div className="flex space-x-1 bg-black/20 backdrop-blur-xl rounded-2xl p-1">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'tasks', name: 'Tasks', icon: Target },
            { id: 'rewards', name: 'Rewards', icon: Gift },
            { id: 'analytics', name: 'Analytics', icon: TrendingUp }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="relative z-10 px-6 lg:px-8 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Today\'s Points',
                    value: data.stats.todayPoints,
                    icon: Zap,
                    color: 'from-yellow-500 to-orange-600',
                    change: '+12%'
                  },
                  {
                    title: 'Weekly Points',
                    value: data.stats.weeklyPoints,
                    icon: Calendar,
                    color: 'from-blue-500 to-purple-600',
                    change: '+8%'
                  },
                  {
                    title: 'Engagements',
                    value: data.stats.totalEngagements,
                    icon: Heart,
                    color: 'from-pink-500 to-red-600',
                    change: '+15%'
                  },
                  {
                    title: 'Referrals',
                    value: data.stats.referralCount,
                    icon: UserPlus,
                    color: 'from-green-500 to-emerald-600',
                    change: '+5%'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="p-6 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 relative overflow-hidden group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-sm text-green-400">{stat.change}</div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {stat.value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">{stat.title}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Twitter Activity & Token Allocation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Twitter Activity Level */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10" />
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                        <Twitter className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Twitter Activity</h3>
                        <p className="text-gray-400">Current activity level</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-r ${getActivityColor(data.user.twitterActivity)} relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/10" />
                        <div className="relative flex items-center justify-between">
                          <div>
                            <div className="text-xl font-bold text-white">{data.user.twitterActivity} ACTIVITY</div>
                            <div className="text-white/80">Token Allocation: {getActivityTokens(data.user.twitterActivity)} tokens</div>
                          </div>
                          <Star className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Followers</span>
                        <span className="text-white font-semibold">{data.user.twitterFollowers.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Engagements (30d)</span>
                        <span className="text-white font-semibold">{data.stats.totalEngagements}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Token Claim */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10" />
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500">
                        <Coins className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Token Claim</h3>
                        <p className="text-gray-400">Available allocation</p>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-white mb-2">
                        {data.stats.tokenAllocation.toLocaleString()}
                      </div>
                      <div className="text-gray-400">Tokens Available</div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowClaim(true)}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
                    >
                      <Gift className="w-5 h-5" />
                      Claim Tokens
                      <ArrowUpRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-purple-400" />
                  Recent Activity
                </h3>
                
                <div className="space-y-4">
                  {data.recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-gray-300">{activity.action}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-semibold">+{activity.points}</span>
                        <span className="text-gray-500 text-sm">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-white">Available Tasks</h2>
              {/* Tasks content would go here */}
              <div className="text-gray-400 text-center py-20">
                Tasks system will be implemented here
              </div>
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-white">Rewards & Achievements</h2>
              {/* Rewards content would go here */}
              <div className="text-gray-400 text-center py-20">
                Rewards system will be implemented here
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>
              {/* Analytics content would go here */}
              <div className="text-gray-400 text-center py-20">
                Analytics system will be implemented here
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {showClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClaim(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 p-8 rounded-3xl border border-white/10 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Claim Your Tokens</h3>
              <p className="text-gray-400 mb-6">
                You're about to claim {data.stats.tokenAllocation.toLocaleString()} tokens based on your 
                {data.user.twitterActivity.toLowerCase()} activity level.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowClaim(false)}
                  className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-shadow"
                >
                  Confirm Claim
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}