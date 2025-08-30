// hooks/useEnhancedTwitterAuth.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWalletStore } from '@/store/useWalletStore'
import { useUserStore } from '@/store/useUserStore'
import { toast } from 'sonner'

export function useEnhancedTwitterAuth() {
  const { user, setUser } = useUserStore()
  const { connected, publicKey } = useWalletStore()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [engagementData, setEngagementData] = useState<any>(null)

  const syncUserWithBetterAuth = useCallback(async (authUser: any) => {
    if (isSyncing) return
    
    setIsSyncing(true)
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

      if (newUser) {
        toast.success(`Welcome! ${awarded} tokens awarded for connecting Twitter.`, {
          description: `@${syncedUser.twitterUsername} successfully connected`
        })
      } else {
        toast.success('Twitter account updated successfully!')
      }

      return syncedUser
    } catch (error) {
      console.error('❌ User sync error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      setConnectionError(errorMessage)
      toast.error(`Failed to sync Twitter data: ${errorMessage}`)
      return null
    } finally {
      setIsSyncing(false)
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
      if (user?.twitterId) {
        toast.info('Twitter account is already connected')
        return true
      }

      console.log('🐦 Initiating Twitter connection...')
      
      // Redirect to Twitter auth
      window.location.href = '/api/auth/twitter'
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
  }, [connected, publicKey, isConnecting, user])

  const disconnectTwitter = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting Twitter account...')
      
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
        //   delete updatedUser.twitterName 
        //   delete updatedUser.twitterImage
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
        setEngagementData(data.stats)
      }
    } catch (error) {
      console.error('❌ Failed to load engagement data:', error)
    }
  }, [user?.id])

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

  // Check if we just returned from Twitter auth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const twitterConnected = urlParams.get('twitter_connected')
    const userId = urlParams.get('user_id')
    
    if (twitterConnected === 'true' && userId && user?.id === userId) {
      toast.success('Twitter connected successfully!')
      loadEngagementData()
      
      // Clean up URL
      const cleanUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
    }
  }, [user?.id, loadEngagementData])

  // Load engagement data when Twitter is connected
  useEffect(() => {
    if (user?.twitterId) {
      loadEngagementData()
    }
  }, [user?.twitterId, loadEngagementData])

  const isTwitterConnected = !!user?.twitterId
  const isLoading = isConnecting || isSyncing
  const hasError = !!connectionError

  return {
    // Core auth state
    isTwitterConnected,
    isLoading,
    hasError,
    error: connectionError,

    // User data
    user,
    engagementData,

    // Auth actions
    connectTwitter,
    disconnectTwitter,
    refreshTwitterData,

    // Utility functions
    syncUser: syncUserWithBetterAuth,
    loadEngagementData,

    // State flags
    isConnecting,
    isSyncing,
  }
}