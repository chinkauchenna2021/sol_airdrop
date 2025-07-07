'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Star, Flame, Zap, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { useWalletStore } from '@/store/useWalletStore'
import Link from 'next/link'
import Image from 'next/image'

interface LeaderboardData {
  leaderboard: Array<{
    rank: number
    user: {
      id: string
      walletAddress: string
      twitterUsername?: string
      twitterImage?: string
      totalPoints: number
    }
    change: number
  }>
  userRank?: {
    rank: number
    change: number
  }
}

export default function LeaderboardPage() {
  const { connected, publicKey } = useWalletStore()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'all' | 'monthly' | 'weekly'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const heroRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    fetchLeaderboard()
  }, [timeRange])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/leaderboard?range=${timeRange}`)
      if (res.ok) {
        const leaderboardData = await res.json()
        setData(leaderboardData)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPodiumGradient = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 via-yellow-500 to-yellow-600'
      case 2: return 'from-gray-300 via-gray-400 to-gray-500'
      case 3: return 'from-orange-400 via-orange-500 to-orange-600'
      default: return 'from-purple-400 to-pink-400'
    }
  }

  const getPodiumIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />
      case 2: return <Medal className="w-6 h-6 text-gray-300" />
      case 3: return <Medal className="w-6 h-6 text-orange-400" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-yellow-900/20">
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 30%, #FFD700 0%, transparent 50%), radial-gradient(circle at 70% 70%, #9945FF 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Header */}
      <header ref={heroRef} className="relative z-10 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <motion.div style={{ y, opacity }} className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-black text-white flex items-center gap-4"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-10 h-10 text-yellow-400" />
                </motion.div>
                Leaderboard
              </motion.h1>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/"
                  className="px-6 py-3 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  Back to Home
                </Link>
              </motion.div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Time Range Selector with Animation */}
              <div className="flex gap-2">
                {(['all', 'monthly', 'weekly'] as const).map((range) => (
                  <motion.button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-6 py-3 rounded-xl font-semibold transition-all ${
                      timeRange === range
                        ? 'text-black'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {timeRange === range && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl"
                        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">
                      {range === 'all' ? 'All Time' : range === 'monthly' ? 'This Month' : 'This Week'}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by username or wallet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-xl rounded-xl text-white placeholder-gray-400 border border-white/20 focus:border-purple-400 focus:outline-none transition-all"
                  />
                </motion.div>
              </div>

              {/* Filter Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </motion.button>
            </div>
          </div>
        </motion.div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6">
        {/* User Rank Card with Advanced Animation */}
        {connected && data?.userRank && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="mb-12"
          >
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl" />
              <div className="relative p-8 backdrop-blur-xl bg-gray-900/90 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 mb-3">Your Current Position</p>
                    <div className="flex items-center gap-6">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="text-6xl font-black gradient-text"
                      >
                        #{data.userRank.rank}
                      </motion.span>
                      {data.userRank.change !== 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                            data.userRank.change > 0 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {data.userRank.change > 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                          <span className="font-semibold">
                            {Math.abs(data.userRank.change)} positions
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-2xl"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium with 3D Effect */}
        {data && data.leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Top <span className="gradient-text">Performers</span>
            </h2>
            <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-12"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-400/50 to-gray-600/50 blur-2xl" />
                  <div className="relative text-center p-6 rounded-3xl bg-gray-900/90 backdrop-blur-xl border border-gray-700">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative w-24 h-24 mx-auto mb-4"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${getPodiumGradient(2)} rounded-full`} />
                      <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-black text-gray-300">2</span>
                      </div>
                    </motion.div>
                    {data.leaderboard[1].user.twitterImage ? (
                      <Image
                        src={data.leaderboard[1].user.twitterImage}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="mx-auto rounded-full mb-3"
                      />
                    ) : (
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-gray-400 to-gray-600 mb-3" />
                    )}
                    <h3 className="font-bold text-white text-lg truncate">
                      {data.leaderboard[1].user.twitterUsername || 
                       `${data.leaderboard[1].user.walletAddress.slice(0, 4)}...`}
                    </h3>
                    <p className="text-gray-400 font-bold text-2xl mt-2">
                      {data.leaderboard[1].user.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">points</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-yellow-400/50 to-orange-500/50 blur-3xl"
                  />
                  <div className="relative text-center p-8 rounded-3xl bg-gray-900/90 backdrop-blur-xl border-2 border-yellow-500/50">
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      className="relative w-32 h-32 mx-auto mb-4"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${getPodiumGradient(1)} rounded-full shadow-lg shadow-yellow-500/50`} />
                      <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                        <Crown className="w-12 h-12 text-yellow-400" />
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-4 -right-4"
                      >
                        <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    </motion.div>
                    {data.leaderboard[0].user.twitterImage ? (
                      <Image
                        src={data.leaderboard[0].user.twitterImage}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="mx-auto rounded-full mb-4 ring-4 ring-yellow-400/50"
                      />
                    ) : (
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mb-4" />
                    )}
                    <h3 className="font-bold text-white text-xl truncate">
                      {data.leaderboard[0].user.twitterUsername || 
                       `${data.leaderboard[0].user.walletAddress.slice(0, 4)}...`}
                    </h3>
                    <p className="gradient-text font-black text-3xl mt-2">
                      {data.leaderboard[0].user.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">points</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/50 to-red-500/50 blur-2xl" />
                  <div className="relative text-center p-6 rounded-3xl bg-gray-900/90 backdrop-blur-xl border border-orange-700">
                    <motion.div
                      animate={{ rotate: [0, -360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative w-24 h-24 mx-auto mb-4"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${getPodiumGradient(3)} rounded-full`} />
                      <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-black text-orange-400">3</span>
                      </div>
                    </motion.div>
                    {data.leaderboard[2].user.twitterImage ? (
                      <Image
                        src={data.leaderboard[2].user.twitterImage}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="mx-auto rounded-full mb-3"
                      />
                    ) : (
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-orange-400 to-red-500 mb-3" />
                    )}
                    <h3 className="font-bold text-white text-lg truncate">
                      {data.leaderboard[2].user.twitterUsername || 
                       `${data.leaderboard[2].user.walletAddress.slice(0, 4)}...`}
                    </h3>
                    <p className="text-orange-400 font-bold text-2xl mt-2">
                      {data.leaderboard[2].user.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">points</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Table with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-xl bg-gray-900/90 rounded-3xl border border-gray-800 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-400" />
              Full Rankings
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
              />
            </div>
          ) : data ? (
            <div className="p-6">
              <LeaderboardTable 
                entries={data.leaderboard} 
                currentUserAddress={publicKey ?? undefined}
              />
            </div>
          ) : (
            <p className="text-center text-gray-400 py-20">
              Failed to load leaderboard
            </p>
          )}
        </motion.div>
      </main>
    </div>
  )
}