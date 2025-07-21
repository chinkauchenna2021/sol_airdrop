import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'

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
      activeUsers
    ] = await Promise.all([
      prisma.user.aggregate({
        _sum: { totalEarnedTokens: true }
      }),
      prisma.dailyEarning.count({
        where: { claimedAt: { gte: today } }
      }),
      prisma.user.count(),
      prisma.user.count({
        where: { lastLoginReward: { gte: subDays(new Date(), 7) } }
      })
    ])

    // Get streak data
    const streakData = await prisma.user.findMany({
      select: { streak: true },
      where: { streak: { gt: 0 } }
    })

    const averageStreak = streakData.length > 0 
      ? streakData.reduce((sum, user) => sum + user.streak, 0) / streakData.length 
      : 0

    const longestStreak = streakData.length > 0 
      ? Math.max(...streakData.map(user => user.streak))
      : 0

    // Get daily claim history
    const dailyClaimHistory = await prisma.dailyEarning.groupBy({
      by: ['claimedAt'],
      _count: { id: true },
      _sum: { tokens: true },
      where: {
        claimedAt: { gte: last30Days }
      },
      orderBy: { claimedAt: 'asc' }
    })

    const formattedHistory = dailyClaimHistory.map(day => ({
      date: startOfDay(day.claimedAt).toISOString().split('T')[0],
      claims: day._count.id,
      tokens: day._sum.tokens || 0
    }))

    // Get streak distribution
    const streakDistribution = [
      { days: '1-3', users: streakData.filter(u => u.streak >= 1 && u.streak <= 3).length },
      { days: '4-7', users: streakData.filter(u => u.streak >= 4 && u.streak <= 7).length },
      { days: '8-14', users: streakData.filter(u => u.streak >= 8 && u.streak <= 14).length },
      { days: '15-30', users: streakData.filter(u => u.streak >= 15 && u.streak <= 30).length },
      { days: '30+', users: streakData.filter(u => u.streak > 30).length }
    ]

    return NextResponse.json({
      totalDistributed: totalDistributed._sum.totalEarnedTokens || 0,
      claimsToday,
      activeUsers,
      totalUsers,
      averageStreak: Math.round(averageStreak),
      longestStreak,
      claimRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      streakDistribution,
      dailyClaimHistory: formattedHistory
    })

  } catch (error) {
    console.error('Error fetching earning stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
