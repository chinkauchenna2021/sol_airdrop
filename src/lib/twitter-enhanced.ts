import { TwitterApi } from 'twitter-api-v2'
import prisma from '@/lib/prisma'
import { subDays } from 'date-fns'
import { AIRDROP_CONFIG, ENHANCED_CONFIG } from './constants'

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
})

// Enhanced activity level calculation
export async function updateUserActivityLevel(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        engagements: {
          where: {
            createdAt: {
              gte: subDays(new Date(), 30) // Last 30 days
            }
          }
        }
      }
    })

    if (!user || !user.twitterId) return

    // Get fresh Twitter metrics
    const twitterUser = await twitterClient.v2.user(user.twitterId, {
      'user.fields': ['public_metrics']
    })

    const followers = twitterUser.data.public_metrics?.followers_count || 0
    const recentEngagements = user.engagements.length

    // Calculate engagement rate (engagements per day over last 30 days)
    const engagementRate = recentEngagements / 30

    // Get system thresholds
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['highActivityThreshold', 'mediumActivityThreshold', 'highEngagementRate', 'mediumEngagementRate']
        }
      }
    })

    const highFollowerThreshold = configs.find(c => c.key === 'highActivityThreshold')?.value as number || 1000
    const mediumFollowerThreshold = configs.find(c => c.key === 'mediumActivityThreshold')?.value as number || 500
    const highEngagementThreshold = configs.find(c => c.key === 'highEngagementRate')?.value as number || 2.0
    const mediumEngagementThreshold = configs.find(c => c.key === 'mediumEngagementRate')?.value as number || 1.0

    // Determine activity level based on both followers and engagement
    let activityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'

    if ((followers >= highFollowerThreshold) || (engagementRate >= highEngagementThreshold)) {
      activityLevel = 'HIGH'
    } else if ((followers >= mediumFollowerThreshold) || (engagementRate >= mediumEngagementThreshold)) {
      activityLevel = 'MEDIUM'
    }

    // Update user if activity level changed
    if (user.twitterActivity !== activityLevel || user.twitterFollowers !== followers) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          twitterActivity: activityLevel,
          twitterFollowers: followers,
          level: Math.floor((user.totalPoints + user.totalEarnedTokens) / 1000) + 1,
          updatedAt: new Date()
        }
      })

      console.log(`Updated user ${userId} activity level to ${activityLevel} (${followers} followers, ${engagementRate.toFixed(2)} eng/day)`)
    }

  } catch (error) {
    console.error('Error updating activity level:', error)
  }
}

// Enhanced engagement tracking
export async function trackEngagement(
  userId: string,
  tweetId: string,
  engagementType: 'LIKE' | 'RETWEET' | 'COMMENT' | 'FOLLOW',
  points: number
): Promise<boolean> {
  try {
    // Check if already tracked
    const existing = await prisma.twitterEngagement.findUnique({
      where: {
        userId_tweetId_engagementType: {
          userId,
          tweetId,
          engagementType,
        }
      }
    })

    if (existing) return false

    // Create engagement record
    await prisma.twitterEngagement.create({
      data: {
        userId,
        tweetId,
        engagementType,
        verified: true,
        createdAt: new Date()
      }
    })

    // Update user points
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: points },
        lastActivity: new Date()
      }
    })

    // Create point history record
    await prisma.pointHistory.create({
      data: {
        userId,
        points,
        action: `TWITTER_${engagementType}`,
        description: `Twitter ${engagementType.toLowerCase()} engagement`,
        metadata: { tweetId }
      }
    })

    // Update activity level after new engagement
    await updateUserActivityLevel(userId)

    return true

  } catch (error) {
    console.error('Error tracking engagement:', error)
    return false
  }
}

// Twitter webhook handler for real-time engagement tracking
export async function handleTwitterWebhook(webhookData: any): Promise<void> {
  try {
    const { user_id, tweet_id, event_type } = webhookData

    // Find user by Twitter ID
    const user = await prisma.user.findUnique({
      where: { twitterId: user_id }
    })

    if (!user) return

    // Map webhook events to engagement types
    const engagementMap = {
      'favorite': 'LIKE',
      'retweet': 'RETWEET', 
      'reply': 'COMMENT',
      'follow': 'FOLLOW'
    }

    const engagementType = engagementMap[event_type as keyof typeof engagementMap]
    if (!engagementType) return

    // Get points for this engagement type
    const pointsMap = {
      'LIKE': 10,
      'RETWEET': 20,
      'COMMENT': 15,
      'FOLLOW': 50
    }

    const points = pointsMap[engagementType as keyof typeof pointsMap]

    // Track the engagement
    await trackEngagement(user.id, tweet_id, engagementType as any, points)

    console.log(`Tracked ${engagementType} engagement for user ${user.id}`)

  } catch (error) {
    console.error('Webhook handling error:', error)
  }
}

// Enhanced Twitter callback handling
export async function handleTwitterCallback(
  oauth_token: string,
  oauth_verifier: string,
  userId: string
): Promise<boolean> {
  try {
    // Create temporary client for OAuth flow
    const tempClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: oauth_token,
      accessSecret: oauth_verifier,
    })

    // Get user info with enhanced metrics
    const twitterUser = await tempClient.v2.me({
      'user.fields': ['profile_image_url', 'username', 'name', 'id', 'public_metrics', 'created_at']
    })

    // Update user with enhanced Twitter data
    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterId: twitterUser.data.id,
        twitterUsername: twitterUser.data.username,
        twitterName: twitterUser.data.name,
        twitterImage: twitterUser.data.profile_image_url,
        twitterFollowers: twitterUser.data.public_metrics?.followers_count || 0,
      }
    })

    // Award connection bonus
    await prisma.dailyEarning.create({
      data: {
        userId,
        tokens: 50, // Twitter connection bonus
        type: 'TWITTER_CONNECT_BONUS',
        claimedAt: new Date(),
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalEarnedTokens: { increment: 50 }
      }
    })

    // Set initial activity level
    await updateUserActivityLevel(userId)

    return true
  } catch (error) {
    console.error('Twitter callback error:', error)
    return false
  }
}

// Batch update all user activity levels (for admin sync)
export async function batchUpdateActivityLevels(): Promise<{ updated: number, total: number }> {
  try {
    const twitterUsers = await prisma.user.findMany({
      where: {
        twitterId: { not: null }
      },
      select: { id: true }
    })

    let updated = 0

    for (const user of twitterUsers) {
      try {
        await updateUserActivityLevel(user.id)
        updated++
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Failed to update user ${user.id}:`, error)
      }
    }

    return { updated, total: twitterUsers.length }
  } catch (error) {
    console.error('Batch update error:', error)
    return { updated: 0, total: 0 }
  }
}

// Calculate engagement tier based on multiple factors
export function calculateEngagementTier(
  followers: number, 
  engagements: number, 
  accountAge: number,
  verifiedStatus: boolean = false
): 'HIGH' | 'MEDIUM' | 'LOW' {
  // Base score calculation
  let score = 0

  // Follower score (0-40 points)
  if (followers >= 10000) score += 40
  else if (followers >= 5000) score += 30
  else if (followers >= 1000) score += 20
  else if (followers >= 500) score += 10

  // Engagement score (0-30 points)
  const engagementRate = engagements / 30 // engagements per day
  if (engagementRate >= 3) score += 30
  else if (engagementRate >= 2) score += 20
  else if (engagementRate >= 1) score += 10

  // Account age bonus (0-20 points)
  const ageInDays = (Date.now() - accountAge) / (1000 * 60 * 60 * 24)
  if (ageInDays >= 365) score += 20
  else if (ageInDays >= 180) score += 15
  else if (ageInDays >= 90) score += 10
  else if (ageInDays >= 30) score += 5

  // Verified bonus
  if (verifiedStatus) score += 10

  // Determine tier based on total score
  if (score >= 70) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

// Monitor specific tweets for engagement
export async function monitorTweet(tweetId: string): Promise<void> {
  try {
    const tweet = await twitterClient.v2.singleTweet(tweetId, {
      'tweet.fields': ['public_metrics', 'author_id'],
      'user.fields': ['public_metrics']
    })

    // Store tweet analytics
    await prisma.twitterAnalytics.upsert({
      where: { tweetId },
      update: {
        likes: tweet.data.public_metrics?.like_count || 0,
        retweets: tweet.data.public_metrics?.retweet_count || 0,
        comments: tweet.data.public_metrics?.reply_count || 0,
        impressions: tweet.data.public_metrics?.impression_count || 0,
        engagement_rate: calculateEngagementRate(tweet.data.public_metrics || {}),
        calculatedAt: new Date()
      },
      create: {
        tweetId,
        likes: tweet.data.public_metrics?.like_count || 0,
        retweets: tweet.data.public_metrics?.retweet_count || 0,
        comments: tweet.data.public_metrics?.reply_count || 0,
        impressions: tweet.data.public_metrics?.impression_count || 0,
        engagement_rate: calculateEngagementRate(tweet.data.public_metrics || {}),
        calculatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Tweet monitoring error:', error)
  }
}

function calculateEngagementRate(metrics: any): number {
  const totalEngagements = (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0)
  const impressions = metrics.impression_count || 1
  return (totalEngagements / impressions) * 100
}