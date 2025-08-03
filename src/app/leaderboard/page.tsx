'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Star, Flame, Zap, 
  ChevronLeft, ChevronRight, Search, Filter, RefreshCw, Download, Share2,
  Target, Award, Users, Calendar, Clock, Eye, BarChart3, Sparkles,
  ArrowUp, ArrowDown, Volume2, VolumeX, Settings, InfoIcon, X, Menu
} from 'lucide-react'
import { EnhancedLeaderboardTable} from '@/components/leaderboard/LeaderboardTable'
import { useWalletStore } from '@/store/useWalletStore'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    walletAddress: string
    twitterUsername?: string
    twitterImage?: string
    totalPoints: number
    totalTokens:number
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

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  userRank?: {
    rank: number
    change: number
    previousRank?: number
    pointsChange?: number
  }
  totalUsers: number
  totalPages: number
  currentPage: number
  lastUpdated: string
}

interface FilterState {
  activityLevel: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'
  pointsRange: { min: number; max: number }
  hasTwitter: boolean | null
  streakMin: number
  region: string
}

export default function ResponsiveLeaderboardPage() {
  const { connected, publicKey } = useWalletStore()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'all' | 'monthly' | 'weekly' | 'daily'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [sortBy, setSortBy] = useState<'points' | 'change' | 'streak' | 'level'>('points')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>('table')
  const [highlightChanges, setHighlightChanges] = useState(true)
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    activityLevel: 'ALL',
    pointsRange: { min: 0, max: 1000000 },
    hasTwitter: null,
    streakMin: 0,
    region: 'all'
  })
  
  const heroRef = useRef(null)
  const refreshInterval = useRef<NodeJS.Timeout | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        fetchLeaderboard(true)
      }, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current)
      }
    }
  }, [autoRefresh, timeRange, currentPage, pageSize, sortBy, sortOrder])

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    
    searchTimeout.current = setTimeout(() => {
      if (searchQuery.length > 0) {
        setCurrentPage(1)
        fetchLeaderboard()
      }
    }, 500)
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [searchQuery])

  // Initial load and dependency changes
  useEffect(() => {
    fetchLeaderboard()
  }, [timeRange, currentPage, pageSize, sortBy, sortOrder, filters])

  // Responsive view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('cards')
      } else if (window.innerWidth < 1024) {
        setViewMode('compact')
      } else {
        setViewMode('table')
      }
    }

    handleResize() // Initial check
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchLeaderboard = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setRefreshing(true)
      
      const params = new URLSearchParams({
        range: timeRange,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(filters.activityLevel !== 'ALL' && { activity: filters.activityLevel }),
        ...(filters.hasTwitter !== null && { hasTwitter: filters.hasTwitter.toString() }),
        ...(filters.streakMin > 0 && { minStreak: filters.streakMin.toString() }),
        ...(filters.pointsRange.min > 0 && { minPoints: filters.pointsRange.min.toString() }),
        ...(filters.pointsRange.max < 1000000 && { maxPoints: filters.pointsRange.max.toString() }),
        ...(filters.region !== 'all' && { region: filters.region })
      })
      
      const res = await fetch(`/api/leaderboard?${params}`)
      if (res.ok) {
        const leaderboardData = await res.json()
        
        // Detect changes for sound notifications
        if (data && soundEnabled && highlightChanges) {
          detectRankChanges(data.leaderboard, leaderboardData.leaderboard)
        }
        
        setData(leaderboardData)
        
        if (!silent) {
          toast.success('Leaderboard updated!')
        }
      } else {
        throw new Error('Failed to fetch leaderboard')
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [timeRange, currentPage, pageSize, sortBy, sortOrder, searchQuery, filters, data, soundEnabled, highlightChanges])

  const detectRankChanges = (oldData: LeaderboardEntry[], newData: LeaderboardEntry[]) => {
    const changes = []
    
    newData.forEach(newEntry => {
      const oldEntry = oldData.find(old => old.user.id === newEntry.user.id)
      if (oldEntry && oldEntry.rank !== newEntry.rank) {
        changes.push({
          user: newEntry.user,
          oldRank: oldEntry.rank,
          newRank: newEntry.rank,
          change: oldEntry.rank - newEntry.rank
        })
      }
    })
    
    if (changes.length > 0 && soundEnabled) {
      // Play sound notification
      playNotificationSound()
    }
  }

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {
      // Fallback for browsers that don't support audio
      console.log('Sound notification attempted')
    })
  }

  const handleExport = async () => {
    try {
      const exportData = {
        leaderboard: data?.leaderboard || [],
        timeRange,
        exportedAt: new Date().toISOString(),
        totalUsers: data?.totalUsers || 0,
        filters
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leaderboard-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Leaderboard exported!')
    } catch (error) {
      toast.error('Failed to export leaderboard')
    }
  }

  const handleShare = async () => {
    try {
      const shareData = {
        title: 'Solana Airdrop Leaderboard',
        text: `Check out the top performers in our ${timeRange} leaderboard!`,
        url: window.location.href
      }
      
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      toast.error('Failed to share leaderboard')
    }
  }

  const handleUserClick = (user: LeaderboardEntry) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleCompareToggle = (userId: string) => {
    if (compareList.includes(userId)) {
      setCompareList(prev => prev.filter(id => id !== userId))
    } else if (compareList.length < 5) {
      setCompareList(prev => [...prev, userId])
    } else {
      toast.error('Maximum 5 users can be compared')
    }
  }

  const filteredAndSortedData = useMemo(() => {
    if (!data) return []
    
    let filtered = data.leaderboard.filter(entry => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          entry.user.twitterUsername?.toLowerCase().includes(query) ||
          entry.user.walletAddress.toLowerCase().includes(query)
        )
      }
      return true
    })
    
    return filtered
  }, [data, searchQuery])

  const getPodiumGradient = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 via-yellow-500 to-yellow-600'
      case 2: return 'from-gray-300 via-gray-400 to-gray-500'
      case 3: return 'from-orange-400 via-orange-500 to-orange-600'
      default: return 'from-purple-400 to-pink-400'
    }
  }

  const getPodiumIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />
      case 2: return <Medal className="w-6 h-6 text-gray-300" />
      case 3: return <Medal className="w-6 h-6 text-orange-400" />
      default: return null
    }
  }

  const getActivityColor = (activity?: string) => {
    switch (activity) {
      case 'HIGH': return 'text-green-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'LOW': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const getActivityBadge = (activity?: string) => {
    switch (activity) {
      case 'HIGH': return 'bg-green-500/20 text-green-400'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400'
      case 'LOW': return 'bg-orange-500/20 text-orange-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-base sm:text-lg">Loading leaderboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-yellow-900/20">
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
            backgroundImage: "radial-gradient(circle at 30% 30%, #FFD700 0%, transparent 50%), radial-gradient(circle at 70% 70%, #9945FF 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Header */}
      <header ref={heroRef} className="relative z-10 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <motion.div style={{ y, opacity }} className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Header */}
            <div className="flex flex-col space-y-4 lg:hidden">
              <div className="flex justify-between items-center">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                  </motion.div>
                  Leaderboard
                </motion.h1>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/"
                    className="px-4 py-2 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-sm"
                  >
                    Home
                  </Link>
                </motion.div>
              </div>

              {data && (
                <div className="text-center">
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                    {data.totalUsers.toLocaleString()} users
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex justify-between items-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-black text-white flex items-center gap-4"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-10 h-10 text-yellow-400" />
                </motion.div>
                Leaderboard
                {data && (
                  <span className="text-sm bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                    {data.totalUsers.toLocaleString()} users
                  </span>
                )}
              </motion.h1>
              
              <div className="flex items-center gap-4">
                {/* Desktop Controls */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`p-2 rounded-lg transition-all ${
                      autoRefresh 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-lg transition-all ${
                      soundEnabled 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExport}
                    className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                  >
                    <Download className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/"
                    className="px-6 py-3 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
                  >
                    Back to Home
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="lg:hidden flex justify-center gap-2 mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-all ${
                  autoRefresh 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Time Range Selector - Responsive */}
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
                {(['all', 'monthly', 'weekly', 'daily'] as const).map((range) => (
                  <motion.button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                      timeRange === range
                        ? 'text-black'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {timeRange === range && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg sm:rounded-xl"
                        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 capitalize">
                      {range === 'all' ? 'All' : 
                       range === 'monthly' ? 'Month' : 
                       range === 'weekly' ? 'Week' : 'Today'}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* View Mode Selector - Mobile Only */}
              <div className="lg:hidden flex gap-2 justify-center">
                {(['cards', 'compact'] as const).map((mode) => (
                  <motion.button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === mode
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {mode === 'cards' ? <Award className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                  </motion.button>
                ))}
              </div>

              {/* Desktop View Mode Selector */}
              <div className="hidden lg:flex gap-2 justify-center">
                {(['table', 'cards', 'compact'] as const).map((mode) => (
                  <motion.button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === mode
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {mode === 'table' ? <BarChart3 className="w-5 h-5" /> :
                     mode === 'cards' ? <Award className="w-5 h-5" /> :
                     <Users className="w-5 h-5" />}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Search and Controls - Responsive */}
            <div className="flex flex-col space-y-4">
              {/* Search Bar */}
              <div className="w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search by username or wallet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-white/10 backdrop-blur-xl rounded-lg sm:rounded-xl text-white placeholder-gray-400 border border-white/20 focus:border-purple-400 focus:outline-none transition-all text-sm sm:text-base"
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  )}
                </motion.div>
              </div>

              {/* Controls Row */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                {/* Filter Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-lg sm:rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                  Filters
                  {Object.values(filters).some(v => v !== 'ALL' && v !== 'all' && v !== null && v !== 0 && (typeof v !== 'object' || v.min !== 0 || v.max !== 1000000)) && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  )}
                </motion.button>

                {/* Sort Controls */}
                <div className="flex gap-2 flex-1">
                  <select
                    title="Sort by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-white/10 backdrop-blur-xl text-white rounded-lg sm:rounded-xl border border-white/20 focus:border-purple-400 focus:outline-none text-sm sm:text-base"
                  >
                    <option value="points">Points</option>
                    <option value="change">Change</option>
                    <option value="streak">Streak</option>
                    <option value="level">Level</option>
                  </select>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 sm:px-4 sm:py-3 bg-white/10 backdrop-blur-xl text-white rounded-lg sm:rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                  >
                    {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Advanced Filters - Responsive */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 sm:p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Activity Level</label>
                      <select
                        title="Activity Level"
                        value={filters.activityLevel}
                        onChange={(e) => setFilters(prev => ({ ...prev, activityLevel: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-purple-400 focus:outline-none text-sm"
                      >
                        <option value="ALL">All Levels</option>
                        <option value="HIGH">High Activity</option>
                        <option value="MEDIUM">Medium Activity</option>
                        <option value="LOW">Low Activity</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Min Points</label>
                      <input
                        type="number"
                        value={filters.pointsRange.min}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          pointsRange: { ...prev.pointsRange, min: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-purple-400 focus:outline-none text-sm"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Max Points</label>
                      <input
                        type="number"
                        value={filters.pointsRange.max}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          pointsRange: { ...prev.pointsRange, max: parseInt(e.target.value) || 1000000 }
                        }))}
                        className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-purple-400 focus:outline-none text-sm"
                        placeholder="1000000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Min Streak</label>
                      <input
                        type="number"
                        value={filters.streakMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, streakMin: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-purple-400 focus:outline-none text-sm"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Twitter</label>
                      <select
                        title="Twitter Filter"
                        value={filters.hasTwitter === null ? 'all' : filters.hasTwitter.toString()}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          hasTwitter: e.target.value === 'all' ? null : e.target.value === 'true'
                        }))}
                        className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-purple-400 focus:outline-none text-sm"
                      >
                        <option value="all">All Users</option>
                        <option value="true">Has Twitter</option>
                        <option value="false">No Twitter</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilters({
                        activityLevel: 'ALL',
                        pointsRange: { min: 0, max: 1000000 },
                        hasTwitter: null,
                        streakMin: 0,
                        region: 'all'
                      })}
                      className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all text-sm"
                    >
                      Clear Filters
                    </motion.button>
                    
                    <p className="text-sm text-gray-400 text-center sm:text-right">
                      Showing {filteredAndSortedData.length} of {data?.totalUsers || 0} users
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6">
        {/* Last Updated Info */}
        {data?.lastUpdated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <p className="text-xs sm:text-sm text-gray-400">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
              {refreshing && <span className="ml-2 text-purple-400">• Updating...</span>}
            </p>
          </motion.div>
        )}

        {/* User Rank Card - Responsive */}
        {connected && data?.userRank && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="mb-8 sm:mb-12"
          >
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl" />
              <div className="relative p-4 sm:p-8 backdrop-blur-xl bg-gray-900/90 border border-gray-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-gray-400 mb-2 sm:mb-3 text-sm sm:text-base">Your Current Position</p>
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="text-4xl sm:text-6xl font-black gradient-text"
                      >
                        #{data.userRank.rank}
                      </motion.span>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        {data.userRank.change !== 0 && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className={`flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base ${
                              data.userRank.change > 0 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {data.userRank.change > 0 ? (
                              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                            <span className="font-semibold">
                              {Math.abs(data.userRank.change)} positions
                            </span>
                          </motion.div>
                        )}
                        {data.userRank.pointsChange && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-blue-500/20 text-blue-400 text-sm sm:text-base"
                          >
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-semibold">
                              {data.userRank.pointsChange > 0 ? '+' : ''}{data.userRank.pointsChange} points
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-2xl"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium - Responsive */}
        {data && data.leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
              Top <span className="gradient-text">Performers</span>
            </h2>
            
            {/* Mobile Podium - Stacked */}
            <div className="grid grid-cols-1 gap-6 sm:hidden">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative cursor-pointer"
                    onClick={() => handleUserClick(data.leaderboard[index])}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                      index === 0 ? 'from-yellow-400/50 to-orange-500/50' :
                      index === 1 ? 'from-gray-400/50 to-gray-600/50' :
                      'from-orange-400/50 to-red-500/50'
                    } blur-2xl`} />
                    <div className={`relative text-center p-6 rounded-2xl bg-gray-900/90 backdrop-blur-xl border ${
                      index === 0 ? 'border-yellow-500/50' :
                      index === 1 ? 'border-gray-700' :
                      'border-orange-700'
                    }`}>
                      {/* Rank Badge */}
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getPodiumGradient(index + 1)} flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                      </div>
                      
                      {/* Profile Image */}
                      {data.leaderboard[index].user.twitterImage ? (
                        <Image
                          src={data.leaderboard[index].user.twitterImage}
                          alt="Profile"
                          width={64}
                          height={64}
                          className="mx-auto rounded-full mb-3 mt-2"
                        />
                      ) : (
                        <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${
                          index === 0 ? 'from-yellow-400 to-orange-500' :
                          index === 1 ? 'from-gray-400 to-gray-600' :
                          'from-orange-400 to-red-500'
                        } mb-3 mt-2`} />
                      )}
                      
                      <h3 className="font-bold text-white text-lg truncate mb-2">
                        {data.leaderboard[index].user.twitterUsername || 
                         `${data.leaderboard[index].user.walletAddress.slice(0, 4)}...`}
                      </h3>
                      
                      <p className={`font-bold text-2xl mb-1 ${
                        index === 0 ? 'gradient-text' :
                        index === 1 ? 'text-gray-300' :
                        'text-orange-400'
                      }`}>
                        {data.leaderboard[index].user.totalPoints.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-sm mb-3">points</p>
                      
                      {/* Activity Badge */}
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        getActivityBadge(data.leaderboard[index].user.twitterActivity)
                      }`}>
                        {data.leaderboard[index].user.twitterActivity || 'LOW'}
                      </div>
                      
                      {/* Stats Grid */}
                      {index === 0 && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="text-center">
                            <p className="text-yellow-400 font-bold text-lg">
                              {data.leaderboard[index].user.level || 1}
                            </p>
                            <p className="text-xs text-gray-500">Level</p>
                          </div>
                          <div className="text-center">
                            <p className="text-orange-400 font-bold text-lg">
                              {data.leaderboard[index].user.streak || 0}
                            </p>
                            <p className="text-xs text-gray-500">Streak</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Change Indicator */}
                      {data.leaderboard[index].change !== 0 && (
                        <div className={`flex items-center justify-center gap-1 mt-2 ${
                          data.leaderboard[index].change > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {data.leaderboard[index].change > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="text-sm">{Math.abs(data.leaderboard[index].change)}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Desktop/Tablet Podium - Traditional Layout */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4 lg:gap-8 max-w-6xl mx-auto">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="md:mt-12"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative cursor-pointer"
                  onClick={() => handleUserClick(data.leaderboard[1])}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-400/50 to-gray-600/50 blur-2xl" />
                  <div className="relative text-center p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-gray-900/90 backdrop-blur-xl border border-gray-700">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${getPodiumGradient(2)} rounded-full`} />
                      <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-xl lg:text-3xl font-black text-gray-300">2</span>
                      </div>
                    </motion.div>
                    {data.leaderboard[1].user.twitterImage ? (
                      <Image
                        src={data.leaderboard[1].user.twitterImage}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="mx-auto rounded-full mb-3"
                      />
                    ) : (
                      <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto rounded-full bg-gradient-to-r from-gray-400 to-gray-600 mb-3" />
                    )}
                    <h3 className="font-bold text-white text-sm lg:text-lg truncate">
                      {data.leaderboard[1].user.twitterUsername || 
                       `${data.leaderboard[1].user.walletAddress.slice(0, 4)}...`}
                    </h3>
                    <p className="text-gray-400 font-bold text-lg lg:text-2xl mt-2">
                      {data.leaderboard[1].user.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs lg:text-sm">points</p>
                    
                    {/* Activity Badge */}
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-2 ${
                      getActivityBadge(data.leaderboard[1].user.twitterActivity)
                    }`}>
                      {data.leaderboard[1].user.twitterActivity || 'LOW'}
                    </div>
                    
                    {/* Change Indicator */}
                    {data.leaderboard[1].change !== 0 && (
                      <div className={`flex items-center justify-center gap-1 mt-2 ${
                        data.leaderboard[1].change > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {data.leaderboard[1].change > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm">{Math.abs(data.leaderboard[1].change)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative cursor-pointer"
                  onClick={() => handleUserClick(data.leaderboard[0])}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-yellow-400/50 to-orange-500/50 blur-3xl"
                  />
                  <div className="relative text-center p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-gray-900/90 backdrop-blur-xl border-2 border-yellow-500/50">
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      className="relative w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-4"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${getPodiumGradient(1)} rounded-full shadow-lg shadow-yellow-500/50`} />
                      <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                        <Crown className="w-8 h-8 lg:w-12 lg:h-12 text-yellow-400" />
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-2 lg:-top-4 -right-2 lg:-right-4"
                      >
                        <Star className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    </motion.div>
                    {data.leaderboard[0].user.twitterImage ? (
                      <Image
                        src={data.leaderboard[0].user.twitterImage}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="mx-auto rounded-full mb-4 ring-4 ring-yellow-400/50"
                      />
                    ) : (
                      <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mb-4" />
                    )}
                    <h3 className="font-bold text-white text-lg lg:text-xl truncate">
                      {data.leaderboard[0].user.twitterUsername || 
                       `${data.leaderboard[0].user.walletAddress.slice(0, 4)}...`}
                    </h3>
                    <p className="gradient-text font-black text-2xl lg:text-3xl mt-2">
                      {data.leaderboard[0].user.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">points</p>
                    
                    {/* Activity Badge */}
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-3 ${
                      getActivityBadge(data.leaderboard[0].user.twitterActivity)
                    }`}>
                      {data.leaderboard[0].user.twitterActivity || 'LOW'}
                    </div>
                    
                    {/* Additional Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-yellow-400 font-bold text-lg">
                          {data.leaderboard[0].user.level || 1}
                        </p>
                        <p className="text-xs text-gray-500">Level</p>
                      </div>
                      <div className="text-center">
                        <p className="text-orange-400 font-bold text-lg">
                          {data.leaderboard[0].user.streak || 0}
                        </p>
                        <p className="text-xs text-gray-500">Streak</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="md:mt-12"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative cursor-pointer"
                  onClick={() => handleUserClick(data.leaderboard[2])}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/50 to-red-500/50 blur-2xl" />
                  <div className="relative text-center p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-gray-900/90 backdrop-blur-xl border border-orange-700">
                    <motion.div
                      animate={{ rotate: [0, -360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${getPodiumGradient(3)} rounded-full`} />
                      <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-xl lg:text-3xl font-black text-orange-400">3</span>
                      </div>
                    </motion.div>
                    {data.leaderboard[2].user.twitterImage ? (
                      <Image
                        src={data.leaderboard[2].user.twitterImage}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="mx-auto rounded-full mb-3"
                      />
                    ) : (
                      <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto rounded-full bg-gradient-to-r from-orange-400 to-red-500 mb-3" />
                    )}
                    <h3 className="font-bold text-white text-sm lg:text-lg truncate">
                      {data.leaderboard[2].user.twitterUsername || 
                       `${data.leaderboard[2].user.walletAddress.slice(0, 4)}...`}
                    </h3>
                    <p className="text-orange-400 font-bold text-lg lg:text-2xl mt-2">
                      {data.leaderboard[2].user.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs lg:text-sm">points</p>
                    
                    {/* Activity Badge */}
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-2 ${
                      getActivityBadge(data.leaderboard[2].user.twitterActivity)
                    }`}>
                      {data.leaderboard[2].user.twitterActivity || 'LOW'}
                    </div>
                    
                    {/* Change Indicator */}
                    {data.leaderboard[2].change !== 0 && (
                      <div className={`flex items-center justify-center gap-1 mt-2 ${
                        data.leaderboard[2].change > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {data.leaderboard[2].change > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm">{Math.abs(data.leaderboard[2].change)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Comparison Mode Toggle - Responsive */}
        {data && data.leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  comparisonMode
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    : 'bg-white/10 text-gray-400 border border-white/20'
                }`}
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                {comparisonMode ? 'Exit Compare' : 'Compare Users'}
              </motion.button>
              
              {comparisonMode && compareList.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {compareList.length} selected
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCompareList([])}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Clear
                  </motion.button>
                </div>
              )}
            </div>
            
            {/* Pagination Info - Responsive */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-xs sm:text-sm text-gray-400 text-center">
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, data.totalUsers)} of {data.totalUsers}
              </span>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                
                <span className="px-3 py-2 bg-white/10 rounded-lg text-white min-w-[60px] sm:min-w-[80px] text-center text-sm">
                  {currentPage} / {Math.ceil(data.totalUsers / pageSize)}
                </span>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(data.totalUsers / pageSize), prev + 1))}
                  disabled={currentPage >= Math.ceil(data.totalUsers / pageSize)}
                  className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Table - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-xl bg-gray-900/90 rounded-2xl sm:rounded-3xl border border-gray-800 overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                Full Rankings
              </h2>
              
              <div className="flex items-center gap-2">
                <select
                  title="Items per page"
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value))}
                  className="px-2 sm:px-3 py-1 sm:py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-purple-400 focus:outline-none text-sm"
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12 sm:py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500 border-t-transparent rounded-full"
              />
            </div>
          ) : data && filteredAndSortedData.length > 0 ? (
            <div className="p-4 sm:p-6">
              <EnhancedLeaderboardTable 
                entries={filteredAndSortedData} 
                currentUserAddress={publicKey ?? undefined}
                viewMode={viewMode}
                comparisonMode={comparisonMode}
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
                onUserClick={handleUserClick}
                highlightChanges={highlightChanges}
                timeRange={timeRange}
              />
            </div>
          ) : (
            <div className="text-center py-12 sm:py-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto px-4"
              >
                <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No users found</p>
                <p className="text-gray-500 text-sm sm:text-base">Try adjusting your search or filters</p>
              </motion.div>
            </div>
          )}
        </motion.div>
      </main>

      {/* User Detail Modal - Responsive */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="flex justify-end mb-4 sm:hidden">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserModal(false)}
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="text-center mb-6 sm:mb-8">
                <div className="relative inline-block">
                  {selectedUser.user.twitterImage ? (
                    <Image
                      src={selectedUser.user.twitterImage}
                      alt="Profile"
                      width={100}
                      height={100}
                      className="rounded-full mx-auto mb-4 ring-4 ring-purple-500/50 w-20 h-20 sm:w-30 sm:h-30"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-30 sm:h-30 mx-auto rounded-full bg-gradient-to-r from-purple-400 to-pink-500 mb-4" />
                  )}
                  <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 sm:p-2">
                    <span className="text-black font-bold text-xs sm:text-sm">#{selectedUser.rank}</span>
                  </div>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {selectedUser.user.twitterUsername || 'Anonymous User'}
                </h2>
                
                <p className="text-gray-400 font-mono text-xs sm:text-sm mb-4 break-all">
                  {selectedUser.user.walletAddress}
                </p>
                
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold gradient-text">
                      {selectedUser.user.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-sm">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                      {selectedUser.user.level || 1}
                    </p>
                    <p className="text-gray-400 text-sm">Level</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-orange-400">
                      {selectedUser.user.streak || 0}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-blue-400">
                      {selectedUser.user.twitterFollowers?.toLocaleString() || 'N/A'}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">Followers</p>
                  </div>
                  <div className="text-center">
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      getActivityBadge(selectedUser.user.twitterActivity)
                    }`}>
                      {selectedUser.user.twitterActivity || 'LOW'}
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Activity</p>
                  </div>
                </div>
                
                {selectedUser.change !== 0 && (
                  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full mb-4 ${
                    selectedUser.change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedUser.change > 0 ? (
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span className="font-semibold text-sm sm:text-base">
                      {Math.abs(selectedUser.change)} positions {selectedUser.change > 0 ? 'up' : 'down'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserModal(false)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg sm:rounded-xl font-semibold transition-all text-sm sm:text-base"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-800 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-gray-800 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSoundEnabled(!soundEnabled)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full p-4 rounded-lg flex items-center gap-3 transition-all ${
                    soundEnabled 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  <span>{soundEnabled ? 'Disable' : 'Enable'} Sound</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleExport()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full p-4 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-3"
                >
                  <Download className="w-5 h-5" />
                  <span>Export Data</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAutoRefresh(!autoRefresh)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full p-4 rounded-lg flex items-center gap-3 transition-all ${
                    autoRefresh 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{autoRefresh ? 'Disable' : 'Enable'} Auto-refresh</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setHighlightChanges(!highlightChanges)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full p-4 rounded-lg flex items-center gap-3 transition-all ${
                    highlightChanges 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{highlightChanges ? 'Disable' : 'Enable'} Highlights</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}