'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { useWalletStore } from '@/store/useWalletStore'
import Link from 'next/link'

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

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="p-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Leaderboard
            </h1>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['all', 'monthly', 'weekly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? 'bg-solana-purple text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {range === 'all' ? 'All Time' : range === 'monthly' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* User Rank Card */}
        {connected && data?.userRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-lg glass-effect"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-2">Your Rank</p>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-white">#{data.userRank.rank}</span>
                  {data.userRank.change !== 0 && (
                    <div className={`flex items-center gap-1 ${
                      data.userRank.change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {data.userRank.change > 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(data.userRank.change)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {!connected && (
                <Link
                  href="/"
                  className="px-6 py-3 bg-solana-purple text-white rounded-lg hover:bg-solana-purple/90 transition-all"
                >
                  Connect Wallet to Track Rank
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {data && data.leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {/* 2nd Place */}
              <div className="mt-8">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-r from-gray-300 to-gray-500 flex items-center justify-center text-2xl font-bold text-white">
                    2
                  </div>
                  <h3 className="font-semibold text-white truncate">
                    {data.leaderboard[1].user.twitterUsername || 
                     `${data.leaderboard[1].user.walletAddress.slice(0, 4)}...${data.leaderboard[1].user.walletAddress.slice(-4)}`}
                  </h3>
                  <p className="text-solana-green font-bold">
                    {data.leaderboard[1].user.totalPoints.toLocaleString()} pts
                  </p>
                </div>
              </div>

              {/* 1st Place */}
              <div>
                <div className="text-center">
                  <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-bold text-white glow-effect">
                    1
                  </div>
                  <h3 className="font-semibold text-white truncate">
                    {data.leaderboard[0].user.twitterUsername || 
                     `${data.leaderboard[0].user.walletAddress.slice(0, 4)}...${data.leaderboard[0].user.walletAddress.slice(-4)}`}
                  </h3>
                  <p className="text-solana-green font-bold text-lg">
                    {data.leaderboard[0].user.totalPoints.toLocaleString()} pts
                  </p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="mt-8">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-2xl font-bold text-white">
                    3
                  </div>
                  <h3 className="font-semibold text-white truncate">
                    {data.leaderboard[2].user.twitterUsername || 
                     `${data.leaderboard[2].user.walletAddress.slice(0, 4)}...${data.leaderboard[2].user.walletAddress.slice(-4)}`}
                  </h3>
                  <p className="text-solana-green font-bold">
                    {data.leaderboard[2].user.totalPoints.toLocaleString()} pts
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="loading-spinner" />
            </div>
          ) : data ? (
            <LeaderboardTable 
              entries={data.leaderboard} 
              currentUserAddress={publicKey ?? undefined}
            />
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