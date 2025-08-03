import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, subDays, format } from 'date-fns'
import { ACTIVITY_TYPES } from '@/lib/constants'

export async function GET(req: NextRequest) {
  await requireAdmin(req)

  try {
    const today = startOfDay(new Date())
    const yesterday = subDays(today, 1)
    const weekAgo = subDays(today, 7)
    const monthAgo = subDays(today, 30)

    // Get comprehensive analytics
    const [
      userStats,
      pointsAnalytics,
      tokensAnalytics,
      activityAnalytics,
      claimsAnalytics,
      referralAnalytics,
      twitterAnalytics,
      recentActivity
    ] = await Promise.all([
      getUserStats(today, yesterday, weekAgo),
      getPointsAnalytics(today, yesterday, weekAgo, monthAgo),
      getTokensAnalytics(today, yesterday, weekAgo, monthAgo),
      getActivityAnalytics(today, weekAgo, monthAgo),
      getClaimsAnalytics(today, weekAgo, monthAgo),
      getReferralAnalytics(today, weekAgo, monthAgo),
      getTwitterAnalytics(today, weekAgo, monthAgo),
      getRecentActivity()
    ])

    // Calculate growth rates
    const userGrowthRate = userStats.yesterday > 0 
      ? ((userStats.today - userStats.yesterday) / userStats.yesterday) * 100 
      : 0

    const pointsGrowthRate = pointsAnalytics.yesterday > 0
      ? ((pointsAnalytics.today - pointsAnalytics.yesterday) / pointsAnalytics.yesterday) * 100
      : 0

    const tokensGrowthRate = tokensAnalytics.yesterday > 0
      ? ((tokensAnalytics.today - tokensAnalytics.yesterday) / tokensAnalytics.yesterday) * 100
      : 0

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: userStats.total,
        activeUsersToday: userStats.today,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        
        totalPointsDistributed: pointsAnalytics.total,
        pointsToday: pointsAnalytics.today,
        pointsGrowthRate: Math.round(pointsGrowthRate * 100) / 100,
        
        totalTokensDistributed: tokensAnalytics.total,
        tokensToday: tokensAnalytics.today,
        tokensGrowthRate: Math.round(tokensGrowthRate * 100) / 100,
        
        totalClaims: claimsAnalytics.total,
        totalClaimedValue: claimsAnalytics.totalValue,
        pendingClaims: claimsAnalytics.pending,
        
        totalReferrals: referralAnalytics.total,
        activeReferrals: referralAnalytics.active,
        referralTokens: referralAnalytics.totalTokens,
        
        twitterEngagements: twitterAnalytics.total,
        twitterTokens: twitterAnalytics.totalTokens
      },
      
      analytics: {
        users: userStats,
        points: pointsAnalytics,
        tokens: tokensAnalytics,
        activity: activityAnalytics,
        claims: claimsAnalytics,
        referrals: referralAnalytics,
        twitter: twitterAnalytics
      },
      
      recentActivity,
      
      trends: {
        userRegistrations: await getDailyTrend('user', 'createdAt', 30),
        pointsDistribution: await getDailyTrend('pointHistory', 'createdAt', 30, 'points'),
        tokensDistribution: await getDailyTrend('pointHistory', 'createdAt', 30, 'tokens'),
        claims: await getDailyTrend('claim', 'createdAt', 30, 'amount')
      },
      
      topUsers: await getTopUsers(),
      systemHealth: await getSystemHealth()
    })

  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Helper functions

async function getUserStats(today: Date, yesterday: Date, weekAgo: Date) {
  const [total, todayCount, yesterdayCount, weeklyCount, activeCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ 
      where: { 
        createdAt: { 
          gte: yesterday, 
          lt: today 
        } 
      } 
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { lastActivity: { gte: weekAgo } } })
  ])

  return {
    total,
    today: todayCount,
    yesterday: yesterdayCount,
    weekly: weeklyCount,
    active: activeCount
  }
}

async function getPointsAnalytics(today: Date, yesterday: Date, weekAgo: Date, monthAgo: Date) {
  const [totalPoints, todayPoints, yesterdayPoints, weeklyPoints, monthlyPoints] = await Promise.all([
    prisma.pointHistory.aggregate({
      where: { type: ACTIVITY_TYPES.POINTS, points: { gt: 0 } },
      _sum: { points: true },
      _count: true
    }),
    prisma.pointHistory.aggregate({
      where: { 
        type: ACTIVITY_TYPES.POINTS,
        points: { gt: 0 },
        createdAt: { gte: today } 
      },
      _sum: { points: true },
      _count: true
    }),
    prisma.pointHistory.aggregate({
      where: { 
        type: ACTIVITY_TYPES.POINTS,
        points: { gt: 0 },
        createdAt: { gte: yesterday, lt: today } 
      },
      _sum: { points: true },
      _count: true
    }),
    prisma.pointHistory.aggregate({
      where: { 
        type: ACTIVITY_TYPES.POINTS,
        points: { gt: 0 },
        createdAt: { gte: weekAgo } 
      },
      _sum: { points: true },
      _count: true
    }),
    prisma.pointHistory.aggregate({
      where: { 
        type: ACTIVITY_TYPES.POINTS,
        points: { gt: 0 },
        createdAt: { gte: monthAgo } 
      },
      _sum: { points: true },
      _count: true
    })
  ])

  return {
    total: totalPoints._sum.points || 0,
    totalTransactions: totalPoints._count,
    today: todayPoints._sum.points || 0,
    yesterday: yesterdayPoints._sum.points || 0,
    weekly: weeklyPoints._sum.points || 0,
    monthly: monthlyPoints._sum.points || 0,
    avgPerTransaction: totalPoints._count > 0 
      ? (totalPoints._sum.points || 0) / totalPoints._count 
      : 0
  }
}

async function getTokensAnalytics(today: Date, yesterday: Date, weekAgo: Date, monthAgo: Date) {
  const [totalTokens, todayTokens, yesterdayTokens, weeklyTokens, monthlyTokens, userBalances] = await Promise.all([
    prisma.pointHistory.aggregate({
      where: { type: ACTIVITY_TYPES.TOKENS, tokens: { gt: 0 } },
      _sum: { tokens: true },
      _count: true
    }),
    prisma.pointHistory.aggregate({
      where: { 
        type: ACTIVITY_TYPES.TOKENS,
        tokens: { gt: 0 },
        createdAt: { gte: today } 
      },
      _sum: { tokens: true },
      _count: true
    }),
    prisma.pointHistory.aggregate({
      where: { 
        type: ACTIVITY_TYPES.TOKENS,
        tokens: { gt: 0 },
        createdAt: { gte: yesterday, lt: today } 
      },
      _sum: { tokens: true },
      _count: true
    }),
    prisma.pointHistory.aggregate({
      where: { 
        type: ACTIVITY_TYPES.TOKENS,
        tokens: { gt: 0 },
        createdAt: { gte: weekAgo } 
      },
      _sum: { tokens: true },
      _count: true
    }),
    prisma.pointHistory.aggregate({
      where: { 
        type: ACTIVITY_TYPES.TOKENS,
        tokens: { gt: 0 },
        createdAt: { gte: monthAgo } 
      },
      _sum: { tokens: true },
      _count: true
    }),
    prisma.user.aggregate({
      _sum: { totalTokens: true, totalEarnedTokens: true },
      _avg: { totalTokens: true }
    })
  ])

  return {
    total: totalTokens._sum.tokens || 0,
    totalTransactions: totalTokens._count,
    today: todayTokens._sum.tokens || 0,
    yesterday: yesterdayTokens._sum.tokens || 0,
    weekly: weeklyTokens._sum.tokens || 0,
    monthly: monthlyTokens._sum.tokens || 0,
    currentUserBalance: userBalances._sum.totalTokens || 0,
    totalEarnedLifetime: userBalances._sum.totalEarnedTokens || 0,
    avgUserBalance: userBalances._avg.totalTokens || 0,
    avgPerTransaction: totalTokens._count > 0 
      ? (totalTokens._sum.tokens || 0) / totalTokens._count 
      : 0
  }
}

async function getActivityAnalytics(today: Date, weekAgo: Date, monthAgo: Date) {
  const [dailyCheckIns, taskCompletions, achievementUnlocks] = await Promise.all([
    prisma.pointHistory.count({
      where: { 
        action: 'DAILY_CHECK_IN',
        createdAt: { gte: today }
      }
    }),
    prisma.taskCompletion.count({
      where: { 
        completed: true,
        completedAt: { gte: weekAgo }
      }
    }),
    prisma.pointHistory.count({
      where: { 
        action: 'ACHIEVEMENT',
        createdAt: { gte: monthAgo }
      }
    })
  ])

  return {
    dailyCheckInsToday: dailyCheckIns,
    taskCompletionsWeek: taskCompletions,
    achievementUnlocksMonth: achievementUnlocks
  }
}

async function getClaimsAnalytics(today: Date, weekAgo: Date, monthAgo: Date) {
  const [total, pending, completed, failed, totalValue, todayClaims, weeklyClaims] = await Promise.all([
    prisma.claim.count(),
    prisma.claim.count({ where: { status: 'PENDING' } }),
    prisma.claim.count({ where: { status: 'COMPLETED' } }),
    prisma.claim.count({ where: { status: 'FAILED' } }),
    prisma.claim.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.claim.count({ where: { createdAt: { gte: today } } }),
    prisma.claim.count({ where: { createdAt: { gte: weekAgo } } })
  ])

  return {
    total,
    pending,
    completed,
    failed,
    totalValue: totalValue._sum.amount || 0,
    today: todayClaims,
    weekly: weeklyClaims,
    successRate: total > 0 ? (completed / total) * 100 : 0
  }
}

async function getReferralAnalytics(today: Date, weekAgo: Date, monthAgo: Date) {
  const [total, active, completed, totalTokens, todayReferrals, weeklyReferrals] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.count({ where: { isActive: true } }),
    prisma.referral.count({ where: { completed: true } }),
    prisma.referral.aggregate({
      where: { completed: true },
      _sum: { tokens: true }
    }),
    prisma.referral.count({ where: { createdAt: { gte: today } } }),
    prisma.referral.count({ where: { createdAt: { gte: weekAgo } } })
  ])

  return {
    total,
    active,
    completed,
    totalTokens: totalTokens._sum.tokens || 0,
    today: todayReferrals,
    weekly: weeklyReferrals,
    conversionRate: total > 0 ? (completed / total) * 100 : 0
  }
}

async function getTwitterAnalytics(today: Date, weekAgo: Date, monthAgo: Date) {
  const [total, totalTokens, todayEngagements, weeklyEngagements, byType] = await Promise.all([
    prisma.twitterEngagement.count(),
    prisma.twitterEngagement.aggregate({
      _sum: { tokens: true }
    }),
    prisma.twitterEngagement.count({ where: { createdAt: { gte: today } } }),
    prisma.twitterEngagement.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.twitterEngagement.groupBy({
      by: ['engagementType'],
      _count: true,
      _sum: { tokens: true }
    })
  ])

  return {
    total,
    totalTokens: totalTokens._sum.tokens || 0,
    today: todayEngagements,
    weekly: weeklyEngagements,
    byType: byType.map(item => ({
      type: item.engagementType,
      count: item._count,
      tokens: item._sum.tokens || 0
    }))
  }
}

async function getRecentActivity() {
  return await prisma.pointHistory.findMany({
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
}

async function getDailyTrend(table: string, dateField: string, days: number, sumField?: string) {
  // This would need to be implemented based on your specific database queries
  // For now, returning empty array
  return []
}

async function getTopUsers() {
  const [topByPoints, topByTokens, topByReferrals] = await Promise.all([
    prisma.user.findMany({
      take: 10,
      orderBy: { totalPoints: 'desc' },
      select: {
        walletAddress: true,
        twitterUsername: true,
        totalPoints: true,
        totalTokens: true,
        createdAt: true
      }
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { totalTokens: 'desc' },
      select: {
        walletAddress: true,
        twitterUsername: true,
        totalPoints: true,
        totalTokens: true,
        createdAt: true
      }
    }),
    prisma.user.findMany({
      take: 10,
    //   orderBy: { 
    //     referrals: { 
    //       _count: true 
    //     } 
    //   },
      select: {
        walletAddress: true,
        twitterUsername: true,
        totalPoints: true,
        totalTokens: true,
        _count: {
          select: {
            referrals: { where: { completed: true } }
          }
        }
      }
    })
  ])

  return {
    byPoints: topByPoints,
    byTokens: topByTokens,
    byReferrals: topByReferrals
  }
}

async function getSystemHealth() {
  const [errorCount, avgResponseTime, activeConnections] = await Promise.all([
    // These would be implemented based on your error tracking
    Promise.resolve(0),
    Promise.resolve(120),
    Promise.resolve(45)
  ])

  return {
    errorCount,
    avgResponseTime,
    activeConnections,
    status: errorCount < 10 ? 'healthy' : 'warning'
  }
}