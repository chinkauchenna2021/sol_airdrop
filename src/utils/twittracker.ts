import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { TOKENS_CONFIG, getTwitterTokenReward, ACTIVITY_TYPES } from '@/lib/constants'
import { EngagementType } from '@/app/generated/prisma'
// Helper function to track engagement and award tokens
export async function trackEngagement(
  userId: string,
  tweetId: string,
  engagementType: string,
  customTokenAmount?: number
): Promise<boolean> {
  try {
    // Check if already tracked
    const existing = await prisma.twitterEngagement.findUnique({
      where: {
        userId_tweetId_engagementType: {
          userId,
          tweetId,
          engagementType: engagementType.toUpperCase() as EngagementType
        }
      }
    })

    if (existing) return false

    // Calculate token reward
    const tokenReward = customTokenAmount || getTwitterTokenReward(engagementType)

    // Create engagement and update balances in transaction
    await prisma.$transaction(async (tx) => {
      // Create engagement record
      await tx.twitterEngagement.create({
        data: {
          userId,
          tweetId,
          engagementType: engagementType.toUpperCase() as EngagementType,
          tokens: tokenReward,
          verified: true
        }
      })

      // Update user token balances
      await tx.user.update({
        where: { id: userId },
        data: {
          totalTokens: { increment: tokenReward },
          totalEarnedTokens: { increment: tokenReward }
        }
      })

      // Record in activity history
      await tx.pointHistory.create({
        data: {
          userId,
          points: 0,
          tokens: tokenReward,
          type: ACTIVITY_TYPES.TOKENS,
          action: `TWITTER_${engagementType.toUpperCase()}`,
          description: `Twitter ${engagementType.toLowerCase()}: +${tokenReward} tokens`,
          metadata: {
            tweetId,
            engagementType,
            tokenReward,
            verified: true
          }
        }
      })
    })

    return true
  } catch (error) {
    console.error('Track engagement error:', error)
    return false
  }
}