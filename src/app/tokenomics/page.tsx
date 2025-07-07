'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Coins, TrendingUp, Users, Lock, Calendar, ArrowLeft, Flame, Shield, Rocket, BarChart3, PieChart, Activity, Zap, Globe, ArrowUpRight } from 'lucide-react'
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
  const [selectedAllocation, setSelectedAllocation] = useState<number | null>(null)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.8, 1])
  const opacityProgress = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  const tokenAllocation = [
    {
      category: 'Airdrop Rewards',
      percentage: 40,
      amount: 40000000,
      description: 'Distributed to users through engagement rewards and airdrops',
      vesting: 'Released over 24 months',
      icon: Coins,
      color: 'from-purple-500 to-purple-600',
      gradient: 'from-purple-600/20 to-pink-600/20',
      details: [
        'Monthly distribution events',
        'Performance-based rewards',
        'Community milestones bonuses',
        'Special event airdrops'
      ]
    },
    {
      category: 'Community Incentives',
      percentage: 25,
      amount: 25000000,
      description: 'Reserved for community growth, partnerships, and ecosystem development',
      vesting: 'Released over 36 months',
      icon: Users,
      color: 'from-green-500 to-green-600',
      gradient: 'from-green-600/20 to-blue-600/20',
      details: [
        'DAO governance rewards',
        'Liquidity provider incentives',
        'Bug bounty programs',
        'Community proposals'
      ]
    },
    {
      category: 'Team & Advisors',
      percentage: 15,
      amount: 15000000,
      description: 'Allocated to team members and advisors',
      vesting: '12-month cliff, then linear over 24 months',
      icon: Lock,
      color: 'from-blue-500 to-blue-600',
      gradient: 'from-blue-600/20 to-purple-600/20',
      details: [
        'Core development team',
        'Strategic advisors',
        'Future hires allocation',
        'Performance bonuses'
      ]
    },
    {
      category: 'Liquidity Pool',
      percentage: 10,
      amount: 10000000,
      description: 'Initial liquidity for DEX listings',
      vesting: 'Immediate release',
      icon: TrendingUp,
      color: 'from-yellow-500 to-yellow-600',
      gradient: 'from-yellow-600/20 to-orange-600/20',
      details: [
        'DEX liquidity provision',
        'CEX market making',
        'Cross-chain bridges',
        'Stability reserves'
      ]
    },
    {
      category: 'Marketing & Operations',
      percentage: 5,
      amount: 5000000,
      description: 'Marketing campaigns and operational expenses',
      vesting: 'Released quarterly over 24 months',
      icon: Rocket,
      color: 'from-red-500 to-red-600',
      gradient: 'from-red-600/20 to-pink-600/20',
      details: [
        'Global marketing campaigns',
        'Partnership development',
        'Conference sponsorships',
        'Content creation'
      ]
    },
    {
      category: 'Reserve Fund',
      percentage: 5,
      amount: 5000000,
      description: 'Emergency fund and future development',
      vesting: 'Locked for 12 months minimum',
      icon: Shield,
      color: 'from-indigo-500 to-indigo-600',
      gradient: 'from-indigo-600/20 to-purple-600/20',
      details: [
        'Emergency liquidity',
        'Strategic acquisitions',
        'Market stabilization',
        'Future innovations'
      ]
    },
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-green-900/20">
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
            backgroundImage: "radial-gradient(circle at 20% 80%, #9945FF 0%, transparent 50%), radial-gradient(circle at 80% 20%, #14F195 0%, transparent 50%), radial-gradient(circle at 40% 40%, #FF6B6B 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-xl border border-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
            </motion.div>
            <h1 className="text-3xl font-bold text-white">Tokenomics</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl flex items-center gap-2"
          >
            View Whitepaper <ArrowUpRight className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 pt-10"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 mx-auto mb-8 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-green-500 rounded-full blur-2xl opacity-50" />
            <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-4xl font-black text-white">$AIR</span>
            </div>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            {process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'AIRDROP'} Token
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            A deflationary utility token designed to reward community engagement and drive ecosystem growth
            through innovative tokenomics and sustainable distribution models.
          </p>
        </motion.div>

        {/* Key Metrics with 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            { 
              title: 'Total Supply', 
              value: data.totalSupply / 1000000, 
              suffix: 'M', 
              icon: Coins,
              color: 'from-purple-500 to-pink-500',
              change: '+0%'
            },
            { 
              title: 'Circulating Supply', 
              value: data.circulatingSupply / 1000000, 
              suffix: 'M', 
              icon: Activity,
              color: 'from-green-500 to-blue-500',
              change: '+12.5%'
            },
            { 
              title: 'Market Cap', 
              value: data.marketCap, 
              prefix: '$', 
              icon: BarChart3,
              color: 'from-blue-500 to-purple-500',
              change: '+25.3%'
            },
            { 
              title: 'Token Holders', 
              value: data.holders, 
              icon: Users,
              color: 'from-yellow-500 to-red-500',
              change: '+8.7%'
            },
          ].map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, rotateX: -20, z: -50 }}
              animate={{ opacity: 1, rotateX: 0, z: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              whileHover={{ 
                z: 20,
                rotateX: 5,
                transition: { duration: 0.3 }
              }}
              style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              className="relative"
            >
              <div className="relative p-6 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-gray-800 hover:border-gray-700 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-10 rounded-2xl`} />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className={`absolute top-4 right-4 w-16 h-16 bg-gradient-to-r ${metric.color} rounded-full opacity-20 blur-xl`}
                />
                <metric.icon className={`w-8 h-8 mb-4 text-white`} />
                <p className="text-gray-400 text-sm mb-2">{metric.title}</p>
                <h3 className="text-3xl font-bold text-white mb-1">
                  <CountUp 
                    end={metric.value} 
                    prefix={metric.prefix} 
                    suffix={metric.suffix} 
                    decimals={metric.prefix === '$' ? 0 : 0} 
                  />
                </h3>
                <p className={`text-sm ${metric.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.change}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-20"
        >
          <div className="p-8 md:p-12 rounded-3xl bg-gray-900/80 backdrop-blur-xl border border-gray-800">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <PieChart className="w-8 h-8 text-purple-400" />
              Token Distribution
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="relative">
                <TokenDistribution />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-green-500/10 rounded-full blur-3xl"
                />
              </div>
              <div className="space-y-4">
                {tokenAllocation.map((item, index) => (
                  <motion.div
                    key={item.category}
                    whileHover={{ x: 10 }}
                    onClick={() => setSelectedAllocation(selectedAllocation === index ? null : index)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.color}`} />
                        <span className="text-white font-medium">{item.category}</span>
                      </div>
                      <span className="text-purple-400 font-bold">{item.percentage}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Allocation Details with Animations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          <AnimatePresence mode="popLayout">
            {tokenAllocation.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.category}
                  layout
                  initial={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  className="relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} blur-xl opacity-50 rounded-2xl`} />
                  <div className="relative p-8 rounded-2xl bg-gray-900/90 backdrop-blur-xl border border-gray-800 hover:border-gray-700 transition-all duration-300">
                    <div className="flex items-start gap-6">
                      <motion.div
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 0.9, 1]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        className={`p-4 rounded-xl bg-gradient-to-br ${item.color} flex-shrink-0`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {item.category}
                        </h3>
                        <div className="flex items-center gap-6 mb-4">
                          <span className="text-3xl font-bold gradient-text">
                            {item.percentage}%
                          </span>
                          <span className="text-gray-400">
                            {(item.amount / 1000000).toFixed(0)}M tokens
                          </span>
                        </div>
                        <p className="text-gray-400 mb-4">{item.description}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <Lock className="w-4 h-4 text-purple-400" />
                          <p className="text-purple-400 text-sm font-medium">{item.vesting}</p>
                        </div>
                        
                        {selectedAllocation === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-800"
                          >
                            <ul className="space-y-2">
                              {item.details.map((detail, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex items-center gap-2 text-gray-400 text-sm"
                                >
                                  <Zap className="w-3 h-3 text-green-400" />
                                  {detail}
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Token Utility Section */}
        <motion.div
          style={{ scale: scaleProgress, opacity: opacityProgress }}
          className="p-12 rounded-3xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-800 mb-20"
        >
          <h2 className="text-3xl font-bold text-white mb-10 text-center">
            Token <span className="gradient-text">Utility & Mechanics</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-purple-400 flex items-center gap-3">
                <Shield className="w-6 h-6" />
                Platform Benefits
              </h3>
              <ul className="space-y-4">
                {[
                  { text: 'Governance voting rights on platform decisions', icon: '🗳️' },
                  { text: 'Staking rewards with up to 25% APY', icon: '💰' },
                  { text: 'Access to exclusive features and airdrops', icon: '🎁' },
                  { text: 'Reduced fees on all platform transactions', icon: '💳' },
                  { text: 'Early access to new features and partnerships', icon: '🚀' },
                ].map((benefit, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <span className="text-2xl">{benefit.icon}</span>
                    <span>{benefit.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-3">
                <Flame className="w-6 h-6" />
                Burn Mechanism
              </h3>
              <ul className="space-y-4">
                {[
                  { text: '2.5% of all claim fees are burned permanently', icon: '🔥' },
                  { text: 'Quarterly buyback and burn events', icon: '📈' },
                  { text: 'Deflationary supply model ensures scarcity', icon: '📉' },
                  { text: 'Maximum supply cap strictly enforced', icon: '🔒' },
                  { text: 'Community-driven burn proposals', icon: '👥' },
                ].map((mechanism, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <span className="text-2xl">{mechanism.icon}</span>
                    <span>{mechanism.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-6 rounded-2xl bg-black/50 border border-gray-800"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-gray-400 text-sm mb-1">Tokens Burned</p>
                <p className="text-2xl font-bold text-red-400">
                  <CountUp end={data.burnedSupply / 1000000} suffix="M" decimals={1} />
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Price</p>
                <p className="text-2xl font-bold text-green-400">
                  $<CountUp end={data.price} decimals={3} />
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">24h Volume</p>
                <p className="text-2xl font-bold text-blue-400">
                  $<CountUp end={875420} />
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Transactions</p>
                <p className="text-2xl font-bold text-purple-400">
                  <CountUp end={data.transactions} />
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}