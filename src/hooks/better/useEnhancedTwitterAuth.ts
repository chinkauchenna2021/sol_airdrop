import { useState, useEffect, useCallback } from 'react'
import { createAuthClient } from "better-auth/react"
import { useWalletStore } from '@/store/useWalletStore'
import { useUserStore } from '@/store/useUserStore'
import { toast } from 'sonner'
import type { Session, User } from '@/lib/better-auth-enhanced'

interface TwitterEngagementData {
  totalEngagements: number
  todayEngagements: number
  weeklyEngagements: number
  monthlyEngagements: number
  activityLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  totalTokens?: number
  totalEarnedTokens?: number
  breakdown: Array<{
    type: string
    count: number
    tokens: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    tokens: number
    createdAt: string
    tweetId: string
  }>
}

interface EnhancedUser {
  id: string
  walletAddress: string
  twitterId?: string
  twitterUsername?: string
  twitterName?: string
  twitterImage?: string
  twitterFollowers?: number
  twitterActivity?: 'HIGH' | 'MEDIUM' | 'LOW'
  totalPoints: number
  totalTokens: number
  totalEarnedTokens: number
  level: number
  rank: number
  streak: number
  referralCode: string
  isAdmin: boolean
}

// Enhanced auth client with custom configuration
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  fetchOptions: {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  }
})

export function useEnhancedTwitterAuth() {
  const { data: session, isPending, error } = authClient.useSession()
  const { user, setUser, } = useUserStore()
  const { connected, publicKey } = useWalletStore()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setSyncing] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [engagementData, setEngagementData] = useState<TwitterEngagementData | null>(null)

  // Auto-sync when session changes
  useEffect(() => {
    if (session?.user && connected && publicKey && !user?.twitterId) {
      syncUserWithBetterAuth(session.user)
    }
  }, [session, connected, publicKey])

  // Load engagement data when Twitter is connected
  useEffect(() => {
    if (user?.twitterId) {
      loadEngagementData()
    }
  }, [user?.twitterId])

  const syncUserWithBetterAuth = useCallback(async (authUser: any) => {
    if (isSyncing) return
    
    setSyncing(true)
    setConnectionError(null)

    try {
      console.log('🔄 Syncing user data with better-auth...')
      
      const response = await fetch('/api/auth/sync-user-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey,
          betterAuthUser: authUser,
          twitterData: {
            id: authUser.twitterId || authUser.id,
            username: authUser.twitterUsername || authUser.username,
            name: authUser.twitterName || authUser.name,
            image: authUser.twitterImage || authUser.image,
            followers_count: authUser.twitterFollowers || 0,
            verified: authUser.verified || false,
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Sync failed')
      }

      const { user: syncedUser, awarded, newUser } = await response.json()
      setUser(syncedUser)

      // Show appropriate success message
      if (newUser) {
        toast.success(`Welcome! ${awarded} tokens awarded for connecting Twitter.`, {
          description: `@${syncedUser.twitterUsername} successfully connected`
        })
      } else {
        toast.success('Twitter account updated successfully!')
      }

      // Start monitoring if new user
      if (newUser) {
        await startTwitterMonitoring(syncedUser.id)
      }

      return syncedUser
    } catch (error) {
      console.error('❌ User sync error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      setConnectionError(errorMessage)
      toast.error(`Failed to sync Twitter data: ${errorMessage}`)
      return null
    } finally {
      setSyncing(false)
    }
  }, [publicKey, isSyncing])

  const connectTwitter = useCallback(async () => {
    if (isConnecting) return false
    
    setIsConnecting(true)
    setConnectionError(null)

    try {
      if (!connected || !publicKey) {
        toast.error('Please connect your wallet first')
        return false
      }

      // Check if already connected
      if (session?.user && user?.twitterId) {
        toast.info('Twitter account is already connected')
        return true
      }

      console.log('🐦 Initiating better-auth Twitter connection...')
      
      // Initiate better-auth Twitter sign-in
      const result = await authClient.signIn.social({
        provider: "twitter",
        callbackURL: "/dashboard?twitter=connected",
        fetchOptions: {
          onRequest: (context) => {
            console.log('🔄 Twitter auth request initiated')
          },
          onResponse: (context) => {
            console.log('✅ Twitter auth response received')
          },
          onRequestError: (context: { error: any }) => {
            console.error('❌ Twitter auth request error:', context.error)
            setConnectionError('Authentication request failed')
          }
        }
      })

      if (result.error) {
        throw new Error(result.error.message || 'Twitter authentication failed')
      }

      return true
    } catch (error) {
      console.error('❌ Twitter connection error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      setConnectionError(errorMessage)
      toast.error(`Failed to connect Twitter: ${errorMessage}`)
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [connected, publicKey, isConnecting, session, user])

  const disconnectTwitter = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting Twitter account...')
      
      // Sign out from better-auth
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            console.log('✅ Better-auth sign out successful')
          }
        }
      })
      
      // Update user in our system
      if (user?.id) {
        const response = await fetch('/api/auth/disconnect-twitter-enhanced', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        })

        if (response.ok) {
          const updatedUser = { ...user }
          delete updatedUser.twitterId
          delete updatedUser.twitterUsername
          delete updatedUser.twitterFollowers
          delete updatedUser.twitterActivity
          
          setUser(updatedUser)
          setEngagementData(null)
          toast.success('Twitter account disconnected successfully')
        }
      }
    } catch (error) {
      console.error('❌ Twitter disconnect error:', error)
      toast.error('Failed to disconnect Twitter account')
    }
  }, [user])

  const loadEngagementData = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/twitter/engagement-stats/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setEngagementData({
          totalEngagements: data.stats.totalEngagements || 0,
          todayEngagements: data.stats.todayEngagements || 0,
          weeklyEngagements: data.stats.weeklyEngagements || 0,
          monthlyEngagements: data.stats.monthlyEngagements || 0,
          activityLevel: data.stats.activityLevel || 'LOW',
          totalTokens: data.stats.totalTokens || 0,
          totalEarnedTokens: data.stats.totalEarnedTokens || 0,
          breakdown: data.stats.breakdown || [],
          recentActivity: data.stats.recentActivity || []
        })
      }
    } catch (error) {
      console.error('❌ Failed to load engagement data:', error)
    }
  }, [user?.id])

  const startTwitterMonitoring = async (userId: string) => {
    try {
      console.log('📊 Starting Twitter monitoring for user:', userId)
      
      const response = await fetch('/api/twitter/start-monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        console.log('✅ Twitter monitoring started successfully')
      }
    } catch (error) {
      console.error('❌ Failed to start Twitter monitoring:', error)
    }
  }

  const refreshTwitterData = useCallback(async () => {
    if (!user?.id || !user?.twitterId) return

    try {
      const response = await fetch(`/api/twitter/refresh-data/${user.id}`, {
        method: 'POST'
      })

      if (response.ok) {
        const { user: updatedUser } = await response.json()
        setUser(updatedUser)
        await loadEngagementData()
        toast.success('Twitter data refreshed successfully')
      }
    } catch (error) {
      console.error('❌ Failed to refresh Twitter data:', error)
      toast.error('Failed to refresh Twitter data')
    }
  }, [user, loadEngagementData])

  const checkEngagementRewards = useCallback(async () => {
    if (!user?.id || !user?.twitterId) return

    try {
      const response = await fetch('/api/twitter/check-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (response.ok) {
        const { rewards, newTokens } = await response.json()
        
        if (rewards.length > 0) {
          toast.success(`${newTokens} tokens earned from Twitter activity!`, {
            description: `${rewards.length} new engagements detected`
          })
          
          // Refresh user data
          const userResponse = await fetch(`/api/user/${user.id}`)
          if (userResponse.ok) {
            const { user: updatedUser } = await userResponse.json()
            setUser(updatedUser)
          }

          // Refresh engagement data
          await loadEngagementData()
        }
      }
    } catch (error) {
      console.error('❌ Failed to check engagement rewards:', error)
    }
  }, [user, loadEngagementData])

  // Computed properties
  const isTwitterConnected = !!(session?.user && user?.twitterId)
  const isLoading = isPending || isConnecting || isSyncing
  const hasError = !!error || !!connectionError

  return {
    // Core auth state
    session,
    authUser: session?.user,
    isTwitterConnected,
    isLoading,
    hasError,
    error: error || connectionError,

    // User data
    user,
    engagementData,

    // Auth actions
    connectTwitter,
    disconnectTwitter,
    refreshTwitterData,
    checkEngagementRewards,

    // Utility functions
    syncUser: syncUserWithBetterAuth,
    loadEngagementData,

    // State flags
    isConnecting,
    isSyncing,
  }
}