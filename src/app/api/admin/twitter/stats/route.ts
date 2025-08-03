import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  await requireAdmin(req)

  try {
    // Get Twitter user counts by activity level
    const [totalTracked, highEngagement, mediumEngagement, lowEngagement] = await Promise.all([
      prisma.user.count({
        where: { twitterId: { not: null } }
      }),
      prisma.user.count({
        where: { twitterActivity: 'HIGH' }
      }),
      prisma.user.count({
        where: { twitterActivity: 'MEDIUM' }
      }),
      prisma.user.count({
        where: { twitterActivity: 'LOW' }
      })
    ])

    // Get recent Twitter activity
    const recentActivity = await prisma.twitterEngagement.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            walletAddress: true,
            twitterUsername: true
          }
        }
      }
    })

    return NextResponse.json({
      totalTracked,
      highEngagement,
      mediumEngagement, 
      lowEngagement,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        user: {
          walletAddress: activity.user.walletAddress,
          twitterUsername: activity.user.twitterUsername
        },
        engagementType: activity.engagementType,
        points: activity.tokens,
        createdAt: activity.createdAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error fetching Twitter stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
