'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, Settings, User, LogOut, Search, Moon, Sun, 
  Coins, Star, TrendingUp, Crown, Shield, Zap,
  ChevronDown, Menu, X, Globe, Activity
} from 'lucide-react'
import { useWalletStore } from '@/store/useWalletStore'
import { useUserStore } from '@/store/useUserStore'
import Link from 'next/link'

interface HeaderProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
  title?: string
  subtitle?: string
}

export default function Header({ 
  onMenuToggle, 
  showMenuButton = true, 
  title, 
  subtitle 
}: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(5)
  const [darkMode, setDarkMode] = useState(true)
  const { connected } = useWalletStore()
  const { user } = useUserStore()

  // Mock notifications data
  const notificationItems = [
    {
      id: 1,
      type: 'reward',
      title: 'Reward Earned!',
      message: 'You earned 50 points for completing a Twitter task',
      time: '2 min ago',
      read: false,
      icon: Coins,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 2,
      type: 'level',
      title: 'Level Up!',
      message: 'Congratulations! You reached level 5',
      time: '1 hour ago',
      read: false,
      icon: Crown,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 3,
      type: 'rank',
      title: 'Rank Update',
      message: 'You moved up to rank #247 on the leaderboard',
      time: '3 hours ago',
      read: true,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 4,
      type: 'system',
      title: 'System Update',
      message: 'New features available! Check out the updated dashboard',
      time: '1 day ago',
      read: true,
      icon: Zap,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 5,
      type: 'security',
      title: 'Security Alert',
      message: 'Your account was accessed from a new device',
      time: '2 days ago',
      read: true,
      icon: Shield,
      color: 'from-red-500 to-red-600'
    }
  ]

  const unreadCount = notificationItems.filter(n => !n.read).length

  const getActivityBadge = (activity: string) => {
    switch (activity) {
      case 'HIGH':
        return { text: 'HIGH', color: 'from-green-500 to-green-600' }
      case 'MEDIUM':
        return { text: 'MED', color: 'from-yellow-500 to-yellow-600' }
      case 'LOW':
        return { text: 'LOW', color: 'from-blue-500 to-blue-600' }
      default:
        return { text: 'NEW', color: 'from-gray-500 to-gray-600' }
    }
  }

  const markAsRead = (id: number) => {
    // In a real app, this would update the notification state
    console.log('Mark notification as read:', id)
  }

  const clearAllNotifications = () => {
    // In a real app, this would clear all notifications
    console.log('Clear all notifications')
  }

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl shadow-purple-500/5">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          {/* Menu Button */}
          {showMenuButton && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMenuToggle}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 lg:hidden"
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.button>
          )}

          {/* Title */}
          {title && (
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-400 -mt-1">{subtitle}</p>
              )}
            </div>
          )}

          {/* Breadcrumbs for larger screens */}
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-purple-400 font-medium">Current Page</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            <Search className="w-5 h-5 text-gray-400" />
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-400" />
            )}
          </motion.button>

          {/* Notifications */}
          {connected && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-96 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                      <button
                        onClick={clearAllNotifications}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {notificationItems.map((notification) => {
                        const Icon = notification.icon
                        return (
                          <motion.div
                            key={notification.id}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => markAsRead(notification.id)}
                            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                              notification.read 
                                ? 'bg-white/5 hover:bg-white/10' 
                                : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${notification.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-white font-medium text-sm">{notification.title}</p>
                                  <span className="text-xs text-gray-500">{notification.time}</span>
                                </div>
                                <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Profile */}
          {connected && user && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-white font-medium text-sm truncate max-w-32">
                    {user.twitterUsername || 'Anonymous'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-gray-400 text-xs">
                      {user.totalPoints?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 p-4"
                  >
                    {/* User Info */}
                    <div className="flex items-center space-x-3 mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{user.twitterUsername || 'Anonymous'}</p>
                        <p className="text-gray-400 text-sm">{user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}</p>
                      </div>
                      {user.twitterActivity && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getActivityBadge(user.twitterActivity).color}`}>
                          {getActivityBadge(user.twitterActivity).text}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 rounded-xl bg-white/5">
                        <p className="text-lg font-bold text-white">#{user.rank || '?'}</p>
                        <p className="text-xs text-gray-400">Rank</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white/5">
                        <p className="text-lg font-bold text-white">{user.rank || 1}</p>
                        <p className="text-xs text-gray-400">Level</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white/5">
                        <p className="text-lg font-bold text-white">{user.totalPoints?.toLocaleString() || 0}</p>
                        <p className="text-xs text-gray-400">Points</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <Link
                        href={"/profile" as any}
                        className="flex items-center space-x-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        href={"/settings" as any}
                        className="flex items-center space-x-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Account Settings</span>
                      </Link>
                      <Link
                        href={"/help" as any}
                        className="flex items-center space-x-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Help & Support</span>
                      </Link>
                      <hr className="border-white/10 my-2" />
                      <button
                        onClick={() => {
                          // Handle logout
                          console.log('Logout clicked')
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}