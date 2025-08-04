import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Verify user access
    if (session.user.id !== userId && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get user's monitoring config
    const monitoringConfig = await prisma.systemConfig.findUnique({
      where: { key: `twitter_monitoring_${userId}` }
    })

    if (!monitoringConfig?.value) {
      return NextResponse.json(
        { error: 'Monitoring not enabled for this user' },
        { status: 400 }
      )
    }

    const config = monitoringConfig.value as any
    const lastCheck = new Date(config.lastCheck)
    const now = new Date()

    // Simulate finding new engagements (replace with actual Twitter API calls)
    const simulatedEngagements = [
      {
        tweetId: `${Date.now()}_1`,
        type: 'LIKE' as const,
        tokens: 0.5, // Token reward instead of points
        timestamp: now
      },
      {
        tweetId: `${Date.now()}_2`,
        type: 'RETWEET' as const,
        tokens: 1.0, // Token reward instead of points
        timestamp: now
      }
    ]

    const newRewards = []
    let totalNewTokens = 0

    for (const engagement of simulatedEngagements) {
      // Check if already processed
      const existing = await prisma.twitterEngagement.findUnique({
        where: {
          userId_tweetId_engagementType: {
            userId,
            tweetId: engagement.tweetId,
            engagementType: engagement.type
          }
        }
      })

      if (!existing) {
        // Create new engagement record with tokens
        await prisma.twitterEngagement.create({
          data: {
            userId,
            tweetId: engagement.tweetId,
            engagementType: engagement.type,
            tokens: engagement.tokens, // Store tokens instead of points
            verified: true
          }
        })

        // Award tokens in PointHistory
        await prisma.pointHistory.create({
          data: {
            userId,
            points: 0, // No points
            tokens: engagement.tokens, // Award tokens
            type: 'TOKENS',
            action: `TWITTER_${engagement.type}`,
            description: `${engagement.type.toLowerCase()} on Twitter`,
            metadata: {
              tweetId: engagement.tweetId,
              automated: true,
              checkTime: now.toISOString(),
              tokenAmount: engagement.tokens
            }
          }
        })

        // Update user token balance
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalTokens: { increment: engagement.tokens },
            totalEarnedTokens: { increment: engagement.tokens }
          }
        })

        newRewards.push({
          type: engagement.type,
          tokens: engagement.tokens,
          tweetId: engagement.tweetId
        })

        totalNewTokens += engagement.tokens
      }
    }

    // Update last check time
    await prisma.systemConfig.update({
      where: { key: `twitter_monitoring_${userId}` },
      data: {
        value: {
          ...config,
          lastCheck: now.toISOString()
        }
      }
    })

    return NextResponse.json({
      success: true,
      rewards: newRewards,
      newTokens: totalNewTokens, // Return tokens instead of points
      checkedAt: now.toISOString(),
      message: newRewards.length > 0 
        ? `Found ${newRewards.length} new engagements worth ${totalNewTokens.toFixed(2)} tokens!`
        : 'No new engagements found'
    })

  } catch (error) {
    console.error('❌ Error checking engagement rewards:', error)
    return NextResponse.json(
      { error: 'Failed to check engagement rewards' },
      { status: 500 }
    )
  }
}
