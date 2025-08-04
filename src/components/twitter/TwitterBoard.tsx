import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Twitter, 
  Users, 
  Activity, 
  Award, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  Heart,
  Repeat,
  MessageCircle,
  UserPlus,
  Star,
  Coins,
  Wallet
} from 'lucide-react'
import { useEnhancedTwitterAuth } from '@/hooks/better/useEnhancedTwitterAuth'
import { toast } from 'sonner'
import { DashboardData } from '@/app/dashboard/page'

interface EngagementBreakdownItem {
  type: string
  count: number
  tokens: number
}

interface RecentActivityItem {
  id: string
  type: string
  tokens: number
  createdAt: string
  tweetId: string
}

interface EngagementData {
  totalEngagements: number
  todayEngagements: number
  weeklyEngagements: number
  monthlyEngagements: number
  activityLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  totalTokens?: number
  totalEarnedTokens?: number
  breakdown: EngagementBreakdownItem[]
  recentActivity: RecentActivityItem[]
}

interface UserData {
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

export default function TwitterIntegrationComponent() {
  const {
    session,
    authUser,
    isTwitterConnected,
    isLoading,
    hasError,
    error,
    user,
    engagementData,
    connectTwitter,
    disconnectTwitter,
    refreshTwitterData,
    checkEngagementRewards,
    isConnecting,
    isSyncing
  } = useEnhancedTwitterAuth()

  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')



/**
 * @description from dashboard data 
 */

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch main dashboard data with daily earning status
  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data and daily earning status in parallel
      const [dashboardRes, earningRes] = await Promise.all([
        fetch('/api/user/dashboard'),
        fetch('/api/earning/status').catch(() => null) // Don't fail if this endpoint doesn't exist yet
      ])
      
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        console.log('Dashboard data loaded:', dashboardData)
        
        // Add daily earning status if available
        if (earningRes?.ok) {
          const earningData = await earningRes.json()
          dashboardData.stats.dailyEarningStatus = earningData
        } else {
          // Fallback daily earning status
          dashboardData.stats.dailyEarningStatus = {
            canClaim: true,
            currentStreak: dashboardData.user.streak || 0,
            totalEarned: dashboardData.user.totalEarnedTokens || 0,
            nextClaimIn: 0
          }
        }
        
        setData(dashboardData)
      } else {
        console.error('Failed to fetch dashboard data:', dashboardRes.status)
        // Don't use fallback anymore - show error instead
        throw new Error('Failed to load dashboard')
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }











































  // Auto-refresh engagement data
  useEffect(() => {
    if (autoRefresh && isTwitterConnected) {
      const interval = setInterval(async () => {
        await checkEngagementRewards()
        setLastRefresh(new Date())
      }, 5 * 60 * 1000) // Every 5 minutes

      return () => clearInterval(interval)
    }
  }, [autoRefresh, isTwitterConnected, checkEngagementRewards])

  const handleConnect = async () => {
    const success = await connectTwitter()
    if (success) {
      toast.success('Twitter connected successfully!')
    }
  }

  const handleDisconnect = async () => {
    await disconnectTwitter()
    toast.success('Twitter disconnected')
  }

  const handleRefresh = async () => {
    await refreshTwitterData()
    setLastRefresh(new Date())
  }

  const handleCheckRewards = async () => {
    await checkEngagementRewards()
    setLastRefresh(new Date())
  }

  const getActivityLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-green-100 text-green-800 border-green-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityLevelTokens = (level: string) => {
    switch (level) {
      case 'HIGH': return '4,000'    // Based on schema comment
      case 'MEDIUM': return '3,500'  // Based on schema comment
      case 'LOW': return '3,000'     // Based on schema comment
      default: return '3,000'
    }
  }

  const getEngagementIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Heart className="w-4 h-4 text-red-500" />
      case 'RETWEET': return <Repeat className="w-4 h-4 text-green-500" />
      case 'COMMENT': return <MessageCircle className="w-4 h-4 text-blue-500" />
      case 'QUOTE': return <MessageCircle className="w-4 h-4 text-purple-500" />
      case 'FOLLOW': return <UserPlus className="w-4 h-4 text-indigo-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          <div>
            {error?.toString() || 'Failed to load Twitter authentication'}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Twitter Integration</h1>
        <p className="text-gray-600">Connect your Twitter account to earn tokens through social engagement</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-blue-500" />
            Twitter Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isTwitterConnected ? (
            <div className="text-center py-8">
              <Twitter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Twitter Account</h3>
              <p className="text-gray-600 mb-6">
                Link your Twitter to start earning tokens for likes, retweets, comments, and more!
              </p>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting || isLoading}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Twitter className="w-4 h-4 mr-2" />
                    Connect Twitter
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {/* <div className="flex items-center gap-4">
                  {user?.twitterImage && (
                    <img 
                      src={user.twitterImage} 
                      alt={user.twitterName || user.twitterUsername} 
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{user?.twitterName || 'Twitter User'}</h3>
                    <p className="text-gray-600">@{user?.twitterUsername}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {user?.twitterFollowers?.toLocaleString() || 0} followers
                      </span>
                      <Badge className={getActivityLevelColor(user?.twitterActivity || 'LOW')}>
                        {user?.twitterActivity || 'LOW'} Activity
                      </Badge>
                    </div>
                  </div>
                </div> */}
                
                <div className="flex items-center gap-2">
                  <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isSyncing}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={handleDisconnect} variant="destructive" size="sm">
                    <XCircle className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {/* Token Balance Display */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center mb-2">
                    <Coins className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">{data?.user?.totalEarnedTokens?.toFixed(2) || '0.00'}</div>
                  <div className="text-sm text-yellow-600">Claimable Tokens</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700">{data?.user?.totalEarnedTokens?.toFixed(2) || '0.00'}</div>
                  <div className="text-sm text-green-600">Lifetime Earned</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">#{user?.rank || 0}</div>
                  <div className="text-sm text-purple-700">Rank</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{data?.user.streak || 0}</div>
                  <div className="text-sm text-orange-700">Streak</div>
                </div>
              </div>

              {/* Activity Level Rewards */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Activity Level Rewards</h4>
                    <p className="text-sm text-blue-700">
                      Your {user?.twitterActivity || 'LOW'} activity level earns up to {getActivityLevelTokens(user?.twitterActivity || 'LOW')} tokens
                    </p>
                  </div>
                  <Badge className={getActivityLevelColor(user?.twitterActivity || 'LOW')}>
                    {user?.twitterActivity || 'LOW'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Analytics */}
  {/* Engagement Analytics */}
      {isTwitterConnected && engagementData && (
        <Tabs value={activeTab as any} onValueChange={()=>setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Engagement Overview
                </CardTitle>
                <CardDescription>Your Twitter engagement statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{engagementData.totalEngagements}</div>
                    <div className="text-sm text-gray-600">Total Engagements</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{engagementData.todayEngagements}</div>
                    <div className="text-sm text-gray-600">Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{engagementData.weeklyEngagements}</div>
                    <div className="text-sm text-gray-600">This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{engagementData.monthlyEngagements}</div>
                    <div className="text-sm text-gray-600">This Month</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getActivityLevelColor(engagementData.activityLevel)}>
                    {engagementData.activityLevel} Activity Level
                  </Badge>
                  <Button onClick={handleCheckRewards} variant="outline" size="sm">
                    <Award className="w-4 h-4 mr-2" />
                    Check for New Rewards
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Token Engagement Breakdown</CardTitle>
                <CardDescription>Tokens earned by engagement type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {engagementData.breakdown && engagementData.breakdown.length > 0 ? (
                    engagementData.breakdown.map((item: EngagementBreakdownItem, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getEngagementIcon(item.type)}
                          <div>
                            <div className="font-medium capitalize">{item.type.toLowerCase()}s</div>
                            <div className="text-sm text-gray-600">{item.count} engagements</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-600 flex items-center gap-1">
                            <Coins className="w-4 h-4" />
                            {item.tokens.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.count > 0 ? (item.tokens / item.count).toFixed(2) : '0.00'} per action
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No engagement data yet. Start interacting on Twitter to see your stats!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest Twitter engagements and token rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engagementData.recentActivity && engagementData.recentActivity.length > 0 ? (
                    engagementData.recentActivity.map((activity: RecentActivityItem, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getEngagementIcon(activity.type)}
                          <div>
                            <div className="font-medium capitalize">{activity.type.toLowerCase()}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(activity.createdAt).toLocaleDateString()} at{' '}
                              {new Date(activity.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-600 flex items-center gap-1">
                            <Coins className="w-4 h-4" />
                            +{activity.tokens.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Tweet: {activity.tweetId.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity. Your Twitter engagements will appear here!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Token Monitoring Settings
                </CardTitle>
                <CardDescription>Configure automatic engagement tracking and token rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Auto-refresh Rewards</h3>
                    <p className="text-sm text-gray-600">Automatically check for new engagement rewards every 5 minutes</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Enable</span>
                  </label>
                </div>

                {lastRefresh && (
                  <div className="text-sm text-gray-600">
                    Last refresh: {lastRefresh.toLocaleString()}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Monitoring Status</h4>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Activity Level</h4>
                    <Badge className={getActivityLevelColor(user?.twitterActivity || 'LOW')}>
                      {user?.twitterActivity || 'LOW'}
                    </Badge>
                  </div>
                </div>

                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertTitle>How token rewards work</AlertTitle>
                  <AlertDescription>
                    Our system automatically monitors your Twitter activity and awards tokens for:
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>Likes: 0.5 tokens each</li>
                      <li>Retweets: 1.0 token each</li>
                      <li>Comments: 0.8 tokens each</li>
                      <li>Quotes: 1.2 tokens each</li>
                      <li>New followers: 2.0 tokens each</li>
                    </ul>
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Activity Level Bonuses:</strong> HIGH ({getActivityLevelTokens('HIGH')} tokens), 
                        MEDIUM ({getActivityLevelTokens('MEDIUM')} tokens), LOW ({getActivityLevelTokens('LOW')} tokens)
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Token Earning Guide */}
      {isTwitterConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Maximize Your Token Earnings
            </CardTitle>
            <CardDescription>Tips to earn more tokens through Twitter engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>Like posts: <strong>0.5 tokens</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Repeat className="w-4 h-4 text-green-500" />
                    <span>Retweet: <strong>1.0 token</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>Comment: <strong>0.8 tokens</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4 text-purple-500" />
                    <span>Quote tweet: <strong>1.2 tokens</strong></span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Growth Activities</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    <span>Gain followers: <strong>2.0 tokens</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>High activity level: <strong>Up to {getActivityLevelTokens('HIGH')} tokens</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="w-4 h-4 text-green-500" />
                    <span>Consistent engagement: <strong>Activity bonuses</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}