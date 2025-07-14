'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Twitter, Wallet, Trophy, Coins, Users, TrendingUp } from 'lucide-react'
import { useWalletStore } from '@/store/useWalletStore'
import { WalletButton } from '@/components/wallet/WalletButton'
import { FloatingElements } from '@/components/animations/FloatingElements'
import { CountUp } from '@/components/animations/CountUp'
import { TwitterConnection } from '@/components/twitter/TwitterConnection'
import { TwitterConnectionButton } from '@/components/better/twitter/TwitterConnectionButton'

export default function HomePage() {
  const { connected } = useWalletStore()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRewards: 0,
    totalEngagements: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <main className="min-h-screen gradient-bg">
      <FloatingElements />
      <TwitterConnection  />
      {/* <TwitterConnectionButton /> */}
      {/* Hero Section */}
      {
        connected && <WalletButton />
      }
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            Earn <span className="gradient-text">Rewards</span> with
            <br />
            Every Engagement
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Connect your wallet, link Twitter, and start earning tokens through social engagement.
            The more you participate, the more you earn!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {!connected ? (
              <WalletButton />
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-solana-green text-black font-semibold bg-white rounded-lg hover:bg-solana-green/90 transition-all flex items-center gap-2"
                >
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/leaderboard"
                  className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all glass-effect"
                >
                  View Leaderboard
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="stats-card text-center"
          >
            <Users className="w-12 h-12 text-solana-purple mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">
              <CountUp end={stats.totalUsers} />
            </h3>
            <p className="text-gray-400">Active Users</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="stats-card text-center"
          >
            <Coins className="w-12 h-12 text-solana-green mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">
              <CountUp end={stats.totalRewards} prefix="$" />
            </h3>
            <p className="text-gray-400">Total Rewards</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="stats-card text-center"
          >
            <TrendingUp className="w-12 h-12 text-solana-purple mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">
              <CountUp end={stats.totalEngagements} />
            </h3>
            <p className="text-gray-400">Total Engagements</p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            How It <span className="gradient-text">Works</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-solana-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-solana-purple" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">1. Connect Wallet</h3>
              <p className="text-gray-400">
                Connect your Solana wallet to get started and secure your rewards
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-solana-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Twitter className="w-10 h-10 text-solana-green" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">2. Link Twitter</h3>
              <p className="text-gray-400">
                Connect your Twitter account to track your social engagements
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-solana-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-solana-purple" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">3. Earn Rewards</h3>
              <p className="text-gray-400">
                Complete tasks, engage with content, and climb the leaderboard
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="p-12 rounded-2xl glass-effect"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-gray-300 mb-8">
              Join thousands of users already earning rewards through social engagement
            </p>
            {!connected && <WalletButton />}
          </motion.div>
        </div>
      </section>
    </main>
  )
}