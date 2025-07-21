import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, subDays, format } from 'date-fns'

export async function GET(req: NextRequest) {
  await requireAdmin(req)

  try {
    const today = startOfDay(new Date())
    const last30Days = subDays(today, 30)

    // Get basic stats
    const [
      totalDistributed,
      claimsToday,
      totalUsers,
      activeUsers,
      streakData
    ] = await Promise.all([
      prisma.user.aggregate({
        _sum: { totalEarnedTokens: true }
      }),
      prisma.dailyEarning.count({
        where: { claimedAt: { gte: today } }
      }),
      prisma.user.count(),
      prisma.user.count({
        where: { lastLoginReward: { gte: subDays(new Date(), 2) } }
      }),
      prisma.dailyEarning.groupBy({
        by: ['userId'],
        _count: { id: true },
        where: {
          claimedAt: { gte: subDays(new Date(), 30) }
        }
      })
    ])

    // Calculate averages and distributions
    const averageStreak = streakData.length > 0 
      ? streakData.reduce((sum, user) => sum + user._count.id, 0) / streakData.length 
      : 0

    const longestStreak = streakData.length > 0 
      ? Math.max(...streakData.map(user => user._count.id))
      : 0

    // Get daily claim history
    const dailyClaimHistory = await getDailyClaimHistory(last30Days)
    
    // Get streak distribution
    const streakDistribution = getStreakDistribution(streakData)

    return NextResponse.json({
      totalDistributed: totalDistributed._sum.totalEarnedTokens || 0,
      claimsToday,
      activeUsers,
      totalUsers,
      averageStreak: Math.round(averageStreak),
      longestStreak,
      claimRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      dailyClaimHistory,
      streakDistribution
    })
  } catch (error) {
    console.error('Earning stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earning stats' },
      { status: 500 }
    )
  }
}

async function getDailyClaimHistory(startDate: Date) {
  const claims = await prisma.dailyEarning.groupBy({
    by: ['claimedAt'],
    _count: { id: true },
    _sum: { tokens: true },
    where: {
      claimedAt: { gte: startDate }
    }
  })

  return claims.map(claim => ({
    date: format(new Date(claim.claimedAt), 'MMM dd'),
    claims: claim._count.id,
    tokens: claim._sum.tokens || 0
  }))
}

function getStreakDistribution(streakData: any[]) {
  const distribution = {
    '1-3 days': 0,
    '4-7 days': 0,
    '8-14 days': 0,
    '15+ days': 0
  }

  streakData.forEach(user => {
    const streak = user._count.id
    if (streak <= 3) distribution['1-3 days']++
    else if (streak <= 7) distribution['4-7 days']++
    else if (streak <= 14) distribution['8-14 days']++
    else distribution['15+ days']++
  })

  return Object.entries(distribution).map(([days, users]) => ({
    days,
    users
  }))
}
