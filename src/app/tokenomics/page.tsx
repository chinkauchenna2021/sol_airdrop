'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Coins, TrendingUp, Users, Lock, Calendar, ArrowLeft } from 'lucide-react'
import { TokenDistribution } from '@/components/charts/TokenDistribution'
import { CountUp } from '@/components/animations/CountUp'

interface TokenomicsData {
  totalSupply: number
  circulatingSupply: number
  lockedSupply: number
  burnedSupply: number
  price: number
  marketCap: number
  holders: number
  transactions: number
}

export default function TokenomicsPage() {
  const [data, setData] = useState<TokenomicsData>({
    totalSupply: 100000000,
    circulatingSupply: 25000000,
    lockedSupply: 60000000,
    burnedSupply: 5000000,
    price: 0.05,
    marketCap: 1250000,
    holders: 15420,
    transactions: 284591,
  })

  const tokenAllocation = [
    {
      category: 'Airdrop Rewards',
      percentage: 40,
      amount: 40000000,
      description: 'Distributed to users through engagement rewards and airdrops',
      vesting: 'Released over 24 months',
      icon: Coins,
      color: 'from-purple-500 to-purple-600',
    },
    {
      category: 'Community Incentives',
      percentage: 25,
      amount: 25000000,
      description: 'Reserved for community growth, partnerships, and ecosystem development',
      vesting: 'Released over 36 months',
      icon: Users,
      color: 'from-green-500 to-green-600',
    },
    {
      category: 'Team & Advisors',
      percentage: 15,
      amount: 15000000,
      description: 'Allocated to team members and advisors',
      vesting: '12-month cliff, then linear over 24 months',
      icon: Lock,
      color: 'from-blue-500 to-blue-600',
    },
    {
      category: 'Liquidity Pool',
      percentage: 10,
      amount: 10000000,
      description: 'Initial liquidity for DEX listings',
      vesting: 'Immediate release',
      icon: TrendingUp,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      category: 'Marketing & Operations',
      percentage: 5,
      amount: 5000000,
      description: 'Marketing campaigns and operational expenses',
      vesting: 'Released quarterly over 24 months',
      icon: Calendar,
      color: 'from-red-500 to-red-600',
    },
    {
      category: 'Reserve Fund',
      percentage: 5,
      amount: 5000000,
      description: 'Emergency fund and future development',
      vesting: 'Locked for 12 months minimum',
      icon: Lock,
      color: 'from-indigo-500 to-indigo-600',
    },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="p-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <h1 className="text-3xl font-bold text-white">Tokenomics</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            {process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'AIRDROP'} Token
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A deflationary utility token designed to reward community engagement and drive ecosystem growth
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="stats-card text-center"
          >
            <h3 className="text-gray-400 text-sm mb-2">Total Supply</h3>
            <p className="text-2xl font-bold text-white">
              <CountUp end={data.totalSupply / 1000000} decimals={0} suffix="M" />
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="stats-card text-center"
          >
            <h3 className="text-gray-400 text-sm mb-2">Circulating Supply</h3>
            <p className="text-2xl font-bold text-solana-green">
              <CountUp end={data.circulatingSupply / 1000000} decimals={0} suffix="M" />
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="stats-card text-center"
          >
            <h3 className="text-gray-400 text-sm mb-2">Market Cap</h3>
            <p className="text-2xl font-bold text-white">
              <CountUp end={data.marketCap} prefix="$" decimals={0} />
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="stats-card text-center"
          >
            <h3 className="text-gray-400 text-sm mb-2">Token Holders</h3>
            <p className="text-2xl font-bold text-white">
              <CountUp end={data.holders} />
            </p>
          </motion.div>
        </div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="p-8 rounded-2xl glass-effect">
            <h2 className="text-2xl font-bold text-white mb-6">Token Distribution</h2>
            <TokenDistribution />
          </div>
        </motion.div>

        {/* Allocation Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tokenAllocation.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-lg glass-effect"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${item.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {item.category}
                    </h3>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-2xl font-bold text-solana-green">
                        {item.percentage}%
                      </span>
                      <span className="text-gray-400">
                        {(item.amount / 1000000).toFixed(0)}M tokens
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                    <p className="text-solana-purple text-sm font-medium">{item.vesting}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-8 rounded-2xl glass-effect"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Token Utility</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-solana-purple mb-3">Platform Benefits</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-solana-green mt-1">•</span>
                  <span>Governance voting rights on platform decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-solana-green mt-1">•</span>
                  <span>Staking rewards and yield farming opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-solana-green mt-1">•</span>
                  <span>Access to exclusive features and airdrops</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-solana-green mt-1">•</span>
                  <span>Reduced fees on platform transactions</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-solana-purple mb-3">Burn Mechanism</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-solana-green mt-1">•</span>
                  <span>2.5% of all claim fees are burned</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-solana-green mt-1">•</span>
                  <span>Quarterly buyback and burn events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-solana-green mt-1">•</span>
                  <span>Deflationary supply model</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-solana-green mt-1">•</span>
                  <span>Maximum supply cap enforced</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}