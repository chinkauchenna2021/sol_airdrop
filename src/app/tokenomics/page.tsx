'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft, ArrowUpRight, Coins, TrendingUp, Users, Lock, Calendar, 
  Shield, Rocket, BarChart3, PieChart, Activity, Zap, Globe, Star,
  Flame, Eye, Target, Crown, Award, Timer, CheckCircle, Info,
  ArrowRight, ExternalLink, Download, Share2, RefreshCw, TrendingDown
} from 'lucide-react'
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart
} from 'recharts'

interface TokenomicsData {
  totalSupply: number
  circulatingSupply: number
  lockedSupply: number
  burnedSupply: number
  price: number
  marketCap: number
  holders: number
  transactions: number
  volume24h: number
  priceChange24h: number
}

interface TokenDistribution {
  category: string
  percentage: number
  amount: number
  description: string
  vesting: string
  icon: React.ComponentType<any>
  color: string
  gradient: string
  details: string[]
  status: 'active' | 'locked' | 'burned'
  releaseDate?: string
}

interface ActivityAllocation {
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  tokens: number
  users: number
  requirements: string
  color: string
  gradient: string
  percentage: number
  totalAllocation: number
}

interface ChartData {
  tokenDistribution: any[]
  priceHistory: any[]
  supplyEvolution: any[]
  holderGrowth: any[]
  volumeHistory: any[]
  activityBreakdown: any[]
}

export default function EnhancedTokenomicsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedAllocation, setSelectedAllocation] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'distribution' | 'utility' | 'roadmap'>('overview')
  const [selectedMetric, setSelectedMetric] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TokenomicsData>({
    totalSupply: 100000000,
    circulatingSupply: 25000000,
    lockedSupply: 60000000,
    burnedSupply: 5000000,
    price: 0.0847,
    marketCap: 2117500,
    holders: 24680,
    transactions: 487291,
    volume24h: 1547820,
    priceChange24h: 12.5
  })
  const [chartData, setChartData] = useState<ChartData>({
    tokenDistribution: [],
    priceHistory: [],
    supplyEvolution: [],
    holderGrowth: [],
    volumeHistory: [],
    activityBreakdown: []
  })
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.8, 1])
  const opacityProgress = useTransform(scrollYProgress, [0, 0.3], [0, 1])
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 }
  const scaleSpring = useSpring(scaleProgress, springConfig)

  // Fetch data on component mount
  useEffect(() => {
    fetchTokenomicsData()
  }, [])

  const fetchTokenomicsData = async () => {
    try {
      setLoading(true)
      
      // Fetch multiple data sources concurrently
      const [
        distributionRes,
        userGrowthRes,
        engagementRes,
        statsRes
      ] = await Promise.all([
        fetch('/api/analytics/token-distribution'),
        fetch('/api/analytics/user-growth?days=90'),
        fetch('/api/analytics/engagement?days=30'),
        fetch('/api/stats')
      ])

      let distribution = []
      let userGrowth = []
      let engagement = []
      let stats = {}

      if (distributionRes.ok) {
        const distData = await distributionRes.json()
        distribution = distData.activityDistribution || []
      }

      if (userGrowthRes.ok) {
        userGrowth = await userGrowthRes.json()
      }

      if (engagementRes.ok) {
        engagement = await engagementRes.json()
      }

      if (statsRes.ok) {
        stats = await statsRes.json()
        setData(prev => ({
          ...prev,
          // holders: stats.totalUsers || prev.holders,
          holders: prev.holders,
          transactions: prev.transactions
          // transactions: stats.totalEngagements || prev.transactions
        }))
      }

      // Generate comprehensive chart data
      setChartData({
        tokenDistribution: distribution.length > 0 ? distribution : generateFallbackDistribution(),
        priceHistory: generatePriceHistory(),
        supplyEvolution: generateSupplyEvolution(),
        holderGrowth: userGrowth.length > 0 ? userGrowth : generateHolderGrowth(),
        volumeHistory: generateVolumeHistory(),
        activityBreakdown: distribution.length > 0 ? distribution : generateActivityBreakdown()
      })

    } catch (error) {
      console.error('Error fetching tokenomics data:', error)
      // Use fallback data
      setChartData({
        tokenDistribution: generateFallbackDistribution(),
        priceHistory: generatePriceHistory(),
        supplyEvolution: generateSupplyEvolution(),
        holderGrowth: generateHolderGrowth(),
        volumeHistory: generateVolumeHistory(),
        activityBreakdown: generateActivityBreakdown()
      })
    } finally {
      setLoading(false)
    }
  }

  // Fallback data generators
  const generateFallbackDistribution = () => [
    { name: 'High Activity Users', value: 40000000, percentage: 40, color: '#10B981', tokens: 4000, userCount: 10000 },
    { name: 'Medium Activity Users', value: 25000000, percentage: 25, color: '#F59E0B', tokens: 3500, userCount: 7143 },
    { name: 'Low Activity Users', value: 15000000, percentage: 15, color: '#6366F1', tokens: 3000, userCount: 5000 },
    { name: 'Community Rewards', value: 10000000, percentage: 10, color: '#8B5CF6', tokens: 0, userCount: 0 },
    { name: 'Team & Development', value: 10000000, percentage: 10, color: '#EF4444', tokens: 0, userCount: 0 }
  ]

  const generatePriceHistory = () => {
    const days = 30
    const basePrice = 0.0847
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      price: basePrice * (1 + (Math.random() - 0.5) * 0.4),
      volume: Math.random() * 2000000 + 500000
    }))
  }

  const generateSupplyEvolution = () => {
    const months = 12
    const totalSupply = 100000000
    return Array.from({ length: months }, (_, i) => ({
      month: new Date(Date.now() - (months - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
      circulating: Math.min(totalSupply * 0.25 + i * 2000000, totalSupply * 0.8),
      locked: Math.max(totalSupply * 0.6 - i * 1500000, totalSupply * 0.1),
      burned: Math.min(i * 500000, totalSupply * 0.1)
    }))
  }

  const generateHolderGrowth = () => {
    const days = 30
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      users: 15000 + i * 300 + Math.random() * 200,
      active: 8000 + i * 150 + Math.random() * 100
    }))
  }

  const generateVolumeHistory = () => {
    const days = 30
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      volume: Math.random() * 3000000 + 500000,
      transactions: Math.random() * 1000 + 200
    }))
  }

  const generateActivityBreakdown = () => [
    { name: 'High Activity', value: 4000, users: 1250, color: '#10B981', percentage: 35 },
    { name: 'Medium Activity', value: 3500, users: 2800, color: '#F59E0B', percentage: 45 },
    { name: 'Low Activity', value: 3000, users: 3950, color: '#6366F1', percentage: 20 }
  ]

  const activityAllocations: ActivityAllocation[] = [
    {
      level: 'HIGH',
      tokens: 4000,
      users: chartData.activityBreakdown.find(item => item.name === 'High Activity')?.users || 1250,
      requirements: '1000+ followers',
      color: '#10B981',
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      percentage: 35,
      totalAllocation: 5000000
    },
    {
      level: 'MEDIUM', 
      tokens: 3500,
      users: chartData.activityBreakdown.find(item => item.name === 'Medium Activity')?.users || 2800,
      requirements: '500+ followers',
      color: '#F59E0B',
      gradient: 'from-yellow-500 via-orange-500 to-yellow-600',
      percentage: 45,
      totalAllocation: 9800000
    },
    {
      level: 'LOW',
      tokens: 3000,
      users: chartData.activityBreakdown.find(item => item.name === 'Low Activity')?.users || 3950,
      requirements: '<500 followers',
      color: '#6366F1',
      gradient: 'from-blue-500 via-purple-500 to-indigo-600',
      percentage: 20,
      totalAllocation: 11850000
    }
  ]

  const tokenDistribution: TokenDistribution[] = [
    {
      category: 'Activity-Based Airdrop',
      percentage: 40,
      amount: 40000000,
      description: 'Distributed based on Twitter engagement and follower count',
      vesting: 'Released monthly over 18 months',
      icon: Activity,
      color: '#9945FF',
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      status: 'active',
      details: [
        'High Activity: 4,000 tokens per user',
        'Medium Activity: 3,500 tokens per user', 
        'Low Activity: 3,000 tokens per user',
        'Real-time tracking and verification'
      ]
    },
    {
      category: 'Community Incentives',
      percentage: 25,
      amount: 25000000,
      description: 'Reserved for community growth and ecosystem development',
      vesting: 'Linear release over 36 months',
      icon: Users,
      color: '#14F195',
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      status: 'locked',
      releaseDate: '2024-04-01',
      details: [
        'DAO governance rewards',
        'Liquidity mining incentives',
        'Bug bounty programs',
        'Community milestone bonuses'
      ]
    },
    {
      category: 'Team & Development',
      percentage: 15,
      amount: 15000000,
      description: 'Core team allocation with strict vesting',
      vesting: '12-month cliff, 24-month linear',
      icon: Shield,
      color: '#3B82F6',
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      status: 'locked',
      releaseDate: '2024-12-01',
      details: [
        'Core development team',
        'Strategic advisors',
        'Future team expansion',
        'Performance milestones'
      ]
    },
    {
      category: 'Liquidity & Exchange',
      percentage: 10,
      amount: 10000000,
      description: 'DEX/CEX liquidity and market making',
      vesting: 'Immediate release',
      icon: TrendingUp,
      color: '#F59E0B',
      gradient: 'from-yellow-500 via-orange-500 to-yellow-600',
      status: 'active',
      details: [
        'DEX liquidity pools',
        'CEX market making',
        'Cross-chain bridges',
        'Price stability reserves'
      ]
    },
    {
      category: 'Marketing & Partnerships',
      percentage: 5,
      amount: 5000000,
      description: 'Growth marketing and strategic partnerships',
      vesting: 'Quarterly releases over 24 months',
      icon: Rocket,
      color: '#EF4444',
      gradient: 'from-red-500 via-red-600 to-red-700',
      status: 'locked',
      releaseDate: '2024-03-01',
      details: [
        'Global marketing campaigns',
        'Influencer partnerships',
        'Conference sponsorships',
        'Content creation'
      ]
    },
    {
      category: 'Treasury Reserve',
      percentage: 5,
      amount: 5000000,
      description: 'Emergency fund and future development',
      vesting: 'Locked for 18 months minimum',
      icon: Lock,
      color: '#8B5CF6',
      gradient: 'from-violet-500 via-purple-500 to-violet-600',
      status: 'locked',
      releaseDate: '2025-06-01',
      details: [
        'Emergency liquidity',
        'Strategic acquisitions',
        'Market stabilization',
        'Innovation fund'
      ]
    }
  ]

  const keyMetrics = [
    {
      title: 'Total Supply',
      value: data.totalSupply / 1000000,
      suffix: 'M',
      icon: Coins,
      color: 'from-purple-500 to-purple-600',
      change: 'Fixed',
      description: 'Maximum tokens that will ever exist'
    },
    {
      title: 'Current Price',
      value: data.price,
      prefix: '$',
      icon: TrendingUp,
      color: data.priceChange24h > 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
      change: `${data.priceChange24h > 0 ? '+' : ''}${data.priceChange24h.toFixed(2)}%`,
      description: 'Current market price'
    },
    {
      title: 'Market Cap',
      value: data.marketCap / 1000000,
      suffix: 'M',
      prefix: '$',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      change: '+18.3%',
      description: 'Total market valuation'
    },
    {
      title: 'Holders',
      value: data.holders,
      icon: Users,
      color: 'from-green-500 to-green-600',
      change: '+247',
      description: 'Total token holders'
    },
    {
      title: '24h Volume',
      value: data.volume24h / 1000000,
      suffix: 'M',
      prefix: '$',
      icon: Activity,
      color: 'from-yellow-500 to-yellow-600',
      change: '+45.2%',
      description: 'Trading volume last 24h'
    },
    {
      title: 'Burned',
      value: data.burnedSupply / 1000000,
      suffix: 'M',
      icon: Flame,
      color: 'from-red-500 to-red-600',
      change: '+2.1%',
      description: 'Tokens permanently removed'
    }
  ]

  const utilityFeatures = [
    {
      title: 'Governance Rights',
      description: 'Vote on protocol upgrades and treasury allocation',
      icon: Crown,
      color: 'from-yellow-500 to-yellow-600',
      features: ['Protocol governance', 'Treasury decisions', 'Feature proposals', 'Parameter changes']
    },
    {
      title: 'Staking Rewards',
      description: 'Earn up to 25% APY by staking your tokens',
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
      features: ['Up to 25% APY', 'Flexible duration', 'Auto-compounding', 'Early unstaking']
    },
    {
      title: 'Fee Discounts',
      description: 'Reduced fees across all platform services',
      icon: Target,
      color: 'from-green-500 to-green-600',
      features: ['50% fee reduction', 'Priority processing', 'Bulk discounts', 'VIP support']
    },
    {
      title: 'Exclusive Access',
      description: 'Early access to new features and airdrops',
      icon: Star,
      color: 'from-blue-500 to-blue-600',
      features: ['Beta features', 'Priority airdrops', 'Exclusive events', 'Partner benefits']
    }
  ]

  const roadmapItems = [
    {
      quarter: 'Q1 2024',
      title: 'Platform Launch & Initial Distribution',
      status: 'completed',
      items: ['Platform launch', 'Initial airdrop', 'DEX listing', 'Community building']
    },
    {
      quarter: 'Q2 2024',
      title: 'Advanced Features & Partnerships',
      status: 'active',
      items: ['Staking mechanism', 'DAO governance', 'CEX listings', 'Strategic partnerships']
    },
    {
      quarter: 'Q3 2024',
      title: 'Ecosystem Expansion',
      status: 'upcoming',
      items: ['Cross-chain bridge', 'NFT integration', 'Mobile app', 'API platform']
    },
    {
      quarter: 'Q4 2024',
      title: 'Global Scale & Innovation',
      status: 'planned',
      items: ['Global expansion', 'AI integration', 'Enterprise solutions', 'Regulatory compliance']
    }
  ]

  // Custom chart components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-4 shadow-xl">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-green-400">
            {data.value?.toLocaleString()} tokens
          </p>
          <p className="text-gray-400 text-sm">{data.percentage}%</p>
          {data.tokens > 0 && (
            <>
              <p className="text-blue-400 text-sm">
                {data.tokens?.toLocaleString()} tokens per user
              </p>
              <p className="text-purple-400 text-sm">
                {data.userCount?.toLocaleString()} users
              </p>
            </>
          )}
        </div>
      )
    }
    return null
  }

  // Floating particles animation
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black overflow-hidden">
      {/* Advanced Animated Background */}
      <div className="fixed inset-0">
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-green-900/30"
        />
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-gradient-to-r from-purple-400 to-green-400 opacity-20"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Animated Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 0],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-xl border border-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
            </motion.div> */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-green-500 flex items-center justify-center"
              >
                <Coins className="w-5 h-5 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                Tokenomics
              </h1>
            </motion.div>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchTokenomicsData}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all backdrop-blur-xl border border-white/20 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </motion.button>
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all backdrop-blur-xl border border-white/20 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </motion.button> */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-green-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/25"
            >
              <Download className="w-4 h-4" />
              Whitepaper
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </div>
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
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-40 h-40 mx-auto mb-8 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-green-500 rounded-full blur-3xl opacity-50" />
            <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-purple-700 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50">
              <span className="text-5xl font-black text-white">$AIR</span>
            </div>
          </motion.div>
          
          <h2 className="text-6xl md:text-7xl font-black text-white mb-6">
            {process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'AIRDROP'} Token
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
            A revolutionary deflationary utility token designed to reward community engagement 
            through innovative activity-based distribution and sustainable tokenomics.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('distribution')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/25"
            >
              <PieChart className="w-5 h-5" />
              View Distribution
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-xl border border-white/20 flex items-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Trade on DEX
            </motion.button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-2 p-2 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'distribution', name: 'Distribution', icon: PieChart },
              { id: 'utility', name: 'Utility', icon: Zap },
              { id: 'roadmap', name: 'Roadmap', icon: Calendar }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-green-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {keyMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.title}
                    initial={{ opacity: 0, scale: 0.8, rotateX: -20 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: 5,
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => setSelectedMetric(selectedMetric === index ? null : index)}
                    className="relative cursor-pointer"
                  >
                    <div className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
                      <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-10 rounded-2xl group-hover:opacity-20 transition-opacity`} />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                            <metric.icon className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              metric.change.startsWith('+') ? 'text-green-400' : 
                              metric.change.startsWith('-') ? 'text-red-400' : 
                              'text-gray-400'
                            }`}>
                              {metric.change}
                            </div>
                          </div>
                        </div>
                        <h3 className="text-gray-400 text-sm mb-2">{metric.title}</h3>
                        <p className="text-3xl font-bold text-white mb-1">
                          {metric.prefix}{metric.value.toLocaleString()}{metric.suffix}
                        </p>
                        <p className="text-gray-500 text-xs">{metric.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Price History Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Price History (30 Days)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.priceHistory}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#10B981"
                          fillOpacity={1}
                          fill="url(#priceGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Volume Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Trading Volume (30 Days)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.volumeHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Holder Growth Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Holder Growth
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.holderGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="users"
                          stroke="#9945FF"
                          strokeWidth={3}
                          dot={{ fill: '#9945FF', r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="active"
                          stroke="#14F195"
                          strokeWidth={2}
                          dot={{ fill: '#14F195', r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Activity Breakdown Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-400" />
                    Activity Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={chartData.activityBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="percentage"
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                        >
                          {chartData.activityBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* Activity-Based Allocation */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10"
              >
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <Activity className="w-8 h-8 text-purple-400" />
                  Activity-Based Token Allocation
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {activityAllocations.map((allocation, index) => (
                    <motion.div
                      key={allocation.level}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      whileHover={{ scale: 1.05 }}
                      className="relative overflow-hidden rounded-2xl"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${allocation.gradient} opacity-20`} />
                      <div className="relative p-6 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: allocation.color }}
                          />
                          <h3 className="text-xl font-bold text-white">{allocation.level} Activity</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tokens per user:</span>
                            <span className="text-white font-bold">{allocation.tokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total users:</span>
                            <span className="text-white font-bold">{allocation.users.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Requirements:</span>
                            <span className="text-white font-bold">{allocation.requirements}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total allocation:</span>
                            <span className="text-white font-bold">{(allocation.totalAllocation / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-6 bg-gradient-to-r from-purple-500/20 to-green-500/20 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Smart Distribution Algorithm</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Our AI-powered algorithm analyzes Twitter engagement patterns, follower growth, 
                    and community participation to automatically assign activity levels and distribute 
                    tokens fairly based on real contribution to the ecosystem.
                  </p>
                </div>
              </motion.div>

              {/* Supply Evolution Chart */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10"
              >
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <Coins className="w-8 h-8 text-yellow-400" />
                  Supply Evolution
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.supplyEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="circulating" 
                        stackId="1" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="locked" 
                        stackId="1" 
                        stroke="#F59E0B" 
                        fill="#F59E0B" 
                        fillOpacity={0.6}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="burned" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        dot={{ fill: '#EF4444', r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'distribution' && (
            <motion.div
              key="distribution"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Main Distribution Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10"
              >
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <PieChart className="w-8 h-8 text-purple-400" />
                  Token Distribution Overview
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="relative">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData.tokenDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${percentage}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.tokenDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {chartData.tokenDistribution.map((item, index) => (
                      <motion.div
                        key={item.name}
                        whileHover={{ x: 10 }}
                        onClick={() => setSelectedAllocation(selectedAllocation === index ? null : index)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-white font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-purple-400 font-bold">{item.percentage}%</span>
                            <div className="text-gray-400 text-sm">
                              {(item.value / 1000000).toFixed(1)}M tokens
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Distribution Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {tokenDistribution.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.category}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedAllocation(selectedAllocation === index ? null : index)}
                      className="relative cursor-pointer"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 rounded-2xl blur-sm`} />
                      <div className="relative p-8 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{item.category}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                                  {item.percentage}%
                                </span>
                                <span className="text-gray-400 text-sm">
                                  {(item.amount / 1000000).toFixed(0)}M tokens
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              item.status === 'active' ? 'bg-green-400' :
                              item.status === 'locked' ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`} />
                            <span className="text-xs text-gray-400 capitalize">{item.status}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-4">{item.description}</p>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <Timer className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-purple-400 font-medium">{item.vesting}</span>
                        </div>
                        
                        <AnimatePresence>
                          {selectedAllocation === index && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-white/10"
                            >
                              <h4 className="text-white font-semibold mb-3">Key Features:</h4>
                              <ul className="space-y-2">
                                {item.details.map((detail, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-2 text-gray-300 text-sm"
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    {detail}
                                  </motion.li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'utility' && (
            <motion.div
              key="utility"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {utilityFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-300 mb-6">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-400">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'roadmap' && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {roadmapItems.map((item, index) => (
                  <motion.div
                    key={item.quarter}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-4 h-4 rounded-full ${
                        item.status === 'completed' ? 'bg-green-400' :
                        item.status === 'active' ? 'bg-yellow-400' :
                        item.status === 'upcoming' ? 'bg-blue-400' :
                        'bg-gray-400'
                      }`} />
                      <h3 className="text-xl font-bold text-white">{item.quarter}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                        item.status === 'active' ? 'bg-yellow-400/20 text-yellow-400' :
                        item.status === 'upcoming' ? 'bg-blue-400/20 text-blue-400' :
                        'bg-gray-400/20 text-gray-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-4">{item.title}</h4>
                    <ul className="space-y-2">
                      {item.items.map((task, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className={`w-4 h-4 ${
                            item.status === 'completed' ? 'text-green-400' : 'text-gray-400'
                          }`} />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}