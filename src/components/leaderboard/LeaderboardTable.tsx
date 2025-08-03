'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Minus, Eye, UserPlus, UserMinus, 
  Star, Flame, Zap, Twitter, ExternalLink, Award, Target,
  Calendar, Clock, Activity, Sparkles, Crown, Medal, Copy
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    walletAddress: string
    twitterUsername?: string
    twitterImage?: string
    totalPoints: number
    totalTokens: number
    level?: number
    streak?: number
    twitterFollowers?: number
    twitterActivity?: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  change: number
  previousRank?: number
  pointsChange?: number
  isNew?: boolean
}

interface EnhancedLeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserAddress?: string
  viewMode: 'table' | 'cards' | 'compact'
  comparisonMode: boolean
  compareList: string[]
  onCompareToggle: (userId: string) => void
  onUserClick: (user: LeaderboardEntry) => void
  highlightChanges: boolean
  timeRange: string
}

export function EnhancedLeaderboardTable({
  entries,
  currentUserAddress,
  viewMode,
  comparisonMode,
  compareList,
  onCompareToggle,
  onUserClick,
  highlightChanges,
  timeRange
}: EnhancedLeaderboardTableProps) {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', icon: <Crown className="w-5 h-5 text-yellow-400" /> }
    if (rank === 2) return { emoji: '🥈', icon: <Medal className="w-5 h-5 text-gray-300" /> }
    if (rank === 3) return { emoji: '🥉', icon: <Medal className="w-5 h-5 text-orange-400" /> }
    return { emoji: rank.toString(), icon: <Award className="w-5 h-5 text-purple-400" /> }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getActivityColor = (activity?: string) => {
    switch (activity) {
      case 'HIGH': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'LOW': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStreakColor = (streak?: number) => {
    if (!streak) return 'text-gray-400'
    if (streak >= 30) return 'text-red-400'
    if (streak >= 14) return 'text-orange-400'
    if (streak >= 7) return 'text-yellow-400'
    return 'text-green-400'
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getPositionChange = (entry: LeaderboardEntry) => {
    if (entry.isNew) {
      return (
        <div className="flex items-center gap-1 text-blue-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium">NEW</span>
        </div>
      )
    }

    if (entry.change === 0) {
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <Minus className="w-4 h-4" />
          <span className="text-xs">-</span>
        </div>
      )
    }

    return (
      <div className={`flex items-center gap-1 ${
        entry.change > 0 ? 'text-green-400' : 'text-red-400'
      }`}>
        {getChangeIcon(entry.change)}
        <span className="text-xs font-medium">{Math.abs(entry.change)}</span>
      </div>
    )
  }

  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.user.walletAddress === currentUserAddress
          const isSelected = compareList.includes(entry.user.id)
          const rankDisplay = getRankDisplay(entry.rank)

          return (
            <motion.div
              key={entry.user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-4 sm:p-6 rounded-xl sm:rounded-2xl backdrop-blur-xl border transition-all cursor-pointer ${
                isCurrentUser
                  ? 'bg-purple-500/10 border-purple-500/50 ring-2 ring-purple-500/50'
                  : isSelected
                  ? 'bg-yellow-500/10 border-yellow-500/50 ring-2 ring-yellow-500/50'
                  : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
              }`}
              onHoverStart={() => setHoveredUser(entry.user.id)}
              onHoverEnd={() => setHoveredUser(null)}
              onClick={() => onUserClick(entry)}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Rank Badge */}
              <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">{entry.rank}</span>
              </div>

              {/* Comparison Toggle */}
              {comparisonMode && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCompareToggle(entry.user.id)
                  }}
                  className={`absolute top-3 right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-yellow-400 border-yellow-400 text-black'
                      : 'border-gray-600 hover:border-yellow-400'
                  }`}
                >
                  {isSelected && <Target className="w-2 h-2 sm:w-3 sm:h-3" />}
                </motion.button>
              )}

              {/* User Info */}
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="relative">
                  {entry.user.twitterImage ? (
                    <Image
                      src={entry.user.twitterImage}
                      alt={entry.user.twitterUsername || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full ring-2 ring-purple-500/30 w-12 h-12 sm:w-15 sm:h-15"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-15 sm:h-15 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm sm:text-lg">
                        {entry.user.twitterUsername?.[0]?.toUpperCase() || 
                         entry.user.walletAddress.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Activity Indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-gray-900 ${
                    entry.user.twitterActivity === 'HIGH' ? 'bg-green-400' :
                    entry.user.twitterActivity === 'MEDIUM' ? 'bg-yellow-400' :
                    'bg-orange-400'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate text-sm sm:text-base">
                    {entry.user.twitterUsername || 'Anonymous'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 font-mono">
                    {formatWalletAddress(entry.user.walletAddress)}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-400">Points</span>
                  <span className="text-base sm:text-lg font-bold text-white">
                    {entry.user.totalPoints.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-400">Level</span>
                  <span className="text-xs sm:text-sm font-bold text-purple-400">
                    {entry.user.level || 1}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-400">Streak</span>
                  <span className={`text-xs sm:text-sm font-bold ${getStreakColor(entry.user.streak)}`}>
                    {entry.user.streak || 0} days
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-400">Activity</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                    getActivityColor(entry.user.twitterActivity)
                  }`}>
                    {entry.user.twitterActivity || 'LOW'}
                  </div>
                </div>
              </div>

              {/* Change Indicator */}
              <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-400">Change</span>
                  {getPositionChange(entry)}
                </div>
              </div>

              {/* Hover Effects */}
              <AnimatePresence>
                {hoveredUser === entry.user.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    )
  }

  if (viewMode === 'compact') {
    return (
      <div className="space-y-1 sm:space-y-2">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.user.walletAddress === currentUserAddress
          const isSelected = compareList.includes(entry.user.id)
          const rankDisplay = getRankDisplay(entry.rank)

          return (
            <motion.div
              key={entry.user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg sm:rounded-xl backdrop-blur-xl border transition-all cursor-pointer ${
                isCurrentUser
                  ? 'bg-purple-500/10 border-purple-500/50'
                  : isSelected
                  ? 'bg-yellow-500/10 border-yellow-500/50'
                  : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => onUserClick(entry)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Rank */}
              <div className="w-8 sm:w-12 text-center">
                <span className="text-sm sm:text-lg font-bold text-white">{entry.rank}</span>
              </div>

              {/* Avatar */}
              <div className="relative">
                {entry.user.twitterImage ? (
                  <Image
                    src={entry.user.twitterImage}
                    alt={entry.user.twitterUsername || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {entry.user.twitterUsername?.[0]?.toUpperCase() || 
                       entry.user.walletAddress.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h3 className="font-semibold text-white truncate text-sm sm:text-base">
                    {entry.user.twitterUsername || 'Anonymous'}
                  </h3>
                  <div className={`px-1 sm:px-2 py-1 rounded-full text-xs font-semibold border ${
                    getActivityColor(entry.user.twitterActivity)
                  }`}>
                    {(entry.user.twitterActivity || 'LOW').charAt(0)}
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <span className="text-sm sm:text-lg font-bold text-white">
                  {entry.user.totalPoints.toLocaleString()}
                </span>
              </div>

              {/* Change */}
              <div className="w-12 sm:w-16 text-center">
                {getPositionChange(entry)}
              </div>

              {/* Comparison Toggle */}
              {comparisonMode && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCompareToggle(entry.user.id)
                  }}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-yellow-400 border-yellow-400 text-black'
                      : 'border-gray-600 hover:border-yellow-400'
                  }`}
                >
                  {isSelected && <Target className="w-2 h-2 sm:w-3 sm:h-3" />}
                </motion.button>
              )}
            </motion.div>
          )
        })}
      </div>
    )
  }

  // Table view (default) with horizontal scroll
  return (
    <div className="w-full">
      {/* Mobile/Small Screen: Horizontal Scrollable Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {/* Scroll indicator for mobile */}
        <div className="block sm:hidden text-xs text-gray-400 mb-2 text-center">
          ← Scroll horizontally to see all columns →
        </div>
        
        <div className="min-w-[800px]"> {/* Minimum width to ensure proper spacing */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm sticky left-0 bg-gray-900/95 backdrop-blur-sm z-10">
                  Rank
                </th>
                <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm sticky left-12 sm:left-16 bg-gray-900/95 backdrop-blur-sm z-10 min-w-[200px]">
                  User
                </th>
                <th className="text-right py-3 sm:py-4 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm min-w-[100px]">
                  Points
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm min-w-[80px]">
                  Level
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm min-w-[80px]">
                  Streak
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm min-w-[100px]">
                  Activity
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm min-w-[80px]">
                  Change
                </th>
                <th className="text-center py-3 sm:py-4 px-2 sm:px-4 text-gray-400 font-medium text-xs sm:text-sm min-w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const isCurrentUser = entry.user.walletAddress === currentUserAddress
                const isSelected = compareList.includes(entry.user.id)
                const rankDisplay = getRankDisplay(entry.rank)
                const isExpanded = expandedUser === entry.user.id

                return (
                  <motion.tr
                    key={entry.user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`border-b border-white/5 transition-all cursor-pointer ${
                      isCurrentUser
                        ? 'bg-purple-500/10 hover:bg-purple-500/20'
                        : isSelected
                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20'
                        : 'hover:bg-white/5'
                    }`}
                    onHoverStart={() => setHoveredUser(entry.user.id)}
                    onHoverEnd={() => setHoveredUser(null)}
                    onClick={() => onUserClick(entry)}
                    whileHover={{ scale: 1.005 }}
                  >
                    {/* Sticky Rank Column */}
                    <td className="py-3 sm:py-4 px-2 sm:px-4 sticky left-0 bg-gray-900/95 backdrop-blur-sm z-10">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-lg sm:text-2xl font-bold text-white">{entry.rank}</span>
                        {entry.rank <= 3 && (
                          <div className="hidden sm:block">
                            {rankDisplay.icon}
                          </div>
                        )}
                        {isCurrentUser && <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                    </td>
                    
                    {/* Sticky User Column */}
                    <td className="py-3 sm:py-4 px-2 sm:px-4 sticky left-12 sm:left-16 bg-gray-900/95 backdrop-blur-sm z-10">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative">
                          {entry.user.twitterImage ? (
                            <Image
                              src={entry.user.twitterImage}
                              alt={entry.user.twitterUsername || 'User'}
                              width={40}
                              height={40}
                              className="rounded-full ring-2 ring-purple-500/30 w-8 h-8 sm:w-12 sm:h-12"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                              <span className="text-white font-bold text-xs sm:text-base">
                                {entry.user.twitterUsername?.[0]?.toUpperCase() || 
                                 entry.user.walletAddress.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          {/* New User Badge */}
                          {entry.isNew && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <p className="text-white font-semibold truncate text-xs sm:text-base">
                              {entry.user.twitterUsername || 'Anonymous User'}
                            </p>
                            {entry.user.twitterUsername && (
                              <Twitter className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <p className="text-gray-400 text-xs sm:text-sm font-mono">
                              {formatWalletAddress(entry.user.walletAddress)}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(entry.user.walletAddress, 'Wallet address')
                              }}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <Copy className="w-2 h-2 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                          {entry.user.twitterFollowers && (
                            <p className="text-gray-500 text-xs hidden sm:block">
                              {entry.user.twitterFollowers.toLocaleString()} followers
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {entry.user.totalPoints.toLocaleString()}
                        </span>
                        {entry.pointsChange && (
                          <span className={`text-xs ${
                            entry.pointsChange > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {entry.pointsChange > 0 ? '+' : ''}{entry.pointsChange}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                      <span className="text-purple-400 font-bold text-sm sm:text-base">
                        {entry.user.level || 1}
                      </span>
                    </td>
                    
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className={`w-3 h-3 sm:w-4 sm:h-4 ${getStreakColor(entry.user.streak)}`} />
                        <span className={`font-semibold text-xs sm:text-sm ${getStreakColor(entry.user.streak)}`}>
                          {entry.user.streak || 0}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                        getActivityColor(entry.user.twitterActivity)
                      }`}>
                        <Activity className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">
                          {entry.user.twitterActivity || 'LOW'}
                        </span>
                        <span className="sm:hidden">
                          {(entry.user.twitterActivity || 'LOW').charAt(0)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                      {getPositionChange(entry)}
                    </td>
                    
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onUserClick(entry)
                          }}
                          className="p-1 sm:p-2 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </motion.button>
                        
                        {comparisonMode && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onCompareToggle(entry.user.id)
                            }}
                            className={`p-1 sm:p-2 rounded-full transition-all ${
                              isSelected
                                ? 'bg-yellow-400 text-black'
                                : 'bg-gray-500/20 text-gray-400 hover:bg-yellow-500/30 hover:text-yellow-400'
                            }`}
                          >
                            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                          </motion.button>
                        )}
                        
                        {entry.user.twitterUsername && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`https://twitter.com/${entry.user.twitterUsername}`, '_blank')
                            }}
                            className="p-1 sm:p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Scroll hint for small screens */}
      <div className="block sm:hidden mt-2 text-xs text-gray-500 text-center">
        Swipe left/right to scroll • Tap row for details
      </div>
    </div>
  )
}