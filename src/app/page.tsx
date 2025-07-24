'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  ArrowRight, Twitter, Wallet, Trophy, Coins, Users, TrendingUp, 
  Shield, Zap, Star, Globe, ChevronDown, Play, CheckCircle,
  Layers, Target, Gift, Sparkles, Rocket, Crown, Medal
} from 'lucide-react'
import { useWalletStore } from '@/store/useWalletStore'
import { WalletButton } from '@/components/wallet/WalletButton'
import { FloatingElements } from '@/components/animations/FloatingElements'
import { CountUp } from '@/components/animations/CountUp'
import { TwitterConnection } from '@/components/twitter/TwitterConnection'

export default function EnhancedHomepage() {
  const { connected } = useWalletStore()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRewards: 0,
    totalEngagements: 0,
  })
  const [activeFeature, setActiveFeature] = useState(0)
  const [mounted, setMounted] = useState(false)

  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  useEffect(() => {
    setMounted(true)
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

  const features = [
    {
      icon: Wallet,
      title: "Connect Your Wallet",
      description: "Seamlessly connect your Solana wallet to start earning rewards instantly",
      color: "from-purple-500 to-purple-600",
      gradient: "from-purple-500/20 to-purple-600/20"
    },
    {
      icon: Twitter,
      title: "Link Social Media",
      description: "Connect your Twitter account to track engagements and maximize earnings",
      color: "from-blue-500 to-blue-600",
      gradient: "from-blue-500/20 to-blue-600/20"
    },
    {
      icon: Trophy,
      title: "Earn & Compete",
      description: "Complete tasks, engage with content, and climb the global leaderboard",
      color: "from-green-500 to-green-600",
      gradient: "from-green-500/20 to-green-600/20"
    },
    {
      icon: Coins,
      title: "Claim Rewards",
      description: "Convert your points to tokens and receive instant payouts to your wallet",
      color: "from-yellow-500 to-yellow-600",
      gradient: "from-yellow-500/20 to-yellow-600/20"
    }
  ]

  const testimonials = [
    {
      name: "Alex Chen",
      role: "DeFi Enthusiast",
      avatar: "/images/01.gif",
      content: "SolDrop has completely changed how I engage with crypto communities. The rewards are real!",
      rating: 5
    },
    {
      name: "Maria Rodriguez",
      role: "Crypto Trader",
      avatar: "/images/02.gif",
      content: "Amazing platform! I've earned over $500 just by being active on Twitter and completing simple tasks.",
      rating: 5
    },
    {
      name: "David Kim",
      role: "Community Manager",
      avatar: "/images/03.gif",
      content: "The tokenomics are brilliant and the community is incredibly supportive. Highly recommended!",
      rating: 5
    }
  ]

  const roadmapItems = [
    {
      quarter: "Q1 2025",
      title: "Platform Launch",
      description: "Core features, wallet integration, and initial token distribution",
      status: "completed"
    },
    {
      quarter: "Q2 2025",
      title: "Social Integration",
      description: "Twitter integration, engagement tracking, and referral system",
      status: "completed"
    },
    {
      quarter: "Q3 2025",
      title: "Advanced Features",
      description: "Multi-chain support, NFT rewards, and governance features",
      status: "in-progress"
    },
    {
      quarter: "Q4 2025",
      title: "Ecosystem Expansion",
      description: "Mobile app, API access, and enterprise partnerships",
      status: "upcoming"
    }
  ]

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 overflow-hidden">
      <FloatingElements />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"
        />
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-medium">Connect token airdrop</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
              Earn <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Rewards
              </span>
              <br />
              with Every 
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                {" "}Engagement
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The ultimate Connect Solana Airdrop where your social media engagement 
              translates to real cryptocurrency rewards. Join thousands earning daily!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            {!connected ? (
              <>
                <WalletButton />
                <Link
                  href="/leaderboard"
                  className="group flex items-center space-x-2 px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  <Trophy className="w-5 h-5" />
                  <span>View Leaderboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <Zap className="w-5 h-5" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/leaderboard"
                  className="group flex items-center space-x-2 px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  <Trophy className="w-5 h-5" />
                  <span>View Leaderboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            )}
          </motion.div>


          {/* Twitter Connection Section */}
            {
              connected && 
              (
            <section className="relative py-16 px-4">
              <div className="max-w-4xl mx-auto">
                <TwitterConnection />
              </div>
            </section>
              )
            }
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {[
              { icon: Users, label: 'Active Users', value: stats.totalUsers, color: 'from-blue-500 to-blue-600' },
              { icon: Coins, label: 'Total Rewards', value: stats.totalRewards, prefix: '$', color: 'from-green-500 to-green-600' },
              { icon: TrendingUp, label: 'Engagements', value: stats.totalEngagements, color: 'from-purple-500 to-purple-600' }
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl`} />
                  <div className="relative">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      <CountUp end={stat.value} prefix={stat.prefix} />
                    </h3>
                    <p className="text-gray-400 font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center space-y-2 text-gray-400"
          >
            <span className="text-sm">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Start earning cryptocurrency rewards in four simple steps. No complex setups, no hidden fees.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 h-full">
                    <div className="flex items-center justify-center mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center relative`}>
                        <Icon className="w-8 h-8 text-white" />
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 px-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Community</span> Says
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Join thousands of satisfied users who are already earning rewards daily.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-3">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Roadmap</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Discover what's coming next as we continue to revolutionize the airdrop ecosystem.
            </p>
          </motion.div>

          <div className="space-y-8">
            {roadmapItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`flex items-center space-x-8 ${index % 2 === 1 ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className="flex-1">
                  <div className={`p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 ${
                    item.status === 'completed' ? 'border-green-500/30' : 
                    item.status === 'in-progress' ? 'border-yellow-500/30' : 'border-purple-500/30'
                  }`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        item.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {item.quarter}
                      </span>
                      {item.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                    item.status === 'completed' ? 'border-green-500 bg-green-500/20' :
                    item.status === 'in-progress' ? 'border-yellow-500 bg-yellow-500/20' :
                    'border-purple-500 bg-purple-500/20'
                  }`}>
                    {item.status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    ) : item.status === 'in-progress' ? (
                      <Zap className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <Rocket className="w-8 h-8 text-purple-400" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Earning?</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of users already earning cryptocurrency rewards through social engagement.
              </p>
              {!connected && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <WalletButton />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}