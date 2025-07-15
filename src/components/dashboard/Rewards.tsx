import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Crown, Medal, Star, Award, Shield, Target,
  Lock, Unlock, Sparkles, Flame, Zap, Gift, Users,
  CheckCircle, Clock, TrendingUp, Heart, MessageCircle,
  Calendar, Coins, ArrowRight, Eye, BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirements: any
  points: number
  isSecret: boolean
  unlockedAt?: string
  progress: number
  unlocked: boolean
  category: 'social' | 'engagement' | 'progression' | 'special' | 'milestone'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface UserStats {
  totalAchievements: number
  unlockedAchievements: number
  totalPoints: number
  achievementPoints: number
  streak: number
  level: number
  nextLevelProgress: number
}

interface RewardsProps {
  userId: string
}

export function RewardsComponent({ userId }: RewardsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'secret'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<string | null>(null)

  useEffect(() => {
    fetchAchievements()
    fetchUserStats()
  }, [userId])

  const fetchAchievements = async () => {
    try {
      const res = await fetch('/api/achievements')
      if (res.ok) {
        const data = await res.json()
        setAchievements(data.achievements || [])
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
      toast.error('Failed to load achievements')
    }
  }

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/user/achievements/stats')
      if (res.ok) {
        const data = await res.json()
        setUserStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAchievementIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      '👋': Users, '🐦': Heart, '💰': Coins, '💎': Star,
      '🦋': MessageCircle, '🔥': Flame, '🚀': TrendingUp,
      '👑': Crown, '🤝': Users, '⭐': Star, '💸': Coins,
      '🏅': Medal, '🌟': Sparkles, '📈': BarChart3
    }
    return iconMap[iconName] || Trophy
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-500'
      case 'epic': return 'from-purple-500 via-pink-500 to-purple-600'
      case 'rare': return 'from-blue-500 via-cyan-500 to-blue-600'
      case 'common': return 'from-gray-400 via-gray-500 to-gray-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'social': return 'from-blue-500 to-cyan-500'
      case 'engagement': return 'from-pink-500 to-rose-500'
      case 'progression': return 'from-green-500 to-emerald-500'
      case 'special': return 'from-purple-500 to-violet-500'
      case 'milestone': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const triggerUnlockAnimation = (achievementId: string) => {
    setShowUnlockAnimation(achievementId)
    setTimeout(() => setShowUnlockAnimation(null), 3000)
  }

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked' && !achievement.unlocked) return false
    if (filter === 'locked' && achievement.unlocked) return false
    if (filter === 'secret' && !achievement.isSecret) return false
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false
    return true
  })

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'social', name: 'Social', icon: Users },
    { id: 'engagement', name: 'Engagement', icon: Heart },
    { id: 'progression', name: 'Progress', icon: TrendingUp },
    { id: 'special', name: 'Special', icon: Star },
    { id: 'milestone', name: 'Milestones', icon: Target }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Rewards & Achievements
          </h2>
          <p className="text-gray-400 mt-2">Unlock achievements and earn exclusive rewards</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{userStats?.unlockedAchievements || 0}/{userStats?.totalAchievements || 0}</div>
          <div className="text-sm text-gray-400">Unlocked</div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Achievements</h3>
              <p className="text-yellow-400 text-sm">Unlocked</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-400">{userStats?.unlockedAchievements || 0}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Star className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Level</h3>
              <p className="text-purple-400 text-sm">Current</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-400">{userStats?.level || 1}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-red-500/20">
              <Flame className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Streak</h3>
              <p className="text-red-400 text-sm">Days</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-400">{userStats?.streak || 0}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <Coins className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Points</h3>
              <p className="text-green-400 text-sm">From achievements</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400">{userStats?.achievementPoints || 0}</div>
        </motion.div>
      </div>

      {/* Level Progress */}
      {userStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Level Progress
            </h3>
            <div className="text-right">
              <div className="text-lg font-bold text-white">Level {userStats.level}</div>
              <div className="text-sm text-gray-400">{userStats.nextLevelProgress}% to next level</div>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${userStats.nextLevelProgress}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="h-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full relative overflow-hidden"
              >
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </motion.button>
          )
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-black/20 backdrop-blur-xl rounded-2xl p-1">
        {[
          { id: 'all', name: 'All', count: achievements.length },
          { id: 'unlocked', name: 'Unlocked', count: achievements.filter(a => a.unlocked).length },
          { id: 'locked', name: 'Locked', count: achievements.filter(a => !a.unlocked).length },
          { id: 'secret', name: 'Secret', count: achievements.filter(a => a.isSecret).length }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              filter === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{tab.name}</span>
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs">{tab.count}</span>
          </motion.button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => {
            const Icon = getAchievementIcon(achievement.icon)
            const isUnlocked = achievement.unlocked
            const isSecret = achievement.isSecret && !isUnlocked
            
            return (
              <motion.div
                key={achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`relative p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 overflow-hidden ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border-yellow-500/30'
                    : 'bg-black/20 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Rarity Glow */}
                {isUnlocked && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(achievement.rarity)} opacity-5`} />
                )}

                {/* Unlock Animation */}
                <AnimatePresence>
                  {showUnlockAnimation === achievement.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, ease: "linear" }}
                      >
                        <Sparkles className="w-16 h-16 text-yellow-400" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  {/* Achievement Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${getCategoryColor(achievement.category)} ${!isUnlocked && 'opacity-50'}`}>
                      {isSecret ? (
                        <Lock className="w-8 h-8 text-white" />
                      ) : (
                        <Icon className="w-8 h-8 text-white" />
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity.toUpperCase()}
                      </div>
                      {isUnlocked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="p-2 bg-green-500/20 rounded-full"
                        >
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Achievement Info */}
                  <div className="mb-4">
                    <h3 className={`text-xl font-bold mb-2 ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                      {isSecret && !isUnlocked ? '???' : achievement.name}
                    </h3>
                    <p className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-500'}`}>
                      {isSecret && !isUnlocked ? 'Complete more achievements to reveal this secret!' : achievement.description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {!isUnlocked && achievement.progress > 0 && !isSecret && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{achievement.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-2 bg-gradient-to-r ${getCategoryColor(achievement.category)} rounded-full`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Points Reward */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className={`w-5 h-5 ${isUnlocked ? 'text-yellow-400' : 'text-gray-500'}`} />
                      <span className={`font-bold ${isUnlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                        +{achievement.points} points
                      </span>
                    </div>
                    
                    {achievement.unlockedAt && (
                      <div className="text-xs text-gray-400">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Secret Badge */}
                  {achievement.isSecret && (
                    <div className="absolute top-4 left-4">
                      <div className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                        Secret
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No achievements found</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {filter === 'unlocked' 
              ? 'Start completing tasks and engaging with the platform to unlock your first achievement!'
              : 'Try adjusting your filters to see more achievements.'}
          </p>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Quick Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="text-gray-300 text-sm">Engage on Twitter to unlock social achievements</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300 text-sm">Check in daily to build your streak</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-gray-300 text-sm">Refer friends to unlock referral achievements</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}