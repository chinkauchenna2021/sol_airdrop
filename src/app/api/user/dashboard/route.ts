import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, startOfWeek, subDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = startOfDay(new Date())
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

    // Fetch user with additional data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: {
            engagements: true,
            referrals: {
              where: { completed: true }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate stats
    const [todayPoints, weeklyPoints, recentActivity] = await Promise.all([
      // Today's points
      prisma.pointHistory.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: today }
        },
        _sum: { points: true }
      }),
      
      // This week's points
      prisma.pointHistory.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart }
        },
        _sum: { points: true }
      }),
      
      // Recent activity
      prisma.pointHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          points: true,
          createdAt: true
        }
      })
    ])

    // Get user rank
    const usersAhead = await prisma.user.count({
      where: {
        totalPoints: { gt: user.totalPoints }
      }
    })
    const rank = usersAhead + 1

    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        totalPoints: user.totalPoints,
        rank,
        twitterUsername: user.twitterUsername,
        twitterId: user.twitterId,
      },
      stats: {
        todayPoints: todayPoints._sum.points || 0,
        weeklyPoints: weeklyPoints._sum.points || 0,
        totalEngagements: user._count.engagements,
        referralCount: user._count.referrals,
      },
      recentActivity
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}