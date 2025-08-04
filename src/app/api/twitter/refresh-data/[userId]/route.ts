import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { TwitterApi } from 'twitter-api-v2'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest
) {
  try {
    const requestUrl = new URL(req.url);
    const userId = requestUrl.searchParams.get("userId");
    const session = await getSession(req)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }


    // Verify user access
    if (session.user.id !== userId && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get user's Twitter data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { twitterId: true, twitterUsername: true }
    })

    if (!user?.twitterId) {
      return NextResponse.json(
        { error: 'Twitter account not connected' },
        { status: 400 }
      )
    }

    // Initialize Twitter client
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!)

    // Fetch updated user data from Twitter
    const twitterUser = await client.v2.userByUsername(user.twitterId, {
      'user.fields': ['public_metrics', 'verified', 'description', 'location']
    })

    if (!twitterUser.data) {
      return NextResponse.json(
        { error: 'Failed to fetch Twitter data' },
        { status: 400 }
      )
    }

    const metrics = twitterUser.data.public_metrics
    const followers = metrics?.followers_count || 0

    // Calculate new activity level
    const engagements = await prisma.twitterEngagement.count({
      where: {
        userId: userId as any,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })

    let activityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
    if (followers >= 10000 || engagements >= 100) {
      activityLevel = 'HIGH'
    } else if (followers >= 1000 || engagements >= 30) {
      activityLevel = 'MEDIUM'
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id as string },
      data: {
        twitterFollowers: followers,
        twitterActivity: activityLevel,
        twitterName: twitterUser.data.name,
      },
      select: {
        id: true,
        walletAddress: true,
        twitterId: true,
        twitterUsername: true,
        twitterName: true,
        twitterImage: true,
        twitterFollowers: true,
        twitterActivity: true,
        totalPoints: true,
        totalTokens: true, // Include token balance
        totalEarnedTokens: true, // Include lifetime earned tokens
        level: true,
        rank: true,
        streak: true,
        referralCode: true,
        isAdmin: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      refreshedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error refreshing Twitter data:', error)
    return NextResponse.json(
      { error: 'Failed to refresh Twitter data' },
      { status: 500 }
    )
  }
}
