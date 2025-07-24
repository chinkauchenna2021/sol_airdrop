'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Twitter, Github, Send, MessageCircle, Mail, MapPin, Phone, 
  Coins, Shield, Globe, Users, BookOpen, TrendingUp, 
  ArrowRight, Heart, Star, Zap, ChevronUp, ExternalLink
} from 'lucide-react'

const footerLinks = {
  platform: [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Tokenomics', href: '/' },
    { name: 'Tasks', href: '/' },
    { name: 'Referrals', href: '/' }
  ],
  resources: [
    { name: 'Whitepaper', href: '/' },
    { name: 'Documentation', href: '/' },
    { name: 'API Reference', href: '/' },
    { name: 'Smart Contracts', href: '/' },
    { name: 'Security Audit', href: '/' }
  ],
  community: [
    { name: 'Discord Server', href: 'https://discord.gg/soldrop' },
    { name: 'Twitter', href: 'https://twitter.com/soldrop' },
    { name: 'Telegram', href: 'https://t.me/soldrop' },
    { name: 'Medium Blog', href: 'https://medium.com/@soldrop' },
    { name: 'Reddit', href: 'https://reddit.com/r/soldrop' }
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Bug Reports', href: '/bugs' },
    { name: 'Feature Requests', href: '/features' },
    { name: 'Status Page', href: '/status' }
  ]
}

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/soldrop', icon: Twitter, color: 'hover:text-blue-400' },
  { name: 'Discord', href: 'https://discord.gg/soldrop', icon: MessageCircle, color: 'hover:text-indigo-400' },
  { name: 'Telegram', href: 'https://t.me/soldrop', icon: Send, color: 'hover:text-cyan-400' },
  { name: 'Github', href: 'https://github.com/soldrop', icon: Github, color: 'hover:text-gray-400' }
]

const stats = [
  { label: 'Total Users', value: '150K+', icon: Users },
  { label: 'Tokens Distributed', value: '$2.5M+', icon: Coins },
  { label: 'Security Score', value: '99.9%', icon: Shield },
  { label: 'Uptime', value: '99.99%', icon: TrendingUp }
]

export default function CryptoFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" suppressHydrationWarning>
        {[...Array(20)].map((_, i) => (
          <motion.div
            suppressHydrationWarning
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * -100, 0],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
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

      {/* Main Footer Content */}
      <div className="relative">
        {/* Stats Section */}
        <div className="border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
                      <Icon className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className=" bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                     <Image src={'/images/logo/sol_logo.jpg'} alt={"logo"}  height={50} width={50} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Connect
                    </h3>
                    <p className="text-gray-400 text-sm">Tweetxconnect</p>
                  </div>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  The ultimate Solana Tweetxconnect where community engagement meets decentralized rewards. 
                  Join thousands of users earning tokens through social interactions.
                </p>
              </motion.div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 ${social.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  )
                })}
              </div>

              {/* Newsletter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-3"
              >
                <h4 className="text-white font-semibold flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Stay Updated</span>
                </h4>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-all duration-300"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Platform Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h4 className="text-white font-semibold flex items-center space-x-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Platform</span>
              </h4>
              <ul className="space-y-2">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href as any}
                      className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Resources Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h4 className="text-white font-semibold flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Resources</span>
              </h4>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href as any}
                      className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                    >
                      <span>{link.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Community Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h4 className="text-white font-semibold flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Community</span>
              </h4>
              <ul className="space-y-2">
                {footerLinks.community.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                    >
                      <span>{link.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Support Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h4 className="text-white font-semibold flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Support</span>
              </h4>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href as any}
                      className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4 text-gray-400">
                <p>&copy; 2025 Tweetxconnect. All rights reserved.</p>
                <div className="flex items-center space-x-4">
                  <Link href={"/privacy" as any} className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link href={'/terms' as any} className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                  <span>•</span>
                  <Link href={"/cookies" as any} className="hover:text-white transition-colors">
                    Cookies
                  </Link>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <p className="text-gray-400 text-sm flex items-center space-x-2">
                  <span>Made with</span>
                  <Heart className="w-4 h-4 text-red-400 fill-current" />
                  <span>for the Solana community</span>
                </p>
                
                <motion.button
                  onClick={scrollToTop}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:shadow-lg transition-all duration-300"
                >
                  <ChevronUp className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}