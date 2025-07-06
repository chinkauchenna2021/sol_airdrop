import { useState, useCallback } from 'react'
import { useUserStore } from '@/store/useUserStore'
import toast from 'react-hot-toast'

interface TwitterProfile {
  id: string
  username: string
  name: string
  profileImage: string
  followersCount: number
  verified: boolean
}

interface TwitterTask {
  id: string
  type: 'LIKE' | 'RETWEET' | 'FOLLOW' | 'COMMENT'
  targetId: string
  targetUsername?: string
  points: number
  completed: boolean
  description: string
}

export function useTwitter() {
  const { user, setUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<TwitterProfile | null>(null)

  const connectTwitter = useCallback(async () => {
    try {
      setLoading(true)
      
      const res = await fetch('/api/twitter/auth')
      if (!res.ok) throw new Error('Failed to get auth URL')
      
      const { authUrl } = await res.json()
      
      // Open Twitter OAuth in popup
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      const popup = window.open(
        authUrl,
        'twitter-auth',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      return new Promise<boolean>((resolve) => {
        const checkInterval = setInterval(async () => {
          try {
            if (popup?.closed) {
              clearInterval(checkInterval)
              
              // Check if connection was successful
              const statusRes = await fetch('/api/twitter/status')
              if (statusRes.ok) {
                const { connected, profile } = await statusRes.json()
                if (connected && profile) {
                  setProfile(profile)
                  if (user) {
                    setUser({
                      ...user,
                      twitterId: profile.id,
                      twitterUsername: profile.username,
                    })
                  }
                  toast.success('Twitter connected successfully!')
                  resolve(true)
                } else {
                  resolve(false)
                }
              } else {
                resolve(false)
              }
            }
          } catch (error) {
            // Ignore cross-origin errors
          }
        }, 1000)
      })
    } catch (error) {
      console.error('Twitter connect error:', error)
      toast.error('Failed to connect Twitter')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, setUser])

  const disconnectTwitter = useCallback(async () => {
    try {
      setLoading(true)
      
      const res = await fetch('/api/twitter/disconnect', {
        method: 'POST',
      })
      
      if (res.ok) {
        setProfile(null)
        if (user) {
          setUser({
            ...user,
            twitterId: undefined,
            twitterUsername: undefined,
          })
        }
        toast.success('Twitter disconnected')
        return true
      }
      
      throw new Error('Failed to disconnect')
    } catch (error) {
      console.error('Twitter disconnect error:', error)
      toast.error('Failed to disconnect Twitter')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, setUser])

  const fetchTasks = useCallback(async (): Promise<TwitterTask[]> => {
    try {
      const res = await fetch('/api/twitter/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      
      const { tasks } = await res.json()
      return tasks
    } catch (error) {
      console.error('Fetch tasks error:', error)
      return []
    }
  }, [])

  const completeTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      setLoading(true)
      
      const res = await fetch(`/api/twitter/tasks/${taskId}/complete`, {
        method: 'POST',
      })
      
      if (res.ok) {
        const { points } = await res.json()
        toast.success(`Task completed! +${points} points`)
        return true
      }
      
      const error = await res.json()
      toast.error(error.message || 'Failed to complete task')
      return false
    } catch (error) {
      console.error('Complete task error:', error)
      toast.error('Failed to complete task')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyEngagement = useCallback(async (
    tweetId: string,
    type: 'LIKE' | 'RETWEET' | 'COMMENT'
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/twitter/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetId, type }),
      })
      
      if (res.ok) {
        const { verified } = await res.json()
        return verified
      }
      
      return false
    } catch (error) {
      console.error('Verify engagement error:', error)
      return false
    }
  }, [])

  return {
    loading,
    profile,
    isConnected: !!user?.twitterId,
    connectTwitter,
    disconnectTwitter,
    fetchTasks,
    completeTask,
    verifyEngagement,
  }
}