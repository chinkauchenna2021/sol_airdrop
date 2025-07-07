// src/app/api/admin/stats/route.ts - REPLACE your existing file
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  // Check admin authentication
  const session = await getSession(req)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
      // ADD: Activity-based user distribution
      activityStats,
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

      // ADD: User distribution by activity level
      prisma.user.groupBy({
        by: ['twitterActivity'],
        _count: true,
        where: {
          twitterActivity: { not: null }
        }
      }),
    ])

    // Calculate total distributed tokens
    const completedClaims = claimStats.find((s: Prisma.PickEnumerable<Prisma.ClaimGroupByOutputType, "status"[]> & {
    _count: number;
    _sum: {
        amount: number | null;
    };
}) => s.status === 'COMPLETED')
    const totalDistributed = completedClaims?._sum.amount || 0
    const totalClaims = claimStats.reduce((sum, stat) => sum + stat._count, 0)

    // ENHANCE: Calculate activity-based token allocation
    const activityDistribution = activityStats.reduce((acc, stat) => {
      const activity = stat.twitterActivity || 'LOW'
      const tokensPerUser = activity === 'HIGH' ? 4000 : activity === 'MEDIUM' ? 3500 : 3000
      acc[activity.toLowerCase()] = {
        userCount: stat._count,
        tokensPerUser,
        totalTokens: stat._count * tokensPerUser
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalPoints: totalPoints._sum.totalPoints || 0,
      totalClaims,
      pendingClaims,
      totalDistributed,
      totalEngagements,
      newUsersToday,
      // ADD: Enhanced analytics
      activityDistribution,
      claimStats: claimStats.map(stat => ({
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