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

    // Fetch user with additional data - enhanced from your existing version
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
    


 const userAchievements = await prisma.userAchievement.findMany({
  where: { userId: user.id },
  include: {
    achievement: {
      select: {
        id: true,
        name: true,
        description: true,
        icon: true
      }
    }
  }
})

    // Calculate stats - enhanced calculations
    const [todayPoints, weeklyPoints, recentActivity, referralData, totalEarned] = await Promise.all([
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
      
      // Recent activity - enhanced with more details
      prisma.pointHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          points: true,
          description: true,
          createdAt: true,
          metadata: true
        }
      }),

      // Referral data
      prisma.referral.findMany({
        where: { referrerId: user.id },
        include: {
          referred: {
            select: {
              walletAddress: true,
              twitterUsername: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Total earned from referrals
      prisma.referral.aggregate({
        where: { 
          referrerId: user.id,
          completed: true 
        },
        _sum: { points: true }
      })
    ])

    // Get user rank - enhanced calculation
    const usersAhead = await prisma.user.count({
      where: {
        totalPoints: { gt: user.totalPoints }
      }
    })
    const rank = usersAhead + 1

    // Calculate Twitter activity level and token allocation
    const twitterActivityLevel = user.twitterActivity || 'LOW'
    const tokenAllocation = getTokenAllocation(twitterActivityLevel)

    // Calculate streak
    const streak = await calculateStreak(user.id)

    // Enhanced response with referral data
    const response = {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        totalPoints: user.totalPoints,
        rank,
        twitterUsername: user.twitterUsername,
        twitterId: user.twitterId,
        twitterImage: user.twitterImage,
        twitterFollowers: user.twitterFollowers || 0,
        level: Math.floor(user.totalPoints / 1000) + 1,
        twitterActivity: twitterActivityLevel,
        streak: streak,
        referralCode: user.referralCode
      },
      stats: {
        todayPoints: todayPoints._sum.points || 0,
        weeklyPoints: weeklyPoints._sum.points || 0,
        totalEngagements: user._count.engagements,
        referralCount: user._count.referrals,
        tokenAllocation: tokenAllocation
      },
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        action: activity.description || activity.action,
        points: activity.points,
        createdAt: activity.createdAt.toISOString(),
        metadata: activity.metadata
      })),
      userAchievements, // Placeholder for achievements
      referrals: {
        totalReferrals: referralData.length,
        activeReferrals: referralData.filter(r => r.completed && r.referred.isActive).length,
        totalEarned: totalEarned._sum.points || 0,
        recentReferrals: referralData.map(r => ({
          id: r.id,
          walletAddress: r.referred.walletAddress,
          twitterUsername: r.referred.twitterUsername,
          points: r.points,
          completed: r.completed,
          createdAt: r.createdAt.toISOString()
        }))
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// Helper functions
function getTokenAllocation(activityLevel: string): number {
  switch (activityLevel) {
    case 'HIGH': return 4000
    case 'MEDIUM': return 3500
    case 'LOW': return 3000
    default: return 3000
  }
}

async function calculateStreak(userId: string): Promise<number> {
  try {
    const recentDays = await prisma.pointHistory.findMany({
      where: {
        userId,
        action: 'DAILY_CHECK_IN',
        createdAt: {
          gte: subDays(new Date(), 30)
        }
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })

    // Calculate consecutive days
    let streak = 0
    let currentDate = startOfDay(new Date())
    
    const activityDates = new Set(
      recentDays.map((day: any) => startOfDay(day.createdAt).getTime())
    )

    while (activityDates.has(currentDate.getTime())) {
      streak++
      currentDate = subDays(currentDate, 1)
    }

    return streak
  } catch (error) {
    console.error('Error calculating streak:', error)
    return 0
  }
}