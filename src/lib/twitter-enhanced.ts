// lib/twitter-enhanced.ts - CREATE this new file
import { TwitterApi } from 'twitter-api-v2'
import prisma from '@/lib/prisma'
import { subDays } from 'date-fns'

// Enhanced Twitter activity monitoring
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

    if (!user) return

    // Calculate activity level based on followers and recent engagement
    const followers = user.twitterFollowers || 0
    const recentEngagements = user.engagements.length

    let activityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'

    // Get thresholds from system config
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['highActivityThreshold', 'mediumActivityThreshold']
        }
      }
    })

    const highThreshold = configs.find(c => c.key === 'highActivityThreshold')?.value as number || 1000
    const mediumThreshold = configs.find(c => c.key === 'mediumActivityThreshold')?.value as number || 500

    // Determine activity level (your requirement: HIGH=4000, MEDIUM=3500, LOW=3000 tokens)
    if (followers >= highThreshold || recentEngagements >= 50) {
      activityLevel = 'HIGH'
    } else if (followers >= mediumThreshold || recentEngagements >= 20) {
      activityLevel = 'MEDIUM'
    }

    // Update user's activity level only if it changed
    if (user.twitterActivity !== activityLevel) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          twitterActivity: activityLevel,
          level: Math.floor(user.totalPoints / 1000) + 1, // Update level based on points
          updatedAt: new Date()
        }
      })

      console.log(`Updated user ${userId} activity level to ${activityLevel}`)
    }
  } catch (error) {
    console.error('Error updating activity level:', error)
  }
}

// Enhanced engagement tracking with activity level updates
export async function trackEngagement(
  userId: string,
  tweetId: string,
  engagementType: 'LIKE' | 'RETWEET' | 'COMMENT' | 'FOLLOW',
  points: number
): Promise<boolean> {
  try {
    // Check if already tracked (preserving your existing logic)
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

    // Create engagement record (preserving your existing structure)
    await prisma.twitterEngagement.create({
      data: {
        userId,
        tweetId,
        engagementType,
        points,
        verified: true,
      }
    })

    // Award points (preserving your existing structure)
    await prisma.pointHistory.create({
      data: {
        userId,
        points,
        action: `TWITTER_${engagementType}`,
        description: `${engagementType.toLowerCase()} on Twitter`,
        metadata: { tweetId, source: 'twitter' }
      }
    })

    // Update user points (preserving your existing structure)
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: points }
      }
    })

    // NEW: Update activity level after engagement
    await updateUserActivityLevel(userId)

    return true
  } catch (error) {
    console.error('Track engagement error:', error)
    return false
  }
}

// Get token allocation based on activity level (your main requirement)
export function getTokenAllocationForUser(activityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null): number {
  switch (activityLevel) {
    case 'HIGH': return 4000
    case 'MEDIUM': return 3500
    case 'LOW': return 3000
    default: return 3000
  }
}

// Update Twitter follower count from API
export async function updateTwitterFollowerCount(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user?.twitterId) return

    // Get user metrics from Twitter API
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!)
    
    const twitterUser = await client.v2.user(user.twitterId, {
      'user.fields': ['public_metrics']
    })

    const followerCount = twitterUser.data.public_metrics?.followers_count || 0

    // Update user's follower count if it changed significantly
    const currentFollowers = user.twitterFollowers || 0
    const followerDifference = Math.abs(followerCount - currentFollowers)
    const percentageChange = currentFollowers > 0 ? (followerDifference / currentFollowers) * 100 : 100

    if (followerDifference > 100 || percentageChange > 10) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          twitterFollowers: followerCount,
          updatedAt: new Date()
        }
      })

      // Also update activity level based on new follower count
      await updateUserActivityLevel(userId)

      console.log(`Updated follower count for user ${userId}: ${currentFollowers} → ${followerCount}`)
    }
  } catch (error) {
    console.error('Error updating follower count:', error)
  }
}

// Enhanced Twitter callback handling (builds on your existing logic)
export async function handleTwitterCallback(
  oauth_token: string,
  oauth_verifier: string,
  userId: string
): Promise<boolean> {
  try {
    // Your existing Twitter OAuth flow...
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: oauth_token,
      accessSecret: process.env.TWITTER_API_SECRET!, // This should be the token secret from your flow
    })

    // Get user info with enhanced metrics
    const twitterUser = await client.v2.me({
      'user.fields': ['profile_image_url', 'username', 'name', 'id', 'public_metrics']
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

    // Set initial activity level
    await updateUserActivityLevel(userId)

    return true
  } catch (error) {
    console.error('Twitter callback error:', error)
    return false
  }
}

// Batch function to update all users' activity levels (for background jobs)
export async function updateAllUsersActivityLevels(): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: {
        twitterId: { not: null }
      },
      select: { id: true, twitterId: true }
    })

    console.log(`Updating activity levels for ${users.length} users...`)

    for (const user of users) {
      try {
        await updateTwitterFollowerCount(user.id)
        await updateUserActivityLevel(user.id)
        
        // Rate limiting - wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error updating user ${user.id}:`, error)
        continue
      }
    }

    console.log('Finished updating all user activity levels')
  } catch (error) {
    console.error('Error in batch update:', error)
  }
}