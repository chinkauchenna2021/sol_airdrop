'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Home, BarChart3, Trophy, 
  Coins, Users, Settings, Bell, Search, Star, 
  TrendingUp, Gift, Zap, Shield, Globe, BookOpen,
  User, LogOut, Menu, X, ArrowRight, Activity
} from 'lucide-react'
import { useWalletStore } from '@/store/useWalletStore'
import { useUserStore } from '@/store/useUserStore'

const mainNavItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    badge: null,
    description: 'Overview & Analytics'
  },
  { 
    name: 'Leaderboard', 
    href: '/leaderboard', 
    icon: Trophy,
    badge: null,
    description: 'Global Rankings'
  },
  { 
    name: 'Tokenomics', 
    href: '/tokenomics', 
    icon: Coins,
    badge: null,
    description: 'Token Distribution'
  },
  { 
    name: 'Tasks', 
    href: '/tasks', 
    icon: Zap,
    badge: '3',
    description: 'Earn Rewards'
  },
  { 
    name: 'Rewards', 
    href: '/rewards', 
    icon: Gift,
    badge: null,
    description: 'Claim Tokens'
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3,
    badge: null,
    description: 'Performance Metrics'
  }
]

const secondaryNavItems = [
  { 
    name: 'Profile', 
    href: '/profile', 
    icon: User,
    description: 'Account Settings'
  },
  { 
    name: 'Notifications', 
    href: '/notifications', 
    icon: Bell,
    badge: '5',
    description: 'Updates & Alerts'
  },
  { 
    name: 'Resources', 
    href: '/resources', 
    icon: BookOpen,
    description: 'Documentation'
  },
  { 
    name: 'Support', 
    href: '/support', 
    icon: Shield,
    description: 'Help & Support'
  }
]

interface CryptoSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function CryptoSidebar({ isOpen, onToggle }: CryptoSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { connected } = useWalletStore()
  const { user } = useUserStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!mounted) return null

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' }
  }

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={collapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl border-r border-purple-500/20 z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300`}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-purple-500/20">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="logo-expanded"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    SolDrop
                  </h2>
                  <p className="text-xs text-gray-400">Airdrop Platform</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {collapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto"
            >
              <Coins className="w-6 h-6 text-white" />
            </motion.div>
          )}

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggle}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
            >
              <X className="w-4 h-4 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* User Profile */}
        {connected && user && (
          <div className="px-4 py-6 border-b border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    key="user-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-white font-medium truncate">
                      {user.twitterUsername || 'Anonymous'}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>{user.totalPoints?.toLocaleString() || 0} pts</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  key="user-stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="mt-4 grid grid-cols-2 gap-4"
                >
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className="text-lg font-bold text-white">#{user.rank || '?'}</p>
                    <p className="text-xs text-gray-400">Rank</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className="text-lg font-bold text-white">{user.rank || 1}</p>
                    <p className="text-xs text-gray-400">Level</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={item.href as any}
                    className={`group relative flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.div
                          key="nav-content"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.name}</span>
                            {item.badge && (
                              <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {collapsed && item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-2 w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="px-4 py-6 border-t border-purple-500/20 space-y-2">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <motion.div
                key={item.name}
                whileHover={{ x: collapsed ? 0 : 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={item.href as any}
                  className={`group relative flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.div
                        key="secondary-nav-content"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 min-w-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.badge && (
                            <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {collapsed && item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-purple-500/20">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="footer-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>v2.0.1</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Online</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Built with ❤️ for the Solana community
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  )
}