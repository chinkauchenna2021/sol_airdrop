import { TwitterApi } from 'twitter-api-v2'
import prisma from './prisma'

export async function getTwitterClient(userId: string): Promise<TwitterApi | null> {
  try {
    // Get user's Twitter tokens
    const tokenConfig = await prisma.systemConfig.findUnique({
      where: { key: `twitter_tokens_${userId}` }
    })

    if (!tokenConfig) return null

    const tokens = tokenConfig.value as any

    return new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: tokens.accessToken,
      accessSecret: tokens.accessSecret,
    })
  } catch (error) {
    console.error('Failed to get Twitter client:', error)
    return null
  }
}

export async function verifyEngagement(
  userId: string,
  tweetId: string,
  engagementType: 'LIKE' | 'RETWEET' | 'COMMENT'
): Promise<boolean> {
  try {
    const client = await getTwitterClient(userId)
    if (!client) return false

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twitterId: true }
    })

    if (!user?.twitterId) return false

    switch (engagementType) {
      case 'LIKE':
        const likes = await client.v2.tweetLikedBy(tweetId, { max_results: 100 })
        return likes.data?.some(u => u.id === user.twitterId) || false

      case 'RETWEET':
        const retweets = await client.v2.tweetRetweetedBy(tweetId, { max_results: 100 })
        return retweets.data?.some(u => u.id === user.twitterId) || false

      case 'COMMENT':
        // Search for replies from the user
        const replies = await client.v2.search({
          query: `conversation_id:${tweetId} from:${user.twitterId}`,
          max_results: 10,
        })
        return (replies.meta.result_count || 0) > 0

      default:
        return false
    }
  } catch (error) {
    console.error('Engagement verification error:', error)
    return false
  }
}

export async function verifyFollow(
  userId: string,
  targetUsername: string
): Promise<boolean> {
  try {
    const client = await getTwitterClient(userId)
    if (!client) return false

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twitterId: true }
    })

    if (!user?.twitterId) return false

    // Get target user
    const targetUser = await client.v2.userByUsername(targetUsername)
    if (!targetUser.data) return false

    // Check if following
    const following = await client.v2.following(user.twitterId, {
      max_results: 1000,
      'user.fields': ['id']
    })

    return following.data?.some(u => u.id === targetUser.data.id) || false
  } catch (error) {
    console.error('Follow verification error:', error)
    return false
  }
}

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
        points,
        verified: true,
      }
    })

    // Award points
    await prisma.pointHistory.create({
      data: {
        userId,
        points,
        action: `TWITTER_${engagementType}`,
        description: `${engagementType.toLowerCase()} on Twitter`,
        metadata: { tweetId }
      }
    })

    // Update user points
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: points }
      }
    })

    return true
  } catch (error) {
    console.error('Track engagement error:', error)
    return false
  }
}