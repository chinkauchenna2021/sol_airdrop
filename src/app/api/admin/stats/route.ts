import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export const GET = requireAdmin(async (req: NextRequest) => {
  try {
    const today = startOfDay(new Date())

    const [
      totalUsers,
      activeUsers,
      totalPoints,
      claimStats,
      pendingClaims,
      totalEngagements,
      newUsersToday,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (engaged in last 7 days)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total points
      prisma.user.aggregate({
        _sum: { totalPoints: true }
      }),
      
      // Claim statistics
      prisma.claim.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true }
      }),
      
      // Pending claims count
      prisma.claim.count({
        where: { status: 'PENDING' }
      }),
      
      // Total engagements
      prisma.twitterEngagement.count(),
      
      // New users today
      prisma.user.count({
        where: {
          createdAt: { gte: today }
        }
      }),
    ])

    // Calculate total distributed tokens
    const completedClaims = claimStats.find(s => s.status === 'COMPLETED')
    const totalDistributed = completedClaims?._sum.amount || 0
    const totalClaims = claimStats.reduce((sum, stat) => sum + stat._count, 0)

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalPoints: totalPoints._sum.totalPoints || 0,
      totalClaims,
      pendingClaims,
      totalDistributed,
      totalEngagements,
      newUsersToday,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
})