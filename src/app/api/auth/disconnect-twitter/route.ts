// app/api/auth/disconnect-twitter/route.ts - Disconnect Twitter
// app/api/auth/sync-user/route.ts - Sync Better Auth with Existing User System
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth' // Your existing auth function




export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Clear Twitter data from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterId: null,
        twitterUsername: null,
        twitterName: null,
        twitterImage: null,
        twitterFollowers: null,
        twitterActivity: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect Twitter error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Twitter' },
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