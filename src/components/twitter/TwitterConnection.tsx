// 'use client'

// import { useState } from 'react'
// import { Twitter, ExternalLink } from 'lucide-react'
// import toast from 'react-hot-toast'
// import { Button } from '../ui/button'

// interface TwitterConnectProps {
//   onConnect?: () => void
// }

// export function TwitterConnect({ onConnect }: TwitterConnectProps) {
//   const [connecting, setConnecting] = useState(false)

//   const handleTwitterConnect = async () => {
//     try {
//       setConnecting(true)
      
//       // Get OAuth URL from backend
//       const res = await fetch('/api/twitter/auth')
//       if (!res.ok) throw new Error('Failed to get auth URL')
      
//       const { authUrl } = await res.json()
      
//       // Open Twitter OAuth in popup
//       const width = 600
//       const height = 700
//       const left = window.screen.width / 2 - width / 2
//       const top = window.screen.height / 2 - height / 2
      
//       const popup = window.open(
//         authUrl,
//         'twitter-auth',
//         `width=${width},height=${height},left=${left},top=${top}`
//       )
      
//       // Check for callback
//       const checkInterval = setInterval(() => {
//         try {
//           if (popup?.closed) {
//             clearInterval(checkInterval)
//             checkAuthStatus()
//           }
//         } catch (error) {
//           // Ignore cross-origin errors
//         }
//       }, 1000)
      
//     } catch (error) {
//       console.error('Twitter connect error:', error)
//       toast.error('Failed to connect Twitter')
//     } finally {
//       setConnecting(false)
//     }
//   }
  
//   const checkAuthStatus = async () => {
//     try {
//       const res = await fetch('/api/twitter/status')
//       if (res.ok) {
//         const { connected } = await res.json()
//         if (connected) {
//           toast.success('Twitter connected successfully!')
//           onConnect?.()
//         }
//       }
//     } catch (error) {
//       console.error('Auth check error:', error)
//     }
//   }

//   return (
//     <Button
//       onClick={handleTwitterConnect}
//       disabled={connecting}
//       className="flex items-center gap-3 px-6 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-all disabled:opacity-50"
//     >
//       <Twitter className="w-5 h-5" />
//       {connecting ? 'Connecting...' : 'Connect Twitter'}
//       <ExternalLink className="w-4 h-4" />
//     </Button>
//   )
// }




import { useEffect } from 'react'
import { Twitter, ExternalLink, Unlink, Users, Activity, Coins } from 'lucide-react'
import { useTwitterAuth } from '@/hooks/useTwitterAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

interface TwitterConnectionProps {
  onConnect?: () => void
  onDisconnect?: () => void
}

export function TwitterConnection({ onConnect, onDisconnect }: TwitterConnectionProps) {
  const { isConnected, profile, loading, connectTwitter, disconnectTwitter, checkStatus } = useTwitterAuth()

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const handleConnect = async () => {
    const success = await connectTwitter()
    if (success) {
      onConnect?.()
    }
  }

  const handleDisconnect = async () => {
    const success = await disconnectTwitter()
    if (success) {
      onDisconnect?.()
    }
  }

  const getActivityBadgeColor = (level?: string) => {
    switch (level) {
      case 'HIGH': return 'bg-green-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getTokenAllocation = (level?: string) => {
    switch (level) {
      case 'HIGH': return 4000
      case 'MEDIUM': return 3500
      case 'LOW': return 3000
      default: return 3000
    }
  }

  if (isConnected && profile) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            Twitter Connected
          </CardTitle>
          <CardDescription>Your Twitter account is linked and active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {profile.profileImage && (
              <Image
                src={profile.profileImage}
                alt={`${profile.username}'s profile`}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div className="flex-1">
              <h3 className="text-white font-medium">{profile.name}</h3>
              <p className="text-gray-400 text-sm">@{profile.username}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Users className="w-4 h-4" />
                {profile.followers?.toLocaleString() || 0}
              </div>
              {profile.activityLevel && (
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getActivityBadgeColor(profile.activityLevel)}`} />
                  <span className="text-xs text-gray-400">
                    {profile.activityLevel} Activity
                  </span>
                </div>
              )}
            </div>
          </div>

          {profile.activityLevel && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Token Allocation</span>
                <span className="text-sm font-medium text-green-400">
                  {getTokenAllocation(profile.activityLevel).toLocaleString()} tokens
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Based on your {profile.activityLevel.toLowerCase()} activity level
              </p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full"
          >
            <Unlink className="w-4 h-4 mr-2" />
            {loading ? 'Disconnecting...' : 'Disconnect Twitter'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Twitter className="w-5 h-5 text-[#1DA1F2]" />
          Connect Twitter
        </CardTitle>
        <CardDescription>
          Link your Twitter account to track engagement and earn rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span>Track likes, retweets, and comments</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Earn bonus rewards based on followers</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>Get 50 points for connecting</span>
          </div>
        </div>

        <Button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
        >
          <Twitter className="w-4 h-4 mr-2" />
          {loading ? 'Connecting...' : 'Connect with Twitter'}
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Secure OAuth 2.0 authentication • Your data is encrypted and protected
        </p>
      </CardContent>
    </Card>
  )
}