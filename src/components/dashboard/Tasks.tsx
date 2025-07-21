import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, Circle, Clock, Twitter, Users, Wallet, 
  Gift, Target, Calendar, Zap, Star, ArrowRight,
  ExternalLink, Trophy, MessageCircle, Heart, Repeat,
  UserPlus, Award, Shield, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TasksComponentProps {
  userId: string
  userPoints: number
  userLevel: number
  twitterConnected: boolean
  walletConnected: boolean
}

interface Task {
  id: string
  name: string
  description: string
  type: 'SOCIAL_TWITTER' | 'SOCIAL_DISCORD' | 'WALLET_CONNECT' | 'REFERRAL' | 'DAILY_CHECK_IN' | 'CUSTOM'
  points: number
  requirements: any
  isActive: boolean
  expiresAt?: string
  completed?: boolean
  progress?: number
}

export const TasksComponent = ({ 
  userId, 
  userPoints, 
  userLevel, 
  twitterConnected, 
  walletConnected 
}: TasksComponentProps) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('all')
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    generateTasksFromProps()
  }, [userId, userPoints, userLevel, twitterConnected, walletConnected])

  const generateTasksFromProps = () => {
    // Generate tasks based on user props and status
    const generatedTasks: Task[] = [
      // Wallet Connection Tasks
      {
        id: 'wallet-connect',
        name: 'Connect Your Wallet',
        description: 'Link your Solana wallet to get started with the platform',
        type: 'WALLET_CONNECT',
        points: 50,
        requirements: { walletConnected: true },
        isActive: !walletConnected,
        completed: walletConnected,
        progress: walletConnected ? 100 : 0
      },
      
      // Twitter Connection Tasks
      {
        id: 'twitter-connect',
        name: 'Connect Twitter Account',
        description: 'Link your Twitter account to participate in social tasks',
        type: 'SOCIAL_TWITTER',
        points: 75,
        requirements: { twitterConnected: true },
        isActive: !twitterConnected,
        completed: twitterConnected,
        progress: twitterConnected ? 100 : 0
      },

      // Social Media Tasks (only show if Twitter connected)
      {
        id: 'twitter-follow',
        name: 'Follow Our Twitter',
        description: 'Follow our official Twitter account for updates',
        type: 'SOCIAL_TWITTER',
        points: 25,
        requirements: { 
          twitterConnected: true,
          action: 'FOLLOW',
          targetUsername: 'YourProject'
        },
        isActive: twitterConnected,
        completed: false,
        progress: twitterConnected ? 50 : 0
      },
      
      {
        id: 'twitter-retweet',
        name: 'Retweet Announcement',
        description: 'Retweet our latest announcement post',
        type: 'SOCIAL_TWITTER',
        points: 30,
        requirements: { 
          twitterConnected: true,
          action: 'RETWEET',
          tweetUrl: 'https://twitter.com/YourProject/status/123456789'
        },
        isActive: twitterConnected,
        completed: false,
        progress: twitterConnected ? 25 : 0
      },

      {
        id: 'twitter-like-share',
        name: 'Like & Share Content',
        description: 'Engage with our Twitter content by liking and sharing',
        type: 'SOCIAL_TWITTER',
        points: 20,
        requirements: { 
          twitterConnected: true,
          action: 'LIKE_SHARE'
        },
        isActive: twitterConnected,
        completed: false,
        progress: twitterConnected ? 75 : 0
      },

      // Daily Tasks
      {
        id: 'daily-checkin',
        name: 'Daily Check-in',
        description: 'Visit the platform daily to maintain your streak',
        type: 'DAILY_CHECK_IN',
        points: 10,
        requirements: { dailyVisit: true },
        isActive: true,
        completed: false, // Would be reset daily
        progress: 80
      },

      // Level-based Tasks
      {
        id: 'reach-level-2',
        name: 'Reach Level 2',
        description: 'Accumulate enough points to reach level 2',
        type: 'CUSTOM',
        points: 100,
        requirements: { level: 2 },
        isActive: userLevel < 2,
        completed: userLevel >= 2,
        progress: userLevel >= 2 ? 100 : Math.min((userPoints / 1000) * 100, 95)
      },

      {
        id: 'points-milestone-500',
        name: 'Earn 500 Points',
        description: 'Accumulate 500 total points across all activities',
        type: 'CUSTOM',
        points: 50,
        requirements: { points: 500 },
        isActive: userPoints < 500,
        completed: userPoints >= 500,
        progress: Math.min((userPoints / 500) * 100, 100)
      },

      {
        id: 'points-milestone-1000',
        name: 'Earn 1000 Points',
        description: 'Reach the 1000 point milestone',
        type: 'CUSTOM',
        points: 150,
        requirements: { points: 1000 },
        isActive: userPoints < 1000,
        completed: userPoints >= 1000,
        progress: Math.min((userPoints / 1000) * 100, 100)
      },

      // Referral Tasks
      {
        id: 'first-referral',
        name: 'Invite Your First Friend',
        description: 'Share your referral link and get your first successful referral',
        type: 'REFERRAL',
        points: 100,
        requirements: { referrals: 1 },
        isActive: true,
        completed: false, // Would check actual referral data
        progress: 0
      },

      {
        id: 'referral-milestone-5',
        name: 'Invite 5 Friends',
        description: 'Successfully refer 5 friends to the platform',
        type: 'REFERRAL',
        points: 300,
        requirements: { referrals: 5 },
        isActive: true,
        completed: false,
        progress: 20 // Would be based on actual referral count
      },

      // Advanced Tasks (higher level requirements)
      {
        id: 'community-champion',
        name: 'Community Champion',
        description: 'Reach level 5 and maintain high engagement',
        type: 'CUSTOM',
        points: 500,
        requirements: { level: 5, twitterConnected: true },
        isActive: userLevel >= 3, // Only show for higher level users
        completed: userLevel >= 5 && twitterConnected,
        progress: userLevel >= 5 && twitterConnected ? 100 : Math.min((userLevel / 5) * 80 + (twitterConnected ? 20 : 0), 95)
      },

      // Special Event Tasks
      {
        id: 'beta-tester',
        name: 'Beta Tester Badge',
        description: 'Complete all basic tasks and reach level 3',
        type: 'CUSTOM',
        points: 250,
        requirements: { level: 3, walletConnected: true, twitterConnected: true },
        isActive: walletConnected && twitterConnected,
        completed: userLevel >= 3 && walletConnected && twitterConnected,
        progress: walletConnected && twitterConnected ? Math.min((userLevel / 3) * 100, 100) : 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }
    ]

    setTasks(generatedTasks)
    setLoading(false)
  }

  const completeTask = async (taskId: string) => {
    if (processingTasks.has(taskId)) return

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Check if task requirements are met based on props
    let canComplete = false
    let message = ''

    switch (task.type) {
      case 'WALLET_CONNECT':
        canComplete = walletConnected
        message = canComplete ? 'Wallet connected successfully!' : 'Please connect your wallet first'
        break
      case 'SOCIAL_TWITTER':
        if (task.id === 'twitter-connect') {
          canComplete = twitterConnected
          message = canComplete ? 'Twitter connected successfully!' : 'Please connect your Twitter account first'
        } else {
          canComplete = twitterConnected
          message = canComplete ? `Twitter task completed! +${task.points} points` : 'Please connect Twitter first'
        }
        break
      case 'DAILY_CHECK_IN':
        canComplete = true // Always allow daily check-in
        message = `Daily check-in completed! +${task.points} points`
        break
      case 'REFERRAL':
        canComplete = false // Would need actual referral data
        message = 'Complete the referral requirement to claim this task'
        break
      case 'CUSTOM':
        // Check specific requirements
        if (task.requirements.level) {
          canComplete = userLevel >= task.requirements.level
        }
        if (task.requirements.points) {
          canComplete = userPoints >= task.requirements.points
        }
        if (task.requirements.walletConnected) {
          canComplete = canComplete && walletConnected
        }
        if (task.requirements.twitterConnected) {
          canComplete = canComplete && twitterConnected
        }
        message = canComplete ? `Task completed! +${task.points} points` : 'Requirements not yet met'
        break
      default:
        canComplete = false
        message = 'Task cannot be completed at this time'
    }

    try {
      setProcessingTasks(prev => new Set(prev).add(taskId))

      if (canComplete) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        toast.success(message)
        
        // Update task as completed
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, completed: true, progress: 100 }
            : t
        ))
      } else {
        toast.error(message)
      }
    } catch (error) {
      console.error('Task completion error:', error)
      toast.error('Failed to complete task')
    } finally {
      setProcessingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'SOCIAL_TWITTER': return <Twitter className="w-6 h-6" />
      case 'SOCIAL_DISCORD': return <Users className="w-6 h-6" />
      case 'WALLET_CONNECT': return <Wallet className="w-6 h-6" />
      case 'REFERRAL': return <UserPlus className="w-6 h-6" />
      case 'DAILY_CHECK_IN': return <Calendar className="w-6 h-6" />
      case 'CUSTOM': return <Star className="w-6 h-6" />
      default: return <Target className="w-6 h-6" />
    }
  }

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'SOCIAL_TWITTER': return 'from-blue-500 to-cyan-500'
      case 'SOCIAL_DISCORD': return 'from-indigo-500 to-purple-500'
      case 'WALLET_CONNECT': return 'from-green-500 to-emerald-500'
      case 'REFERRAL': return 'from-pink-500 to-rose-500'
      case 'DAILY_CHECK_IN': return 'from-yellow-500 to-orange-500'
      case 'CUSTOM': return 'from-purple-500 to-violet-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getDifficultyBadge = (points: number) => {
    if (points >= 300) return { label: 'Epic', color: 'from-purple-500 to-pink-500' }
    if (points >= 100) return { label: 'Hard', color: 'from-red-500 to-orange-500' }
    if (points >= 50) return { label: 'Medium', color: 'from-yellow-500 to-orange-500' }
    return { label: 'Easy', color: 'from-green-500 to-emerald-500' }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed
    if (filter === 'available') return !task.completed && task.isActive
    return true
  })

  const completedCount = tasks.filter(t => t.completed).length
  const availableCount = tasks.filter(t => !t.completed && t.isActive).length
  const totalPoints = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Stats - Using Props */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-purple-400" />
            Tasks & Challenges
          </h2>
          <p className="text-gray-400 mt-2">Complete tasks to earn points and unlock rewards</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-gray-300">Level {userLevel}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-300">{userPoints.toLocaleString()} Points</span>
            <span className="text-gray-300">•</span>
            <span className={`${walletConnected ? 'text-green-400' : 'text-red-400'}`}>
              Wallet {walletConnected ? 'Connected' : 'Not Connected'}
            </span>
            <span className="text-gray-300">•</span>
            <span className={`${twitterConnected ? 'text-blue-400' : 'text-red-400'}`}>
              Twitter {twitterConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">{totalPoints.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Points from Tasks</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Completed</h3>
              <p className="text-green-400 text-sm">Well done!</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400">{completedCount}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Available</h3>
              <p className="text-blue-400 text-sm">Ready to complete</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400">{availableCount}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Total</h3>
              <p className="text-purple-400 text-sm">All tasks</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-400">{tasks.length}</div>
        </motion.div>
      </div>

      {/* Connection Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${
            walletConnected 
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' 
              : 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${walletConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Wallet className={`w-6 h-6 ${walletConnected ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Wallet Status</h3>
              <p className={`text-sm ${walletConnected ? 'text-green-400' : 'text-red-400'}`}>
                {walletConnected ? 'Connected & Ready' : 'Not Connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">
              {walletConnected ? 'All wallet tasks available' : 'Connect wallet to unlock tasks'}
            </span>
            {walletConnected && <CheckCircle className="w-6 h-6 text-green-400" />}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl border ${
            twitterConnected 
              ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30' 
              : 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${twitterConnected ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
              <Twitter className={`w-6 h-6 ${twitterConnected ? 'text-blue-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Twitter Status</h3>
              <p className={`text-sm ${twitterConnected ? 'text-blue-400' : 'text-red-400'}`}>
                {twitterConnected ? 'Connected & Active' : 'Not Connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">
              {twitterConnected ? 'Social tasks unlocked' : 'Connect Twitter for social tasks'}
            </span>
            {twitterConnected && <CheckCircle className="w-6 h-6 text-blue-400" />}
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-black/20 backdrop-blur-xl rounded-2xl p-1">
        {[
          { id: 'all', name: 'All Tasks', count: tasks.length },
          { id: 'available', name: 'Available', count: availableCount },
          { id: 'completed', name: 'Completed', count: completedCount }
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

      {/* Tasks List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, index) => {
            const difficulty = getDifficultyBadge(task.points)
            const isProcessing = processingTasks.has(task.id)
            const canAttempt = task.isActive && !task.completed
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
                  task.completed
                    ? 'bg-green-500/10 border-green-500/30'
                    : canAttempt
                    ? 'bg-black/20 border-white/10 hover:border-white/20 hover:bg-white/5'
                    : 'bg-gray-900/20 border-gray-600/20 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Task Icon */}
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${getTaskColor(task.type)} flex-shrink-0 ${!canAttempt && !task.completed && 'opacity-50'}`}>
                      {getTaskIcon(task.type)}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white truncate">{task.name}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${difficulty.color} text-white`}>
                          {difficulty.label}
                        </div>
                        {task.type === 'DAILY_CHECK_IN' && (
                          <div className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                            Daily
                          </div>
                        )}
                        {!task.isActive && !task.completed && (
                          <div className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
                            Locked
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-400 mb-4 line-clamp-2">{task.description}</p>
                      
                      {/* Task Requirements */}
                      {task.requirements && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {task.requirements.action && (
                            <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                              {task.requirements.action.replace('_', ' ')}
                            </div>
                          )}
                          {task.requirements.targetUsername && (
                            <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                              @{task.requirements.targetUsername}
                            </div>
                          )}
                          {task.requirements.level && (
                            <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                              Level {task.requirements.level} Required
                            </div>
                          )}
                          {task.requirements.points && (
                            <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                              {task.requirements.points} Points Required
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progress Bar */}
                      {task.progress !== undefined && task.progress < 100 && !task.completed && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white">{task.progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* Requirement Status */}
                      {!task.completed && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {task.type === 'WALLET_CONNECT' && (
                              <div className={`text-xs px-2 py-1 rounded ${walletConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                Wallet {walletConnected ? '✓' : '✗'}
                              </div>
                            )}
                            {task.type === 'SOCIAL_TWITTER' && task.id !== 'twitter-connect' && (
                              <div className={`text-xs px-2 py-1 rounded ${twitterConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                Twitter {twitterConnected ? '✓' : '✗'}
                              </div>
                            )}
                            {task.requirements?.level && (
                              <div className={`text-xs px-2 py-1 rounded ${userLevel >= task.requirements.level ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                Level {userLevel >= task.requirements.level ? '✓' : '✗'}
                              </div>
                            )}
                            {task.requirements?.points && (
                              <div className={`text-xs px-2 py-1 rounded ${userPoints >= task.requirements.points ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                Points {userPoints >= task.requirements.points ? '✓' : '✗'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Actions */}
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">+{task.points}</div>
                      <div className="text-sm text-gray-400">points</div>
                    </div>

                    {task.completed ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="p-3 bg-green-500/20 rounded-xl"
                      >
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: canAttempt ? 1.05 : 1 }}
                        whileTap={{ scale: canAttempt ? 0.95 : 1 }}
                        onClick={() => canAttempt && completeTask(task.id)}
                        disabled={isProcessing || !canAttempt}
                        className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                          canAttempt
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Verifying...
                          </>
                        ) : canAttempt ? (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Complete
                            <ArrowRight className="w-5 h-5" />
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            Locked
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* External Links */}
                {task.requirements?.tweetUrl && !task.completed && twitterConnected && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <motion.a
                      href={task.requirements.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Tweet
                    </motion.a>
                  </div>
                )}

                {/* Expiry Warning */}
                {task.expiresAt && new Date(task.expiresAt) > new Date() && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <Clock className="w-4 h-4" />
                      Expires: {new Date(task.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Unlock Requirements */}
                {!task.isActive && !task.completed && (
                  <div className="mt-4 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Shield className="w-4 h-4" />
                      {task.type === 'SOCIAL_TWITTER' && !twitterConnected && 'Connect Twitter to unlock this task'}
                      {task.type === 'WALLET_CONNECT' && !walletConnected && 'Wallet connection required'}
                      {task.requirements?.level && userLevel < task.requirements.level && `Reach level ${task.requirements.level} to unlock`}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
              <Target className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {filter === 'completed' ? 'No completed tasks yet' : 
               filter === 'available' ? 'No available tasks' : 'No tasks found'}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {filter === 'completed' 
                ? 'Start completing tasks to earn points and build your reputation!'
                : filter === 'available'
                ? 'Connect your wallet and Twitter to unlock more tasks!'
                : 'Try adjusting your filters to see more tasks.'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Progress Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-indigo-400" />
          Your Progress Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-400 mb-1">{completedCount}/{tasks.length}</div>
            <div className="text-gray-400 text-sm">Tasks Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">{totalPoints.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Points from Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">{userLevel}</div>
            <div className="text-gray-400 text-sm">Current Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {Math.round((completedCount / tasks.length) * 100)}%
            </div>
            <div className="text-gray-400 text-sm">Completion Rate</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}