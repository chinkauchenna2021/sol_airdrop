import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, Circle, Clock, Twitter, Users, Wallet, 
  Gift, Target, Calendar, Zap, Star, ArrowRight,
  ExternalLink, Trophy, MessageCircle, Heart, Repeat,
  UserPlus, Award, Shield, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

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

interface TasksProps {
  userId: string
}

export function TasksComponent({ userId }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('all')
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTasks()
  }, [userId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const completeTask = async (taskId: string) => {
    if (processingTasks.has(taskId)) return

    try {
      setProcessingTasks(prev => new Set(prev).add(taskId))
      
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
      })
      
      if (res.ok) {
        const { points, message } = await res.json()
        toast.success(message || `Task completed! +${points} points`)
        fetchTasks() // Refresh tasks
      } else {
        const error = await res.json()
        toast.error(error.message || 'Failed to complete task')
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
    if (points >= 100) return { label: 'Epic', color: 'from-purple-500 to-pink-500' }
    if (points >= 50) return { label: 'Hard', color: 'from-red-500 to-orange-500' }
    if (points >= 25) return { label: 'Medium', color: 'from-yellow-500 to-orange-500' }
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
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-purple-400" />
            Tasks & Challenges
          </h2>
          <p className="text-gray-400 mt-2">Complete tasks to earn points and unlock rewards</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">{totalPoints.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Points Earned</div>
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
                    : 'bg-black/20 border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Task Icon */}
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${getTaskColor(task.type)} flex-shrink-0`}>
                      {getTaskIcon(task.type)}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white truncate">{task.name}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${difficulty.color}`}>
                          {difficulty.label}
                        </div>
                        {task.type === 'DAILY_CHECK_IN' && (
                          <div className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                            Daily
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
                        </div>
                      )}

                      {/* Progress Bar */}
                      {task.progress !== undefined && task.progress < 100 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white">{task.progress}%</span>
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => completeTask(task.id)}
                        disabled={isProcessing || !task.isActive}
                        className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                          task.isActive
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
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Complete
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* External Links */}
                {task.requirements?.tweetUrl && !task.completed && (
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
                : 'Check back later for new challenges and opportunities to earn points.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}