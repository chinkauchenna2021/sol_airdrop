'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, ChevronDown, Wallet, Trophy, BarChart3, 
  Coins, Users, Settings, Bell, Search, Zap, Shield,
  TrendingUp, Gift, Globe, Star, ArrowRight
} from 'lucide-react'
import { useWalletStore } from '@/store/useWalletStore'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useUserStore } from '@/store/useUserStore'

const navItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: BarChart3,
    description: 'Your personalized crypto dashboard'
  },
  { 
    name: 'Leaderboard', 
    href: '/leaderboard', 
    icon: Trophy,
    description: 'Global rankings and competitions'
  },
  { 
    name: 'Tokenomics', 
    href: '/tokenomics', 
    icon: Coins,
    description: 'Token distribution and economics'
  }
  // ,
  // { 
  //   name: 'Tasks', 
  //   href: '/tasks', 
  //   icon: Zap,
  //   description: 'Complete tasks and earn rewards'
  // }
]

const resources = [
  { name: 'Whitepaper', href: '/whitepaper', icon: Shield },
  { name: 'Documentation', href: '/docs', icon: Globe },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'Support', href: '/support', icon: Gift }
]

export default function CryptoNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showResources, setShowResources] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const pathname = usePathname()
  const { connected } = useWalletStore()
  const { user } = useUserStore()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => {
    setIsOpen(false)
    setShowResources(false)
  }

  return (
    <>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-black/90 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl shadow-purple-500/10' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="/" className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    SolDrop
                  </h1>
                  <p className="text-xs text-gray-400 -mt-1">Airdrop Platform</p>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <motion.div
                    key={item.name}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={item.href as any}
                      className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 shadow-lg' 
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                        />
                      )}
                    </Link>
                  </motion.div>
                )
              })}

              {/* Resources Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => setShowResources(!showResources)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">Resources</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showResources ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showResources && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 p-2"
                    >
                      {resources.map((resource) => {
                        const Icon = resource.icon
                        return (
                          <motion.div
                            key={resource.name}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Link
                              href={resource.href as any}
                              onClick={closeMenu}
                              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-purple-500/10 transition-all duration-200 group"
                            >
                              <Icon className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                              <span className="text-white group-hover:text-purple-300">{resource.name}</span>
                              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 ml-auto" />
                            </Link>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              {/* <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <Search className="w-5 h-5 text-gray-400" />
              </motion.button> */}

              {/* Notifications */}
              {/* {connected && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {notifications}
                    </span>
                  )}
                </motion.button>
              )} */}

              {/* User Points */}
              {connected && user && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                >
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-bold">{user.totalPoints?.toLocaleString() || 0}</span>
                  <span className="text-gray-400 text-sm">pts</span>
                </motion.div>
              )}

              {/* Wallet Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <WalletButton />
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                {isOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-purple-500/20"
            >
              <div className="px-4 py-6 space-y-4">
                {/* User Info */}
                {connected && user && (
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.twitterUsername || 'Anonymous'}</p>
                      <p className="text-sm text-gray-400">{user.totalPoints?.toLocaleString() || 0} points</p>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <motion.div
                        key={item.name}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          href={item.href as any}
                          onClick={closeMenu}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400' 
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.description}</p>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Resources */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm font-medium mb-3 px-4">Resources</p>
                  <div className="space-y-2">
                    {resources.map((resource) => {
                      const Icon = resource.icon
                      return (
                        <motion.div
                          key={resource.name}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Link
                            href={resource.href as any}
                            onClick={closeMenu}
                            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{resource.name}</span>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer */}
      <div className="h-20" />
    </>
  )
}