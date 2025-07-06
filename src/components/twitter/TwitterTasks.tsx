'use client'

import { useEffect, useState } from 'react'
import { Heart, Repeat2, MessageCircle, UserPlus, CheckCircle2, Circle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Task {
  id: string
  type: 'LIKE' | 'RETWEET' | 'COMMENT' | 'FOLLOW'
  targetId: string
  targetUsername?: string
  points: number
  completed: boolean
  description: string
  tweetUrl?: string
}

interface TwitterTasksProps {
  userId: string
}

export function TwitterTasks({ userId }: TwitterTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [userId])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/twitter/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const completeTask = async (taskId: string) => {
    try {
      setProcessing(taskId)
      const res = await fetch(`/api/twitter/tasks/${taskId}/complete`, {
        method: 'POST',
      })
      
      if (res.ok) {
        const { points } = await res.json()
        toast.success(`Task completed! +${points} points`)
        fetchTasks()
      } else {
        const error = await res.json()
        toast.error(error.message || 'Failed to complete task')
      }
    } catch (error) {
      toast.error('Failed to process task')
    } finally {
      setProcessing(null)
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-5 h-5" />
      case 'RETWEET':
        return <Repeat2 className="w-5 h-5" />
      case 'COMMENT':
        return <MessageCircle className="w-5 h-5" />
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5" />
      default:
        return <Circle className="w-5 h-5" />
    }
  }

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'LIKE':
        return 'text-red-400'
      case 'RETWEET':
        return 'text-green-400'
      case 'COMMENT':
        return 'text-blue-400'
      case 'FOLLOW':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 skeleton rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No tasks available at the moment</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-lg border ${
              task.completed
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-white/5 border-white/10'
            } transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`${getTaskColor(task.type)}`}>
                  {getTaskIcon(task.type)}
                </div>
                <div>
                  <h3 className="text-white font-medium">{task.description}</h3>
                  {task.targetUsername && (
                    <p className="text-gray-400 text-sm">@{task.targetUsername}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-solana-green font-semibold">+{task.points} pts</span>
                {task.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <button
                    onClick={() => completeTask(task.id)}
                    disabled={processing === task.id}
                    className="px-4 py-2 bg-solana-purple text-white rounded-lg hover:bg-solana-purple/90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing === task.id ? (
                      <>
                        <div className="loading-spinner w-4 h-4" />
                        Checking...
                      </>
                    ) : (
                      'Complete'
                    )}
                  </button>
                )}
              </div>
            </div>
            {task.tweetUrl && !task.completed && (
              <div className="mt-3">
                <a
                  href={task.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-solana-purple hover:text-solana-purple/80 text-sm underline"
                >
                  Go to Tweet →
                </a>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}