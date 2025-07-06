import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [userCount, claimStats, engagementCount, totalPoints] = await Promise.all([
      prisma.user.count(),
      prisma.claim.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.twitterEngagement.count(),
      prisma.user.aggregate({
        _sum: { totalPoints: true },
      }),
    ])

    const totalRewards = claimStats._sum.amount || 0
    const totalPointsValue = totalPoints._sum.totalPoints || 0

    return NextResponse.json({
      totalUsers: userCount,
      totalRewards: totalRewards,
      totalEngagements: engagementCount,
      totalPoints: totalPointsValue,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}