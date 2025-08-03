import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { TOKENS_CONFIG, getTwitterTokenReward, ACTIVITY_TYPES } from '@/lib/constants'
import { EngagementType } from '@/app/generated/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tweetId, engagementType, verified = false } = await req.json()
    const userId = session.user.id

    // Validate engagement type
    const validTypes = ['LIKE', 'RETWEET', 'COMMENT', 'QUOTE', 'FOLLOW']
    if (!validTypes.includes(engagementType.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid engagement type' },
        { status: 400 }
      )
    }

    // Check if engagement already tracked
    const existingEngagement = await prisma.twitterEngagement.findUnique({
      where: {
        userId_tweetId_engagementType: {
          userId,
          tweetId,
          engagementType: engagementType.toUpperCase()
        }
      }
    })

    if (existingEngagement) {
      return NextResponse.json(
        { error: 'Engagement already tracked' },
        { status: 400 }
      )
    }

    // Calculate token reward (CHANGED: Now gives tokens instead of points)
    const tokenReward = getTwitterTokenReward(engagementType)

    // Create engagement record (UPDATED: Now tracks tokens)
    const engagement = await prisma.twitterEngagement.create({
      data: {
        userId,
        tweetId,
        engagementType: engagementType.toUpperCase(),
        tokens: tokenReward, // CHANGED: Now stores tokens instead of points
        verified
      }
    })

    // Update user's token balance (CHANGED: Updates totalTokens instead of totalPoints)
    await prisma.user.update({
      where: { id: userId },
      data: { 
        totalTokens: { increment: tokenReward },
        totalEarnedTokens: { increment: tokenReward } // Also update lifetime tokens
      }
    })

    // Record in activity history (UPDATED: Now tracks tokens)
    await prisma.pointHistory.create({
      data: {
        userId,
        points: 0, // No points awarded
        tokens: tokenReward, // CHANGED: Now tracks tokens
        type: ACTIVITY_TYPES.TOKENS, // CHANGED: Mark as token activity
        action: `TWITTER_${engagementType.toUpperCase()}`,
        description: `Twitter ${engagementType.toLowerCase()}: +${tokenReward} tokens`,
        metadata: {
          tweetId,
          engagementType,
          verified,
          tokenReward
        }
      }
    })

    return NextResponse.json({
      success: true,
      engagement: {
        id: engagement.id,
        type: engagementType,
        tokens: tokenReward, // CHANGED: Return tokens instead of points
        verified
      },
      message: `${engagementType} tracked! +${tokenReward} tokens earned.`
    })

  } catch (error) {
    console.error('Twitter engagement tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track engagement' },
      { status: 500 }
    )
  }
}

