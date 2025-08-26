// lib/twitter-monitor-enhanced.ts - Updated for Token-Based Rewards
import { TwitterApi, TwitterApiReadWrite } from 'twitter-api-v2'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/better-auth-enhanced'

interface EngagementActivity {
  tweetId: string
  type: 'LIKE' | 'RETWEET' | 'COMMENT' | 'QUOTE' | 'FOLLOW'
  userId: string
  tokens: number
  metadata?: any
}

interface MonitoringConfig {
  enabled: boolean
  userId: string
  twitterId: string
  username: string
  lastCheck: string
  checkInterval: number
  engagementTracking: boolean
  activityScoring: boolean
  rewardType: 'TOKENS'
  baselineFollowers: number
}

// Token rewards for different engagement types
const ENGAGEMENT_TOKEN_REWARDS = {
  LIKE: 0.5,      // 0.5 tokens per like
  RETWEET: 1.0,   // 1.0 token per retweet
  COMMENT: 0.8,   // 0.8 tokens per comment
  QUOTE: 1.2,     // 1.2 tokens per quote
  FOLLOW: 2.0,    // 2.0 tokens per new follower
}

class EnhancedTwitterMonitor {
  private client: TwitterApiReadWrite
  private bearerClient: TwitterApi
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    // Initialize Twitter clients
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY as string,
      appSecret: process.env.TWITTER_API_SECRET as string,
      accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET as string,
    })

    this.bearerClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN as string)
  }

  /**
   * Start monitoring for all active users
   */
  async startGlobalMonitoring(): Promise<void> {
    try {
      console.log('🚀 Starting enhanced Twitter monitoring with token rewards...')

      // Get all users with Twitter monitoring enabled
      const monitoringConfigs = await this.getActiveMonitoringConfigs()
      
      console.log(`📊 Found ${monitoringConfigs.length} users to monitor`)

      for (const config of monitoringConfigs) {
        await this.startUserMonitoring(config)
      }

      // Setup periodic cleanup and optimization
      this.setupPeriodicTasks()

    } catch (error) {
      console.error('❌ Error starting global monitoring:', error)
    }
  }

  /**
   * Start monitoring for a specific user
   */
  async startUserMonitoring(config: MonitoringConfig): Promise<void> {
    if (!config.enabled) return

    try {
      console.log(`🐦 Starting token-based monitoring for @${config.username} (${config.userId})`)

      // Clear existing interval if any
      const existingInterval = this.monitoringIntervals.get(config.userId)
      if (existingInterval) {
        clearInterval(existingInterval)
      }

      // Start monitoring interval
      const interval = setInterval(async () => {
        await this.checkUserActivity(config)
      }, config.checkInterval)

      this.monitoringIntervals.set(config.userId, interval)

      // Run initial check
      await this.checkUserActivity(config)

    } catch (error) {
      console.error(`❌ Error starting monitoring for user ${config.userId}:`, error)
    }
  }

  /**
   * Check Twitter activity for a user and award tokens
   */
  async checkUserActivity(config: MonitoringConfig): Promise<void> {
    try {
      console.log(`🔍 Checking activity for @${config.username}`)

      const lastCheck = new Date(config.lastCheck)
      const now = new Date()

      // Get user's recent activity
      const activities = await this.fetchUserActivities(config.twitterId, lastCheck)
      
      if (activities.length > 0) {
        console.log(`📈 Found ${activities.length} new activities for @${config.username}`)
        
        // Process each activity
        for (const activity of activities) {
          activity.userId = config.userId // Set the userId
          await this.processEngagement(activity)
        }

        // Update user's follower count and activity level
        await this.updateUserMetrics(config.userId, config.twitterId)
      }

      // Update last check time
      await this.updateMonitoringConfig(config.userId, { lastCheck: now.toISOString() })

    } catch (error) {
      console.error(`❌ Error checking activity for user ${config.userId}:`, error)
      
      // Log error but don't stop monitoring
      await this.logMonitoringError(config.userId, error)
    }
  }

  /**
   * Fetch user activities from Twitter API
   */
  private async fetchUserActivities(twitterId: string, since: Date): Promise<EngagementActivity[]> {
    const activities: EngagementActivity[] = []

    try {
      // Get user's recent tweets
      const tweets = await this.bearerClient.v2.userTimeline(twitterId, {
        max_results: 50,
        'tweet.fields': ['created_at', 'public_metrics', 'referenced_tweets'],
        start_time: since.toISOString(),
      })

      // Process tweets for engagements
      for (const tweet of (tweets.data?.data || [])) {
        // Check for retweets
        if (tweet.referenced_tweets?.some((ref: { type: string }) => ref.type === 'retweeted')) {
          activities.push({
            tweetId: tweet.id,
            type: 'RETWEET',
            userId: '', // Will be filled by caller
            tokens: this.getTokensForEngagement('RETWEET'),
            metadata: {
              metrics: tweet.public_metrics,
              createdAt: tweet.created_at,
            },
          })
        }

        // Check for quotes
        if (tweet.referenced_tweets?.some((ref: { type: string }) => ref.type === 'quoted')) {
          activities.push({
            tweetId: tweet.id,
            type: 'QUOTE',
            userId: '',
            tokens: this.getTokensForEngagement('QUOTE'),
            metadata: {
              metrics: tweet.public_metrics,
              createdAt: tweet.created_at,
            },
          })
        }

        // Check for replies
        if (tweet.referenced_tweets?.some((ref: { type: string }) => ref.type === 'replied_to')) {
          activities.push({
            tweetId: tweet.id,
            type: 'COMMENT',
            userId: '',
            tokens: this.getTokensForEngagement('COMMENT'),
            metadata: {
              metrics: tweet.public_metrics,
              createdAt: tweet.created_at,
            },
          })
        }
      }

      // Note: Likes are harder to track with v2 API without user context
      // Would need additional endpoints or webhooks for comprehensive like tracking

    } catch (error) {
      console.error('❌ Error fetching user activities:', error)
    }

    return activities
  }

  /**
   * Process an engagement and award tokens
   */
  async processEngagement(activity: EngagementActivity): Promise<void> {
    try {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: activity.userId },
      })

      if (!user) return

      // Check if engagement already processed
      const existing = await prisma.twitterEngagement.findUnique({
        where: {
          userId_tweetId_engagementType: {
            userId: activity.userId,
            tweetId: activity.tweetId,
            engagementType: activity.type,
          },
        },
      })

      if (existing) return // Already processed

      // Create engagement record with tokens
      await prisma.twitterEngagement.create({
        data: {
          userId: activity.userId,
          tweetId: activity.tweetId,
          engagementType: activity.type,
          tokens: activity.tokens,
          verified: true,
        },
      })

      // Award tokens in PointHistory
      await prisma.pointHistory.create({
        data: {
          userId: activity.userId,
          points: 0, // No points, only tokens
          tokens: activity.tokens,
          type: 'TOKENS',
          action: `TWITTER_${activity.type}`,
          description: `${activity.type.toLowerCase()} on Twitter`,
          metadata: {
            tweetId: activity.tweetId,
            engagementType: activity.type,
            automated: true,
            tokenAmount: activity.tokens,
            ...activity.metadata,
          },
        },
      })

      // Update user token balance
      await prisma.user.update({
        where: { id: activity.userId },
        data: {
          totalTokens: { increment: activity.tokens },
          totalEarnedTokens: { increment: activity.tokens },
        },
      })

      console.log(`✅ Awarded ${activity.tokens} tokens to user ${activity.userId} for ${activity.type}`)

    } catch (error) {
      console.error('❌ Error processing engagement:', error)
    }
  }

  /**
   * Update user metrics (followers, activity level)
   */
  async updateUserMetrics(userId: string, twitterId: string): Promise<void> {
    try {
      // Get current Twitter metrics
      const user = await this.bearerClient.v2.userByUsername(twitterId, {
        'user.fields': ['public_metrics', 'verified'],
      })

      if (!user.data) return

      const metrics = user.data.public_metrics
      const followers = metrics?.followers_count || 0

      // Get user's engagement history for activity calculation
      const engagements = await prisma.twitterEngagement.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      })

      // Calculate activity level
      const activityLevel = this.calculateActivityLevel(followers, engagements, user.data.verified || false)

      // Update user in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          twitterFollowers: followers,
          twitterActivity: activityLevel,
        },
      })

      console.log(`📊 Updated metrics for user ${userId}: ${followers} followers, ${activityLevel} activity`)

      // Award bonus tokens if activity level increased
      await this.checkActivityLevelBonus(userId, activityLevel)

    } catch (error) {
      console.error('❌ Error updating user metrics:', error)
    }
  }

  /**
   * Check and award activity level bonus tokens
   */
  private async checkActivityLevelBonus(userId: string, newActivityLevel: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<void> {
    try {
      // Get user's previous activity level from recent history
      const recentBonus = await prisma.pointHistory.findFirst({
        where: {
          userId,
          action: 'ACTIVITY_LEVEL_BONUS',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Award bonus if activity level improved or it's been a week
      if (!recentBonus || (recentBonus.metadata as any)?.activityLevel !== newActivityLevel) {
        const bonusTokens = this.getActivityLevelBonusTokens(newActivityLevel)
        
        if (bonusTokens > 0) {
          await prisma.pointHistory.create({
            data: {
              userId,
              points: 0,
              tokens: bonusTokens,
              type: 'TOKENS',
              action: 'ACTIVITY_LEVEL_BONUS',
              description: `${newActivityLevel} activity level bonus`,
              metadata: {
                activityLevel: newActivityLevel,
                bonusAmount: bonusTokens,
                automated: true,
              },
            },
          })

          await prisma.user.update({
            where: { id: userId },
            data: {
              totalTokens: { increment: bonusTokens },
              totalEarnedTokens: { increment: bonusTokens },
            },
          })

          console.log(`🎁 Awarded ${bonusTokens} activity bonus tokens to user ${userId}`)
        }
      }
    } catch (error) {
      console.error('❌ Error checking activity level bonus:', error)
    }
  }

  /**
   * Get activity level bonus tokens
   */
  private getActivityLevelBonusTokens(activityLevel: 'HIGH' | 'MEDIUM' | 'LOW'): number {
    const bonuses = {
      HIGH: 25.0,    // High activity bonus
      MEDIUM: 15.0,  // Medium activity bonus
      LOW: 5.0       // Low activity bonus
    }
    return bonuses[activityLevel] || 0
  }

  /**
   * Calculate activity level based on metrics
   */
  private calculateActivityLevel(followers: number, recentEngagements: number, verified: boolean): 'HIGH' | 'MEDIUM' | 'LOW' {
    let score = 0

    // Follower scoring
    if (followers >= 10000) score += 40
    else if (followers >= 5000) score += 30
    else if (followers >= 1000) score += 20
    else if (followers >= 500) score += 10

    // Engagement scoring
    if (recentEngagements >= 100) score += 30
    else if (recentEngagements >= 50) score += 20
    else if (recentEngagements >= 20) score += 10

    // Verified bonus
    if (verified) score += 15

    if (score >= 60) return 'HIGH'
    if (score >= 30) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Get tokens for engagement type
   */
  private getTokensForEngagement(type: EngagementActivity['type']): number {
    return ENGAGEMENT_TOKEN_REWARDS[type] || 0
  }

  /**
   * Get active monitoring configurations
   */
  private async getActiveMonitoringConfigs(): Promise<MonitoringConfig[]> {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: 'twitter_monitoring_' },
      },
    })

    return configs
      .map(config => config.value as unknown as MonitoringConfig)
      .filter(config => config.enabled)
  }

  /**
   * Update monitoring configuration
   */
  private async updateMonitoringConfig(userId: string, updates: Partial<MonitoringConfig>): Promise<void> {
    const existing = await prisma.systemConfig.findUnique({
      where: { key: `twitter_monitoring_${userId}` }
    })

    if (existing) {
      await prisma.systemConfig.update({
        where: { key: `twitter_monitoring_${userId}` },
        data: {
          value: { ...(typeof existing.value === 'object' && existing.value !== null ? existing.value : {}), ...(typeof updates === 'object' && updates !== null ? updates : {}) },
          updatedAt: new Date(),
        },
      })
    }
  }

  /**
   * Log monitoring error
   */
  private async logMonitoringError(userId: string, error: any): Promise<void> {
    await prisma.systemConfig.create({
      data: {
        key: `monitoring_error_${userId}_${Date.now()}`,
        value: {
          userId,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
        description: 'Twitter monitoring error log',
      },
    }).catch(console.error)
  }

  /**
   * Setup periodic maintenance tasks
   */
  private setupPeriodicTasks(): void {
    // Cleanup old monitoring logs every hour
    setInterval(async () => {
      try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        
        await prisma.systemConfig.deleteMany({
          where: {
            key: { startsWith: 'monitoring_error_' },
            updatedAt: { lt: cutoff },
          },
        })
      } catch (error) {
        console.error('❌ Error cleaning up monitoring logs:', error)
      }
    }, 60 * 60 * 1000) // Every hour

    // Update leaderboard every 10 minutes
    setInterval(async () => {
      await this.updateLeaderboardRankings()
    }, 10 * 60 * 1000) // Every 10 minutes

    console.log('🔧 Periodic maintenance tasks setup complete')
  }

  /**
   * Update leaderboard rankings based on total tokens
   */
  private async updateLeaderboardRankings(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { totalTokens: 'desc' },
        select: { id: true, totalTokens: true },
      })

      // Update ranks in batches
      const batchSize = 100
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize)
        
        await Promise.all(
          batch.map((user, index) =>
            prisma.user.update({
              where: { id: user.id },
              data: { rank: i + index + 1 },
            })
          )
        )
      }

      console.log(`📊 Updated token-based rankings for ${users.length} users`)
    } catch (error) {
      console.error('❌ Error updating leaderboard rankings:', error)
    }
  }

  /**
   * Stop monitoring for a user
   */
  async stopUserMonitoring(userId: string): Promise<void> {
    const interval = this.monitoringIntervals.get(userId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(userId)
      console.log(`⏹️ Stopped monitoring for user ${userId}`)
    }

    // Disable monitoring config
    await this.updateMonitoringConfig(userId, { enabled: false })
  }

  /**
   * Stop all monitoring
   */
  async stopAllMonitoring(): Promise<void> {
    console.log('⏹️ Stopping all Twitter monitoring...')
    
    for (const [userId, interval] of Array.from(this.monitoringIntervals)) {
      clearInterval(interval)
    }
    
    this.monitoringIntervals.clear()
    console.log('✅ All monitoring stopped')
  }
}

// Create singleton instance
export const twitterMonitor = new EnhancedTwitterMonitor()

// API endpoints for monitoring control
export async function startMonitoringForUser(userId: string): Promise<boolean> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: `twitter_monitoring_${userId}` },
    })

    if (config?.value) {
      await twitterMonitor.startUserMonitoring(config.value as unknown as MonitoringConfig)
      return true
    }
    return false
  } catch (error) {
    console.error('❌ Error starting monitoring for user:', error)
    return false
  }
}

export async function stopMonitoringForUser(userId: string): Promise<boolean> {
  try {
    await twitterMonitor.stopUserMonitoring(userId)
    return true
  } catch (error) {
    console.error('❌ Error stopping monitoring for user:', error)
    return false
  }
}