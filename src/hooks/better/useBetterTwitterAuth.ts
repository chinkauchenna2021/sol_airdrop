import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useUserStore } from '@/store/useUserStore'
import { useWalletStore } from '@/store/useWalletStore'
import toast from 'react-hot-toast'

interface TwitterProfile {
  id: string
  username: string
  name: string
  image: string
  followers_count?: number
}

export function useTwitterAuth() {
  const { data:authUser, isPending } = authClient.useSession()
  const { user, setUser } = useUserStore()
  const { connected, publicKey } = useWalletStore()
  const [isConnecting, setIsConnecting] = useState(false)

  // Sync better-auth user with our user store
  useEffect(() => {
    if (authUser && connected && publicKey) {
      syncUserData(authUser)
    }
  }, [authUser, connected, publicKey])

  const syncUserData = async (authUser: any) => {
    try {
      // Get or create user in our system
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey,
          twitterData: {
            id: authUser.id,
            username: authUser.name, // better-auth might provide this differently
            name: authUser.email, // adapt based on better-auth response
            image: authUser.image,
          }
        }),
      })

      if (response.ok) {
        const { user: syncedUser } = await response.json()
        setUser(syncedUser)
      }
    } catch (error) {
      console.error('Failed to sync user data:', error)
    }
  }

  const connectTwitter = async () => {
    try {
      setIsConnecting(true)
      
      if (!connected || !publicKey) {
        toast.error('Please connect your wallet first')
        return false
      }

      // Use better-auth to sign in with Twitter
      await authClient.signIn.social({
        provider: "twitter",
        callbackURL: "/",
      })

      return true
    } catch (error) {
      console.error('Twitter connection error:', error)
      toast.error('Failed to connect Twitter account')
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectTwitter = async () => {
    try {
      await authClient.signOut()
      
      // Update user in our system
      if (user) {
        const response = await fetch('/api/auth/disconnect-twitter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        })

        if (response.ok) {
          setUser({
            ...user,
            twitterId: undefined,
            twitterUsername: undefined,
          })
          toast.success('Twitter account disconnected')
        }
      }
    } catch (error) {
      console.error('Twitter disconnect error:', error)
      toast.error('Failed to disconnect Twitter account')
    }
  }

  const isTwitterConnected = !!(authUser && user?.twitterId)

  return {
    authUser,
    isTwitterConnected,
    isConnecting: isConnecting || isPending,
    connectTwitter,
    disconnectTwitter,
  }
}