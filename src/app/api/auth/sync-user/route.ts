// app/api/auth/sync-user/route.ts - Sync Better Auth with Existing User System
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth' // Your existing auth function

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, twitterData } = await req.json()

    if (!walletAddress || !twitterData) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      )
    }

    // Get better-auth session
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      return NextResponse.json(
        { error: 'No Twitter session found' },
        { status: 401 }
      )
    }

    // Find or create user in your existing system
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          walletAddress,
          twitterId: twitterData.id,
          twitterUsername: twitterData.username,
          twitterName: twitterData.name,
          twitterImage: twitterData.image,
          twitterFollowers: twitterData.followers_count || 0,
        },
      })

      // Award welcome bonus
      await prisma.pointHistory.create({
        data: {
          userId: user.id,
          points: 50,
          action: 'TWITTER_CONNECT',
          description: 'Connected Twitter account',
        },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { totalPoints: { increment: 50 } },
      })
    } else {
      // Update existing user with Twitter data
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          twitterId: twitterData.id,
          twitterUsername: twitterData.username,
          twitterName: twitterData.name,
          twitterImage: twitterData.image,
          twitterFollowers: twitterData.followers_count || user.twitterFollowers || 0,
        },
      })

      // Award points if this is first time connecting Twitter
      if (!user.twitterId) {
        await prisma.pointHistory.create({
          data: {
            userId: user.id,
            points: 50,
            action: 'TWITTER_CONNECT',
            description: 'Connected Twitter account',
          },
        })

        await prisma.user.update({
          where: { id: user.id },
          data: { totalPoints: { increment: 50 } },
        })
      }
    }

    // Update activity level based on Twitter data
    await updateUserActivityLevel(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        twitterUsername: user.twitterUsername,
        twitterId: user.twitterId,
        totalPoints: user.totalPoints,
        rank: await calculateUserRank(user.totalPoints),
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error('Sync user error:', error)
    return NextResponse.json(
      { error: 'Failed to sync user data' },
      { status: 500 }
    )
  }
}

// Helper functions
async function updateUserActivityLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      engagements: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      },
    },
  })

  if (!user) return

  const followers = user.twitterFollowers || 0
  const recentEngagements = user.engagements.length

  let activityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'

  if (followers >= 1000 || recentEngagements >= 50) {
    activityLevel = 'HIGH'
  } else if (followers >= 500 || recentEngagements >= 20) {
    activityLevel = 'MEDIUM'
  }

  if (user.twitterActivity !== activityLevel) {
    await prisma.user.update({
      where: { id: userId },
      data: { twitterActivity: activityLevel },
    })
  }
}

async function calculateUserRank(totalPoints: number): Promise<number> {
  const usersAhead = await prisma.user.count({
    where: { totalPoints: { gt: totalPoints } },
  })
  return usersAhead + 1
}