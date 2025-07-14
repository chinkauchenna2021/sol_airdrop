import { useState, useCallback } from 'react'
import { useUserStore } from '@/store/useUserStore'
import toast from 'react-hot-toast'

interface TwitterProfile {
  id: string
  username: string
  name: string
  profileImage?: string
  followers: number
  activityLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface TwitterAuthHook {
  isConnected: boolean
  profile: TwitterProfile | null
  loading: boolean
  connectTwitter: () => Promise<boolean>
  disconnectTwitter: () => Promise<boolean>
  checkStatus: () => Promise<void>
}

export function useTwitterAuth(): TwitterAuthHook {
  const { user, setUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<TwitterProfile | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/twitter/status')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        
        if (data.connected && data.profile && user) {
          setUser({
            ...user,
            twitterId: data.profile.id,
            twitterUsername: data.profile.username
          })
        }
      }
    } catch (error) {
      console.error('Failed to check Twitter status:', error)
    }
  }, [user, setUser])

  const connectTwitter = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true)
      
      // Get auth URL from backend
      const res = await fetch('/api/twitter/auth')
      if (!res.ok) {
        throw new Error('Failed to get authentication URL')
      }
      
      const { authUrl } = await res.json()
      
      // Open Twitter OAuth in popup
      const popup = window.open(
        authUrl,
        'twitter-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        toast.error('Popup blocked. Please allow popups and try again.')
        return false
      }

      // Monitor popup for completion
      return new Promise<boolean>((resolve) => {
        const checkInterval = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(checkInterval)
              
              // Check if connection was successful
              await checkStatus()
              
              // Check URL for success/error parameters
              const urlParams = new URLSearchParams(window.location.search)
              if (urlParams.get('twitter') === 'connected') {
                toast.success('Twitter connected successfully!')
                resolve(true)
              } else if (urlParams.get('error')) {
                const error = urlParams.get('error')
                const reason = urlParams.get('reason')
                toast.error(`Twitter connection failed: ${reason || error}`)
                resolve(false)
              } else {
                resolve(false)
              }
            }
          } catch (error) {
            // Ignore cross-origin errors while popup is open
          }
        }, 1000)

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!popup.closed) {
            popup.close()
            toast.error('Twitter authentication timed out')
            resolve(false)
          }
        }, 5 * 60 * 1000)
      })
    } catch (error) {
      console.error('Twitter connect error:', error)
      toast.error('Failed to initiate Twitter connection')
      return false
    } finally {
      setLoading(false)
    }
  }, [checkStatus])

  const disconnectTwitter = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true)
      
      const res = await fetch('/api/twitter/disconnect', {
        method: 'POST'
      })
      
      if (res.ok) {
        setProfile(null)
        if (user) {
          setUser({
            ...user,
            twitterId: undefined,
            twitterUsername: undefined
          })
        }
        toast.success('Twitter account disconnected')
        return true
      } else {
        throw new Error('Failed to disconnect')
      }
    } catch (error) {
      console.error('Twitter disconnect error:', error)
      toast.error('Failed to disconnect Twitter account')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, setUser])

  return {
    isConnected: !!profile,
    profile,
    loading,
    connectTwitter,
    disconnectTwitter,
    checkStatus
  }
}