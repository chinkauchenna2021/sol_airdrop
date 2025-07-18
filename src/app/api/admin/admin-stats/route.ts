import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get basic stats
    const [
      totalUsers,
      activeUsers,
      totalClaims,
      pendingClaims,
      totalEngagements,
      newUsersToday
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: 'PENDING' } }),
      prisma.twitterEngagement.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ])

    // Get total points and distributed amounts
    const [totalPointsResult, totalDistributedResult] = await Promise.all([
      prisma.user.aggregate({
        _sum: { totalPoints: true }
      }),
      prisma.claim.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      })
    ])

    // Get activity distribution
    const activityStats = await prisma.user.groupBy({
      by: ['twitterActivity'],
      _count: true,
      where: {
        twitterActivity: { not: null }
      }
    })

    const activityDistribution = activityStats.reduce((acc: any, stat: any) => {
      const activity = stat.twitterActivity || 'LOW'
      const tokensPerUser = activity === 'HIGH' ? 4000 
                          : activity === 'MEDIUM' ? 3500 
                          : 3000
      acc[activity.toLowerCase()] = {
        userCount: stat._count,
        tokensPerUser,
        totalTokens: stat._count * tokensPerUser
      }
      return acc
    }, {})

    // Get claim stats by status
    const claimStats = await prisma.claim.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true }
    })

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalPoints: totalPointsResult._sum.totalPoints || 0,
      totalClaims,
      pendingClaims,
      totalDistributed: totalDistributedResult._sum.amount || 0,
      totalEngagements,
      newUsersToday,
      activityDistribution,
      claimStats: claimStats.map((stat: any) => ({
        status: stat.status,
        count: stat._count,
        totalAmount: stat._sum.amount || 0
      }))
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
