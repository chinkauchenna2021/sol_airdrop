// app/api/user/dashboard/route.ts - Enhanced version of your existing API
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

    // Calculate stats - enhanced calculations
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
      })
    ])

    // Get user rank - enhanced calculation
    const usersAhead = await prisma.user.count({
      where: {
        totalPoints: { gt: user.totalPoints }
      }
    })
    const rank = usersAhead + 1

    // ADD: Calculate Twitter activity level and token allocation
    const twitterActivityLevel = await calculateTwitterActivityLevel(user)
    const tokenAllocation = getTokenAllocation(twitterActivityLevel, user.twitterFollowers || 0)

    // ADD: Get achievements if they exist
    const achievements = await getUserAchievements(user.id)

    // Enhanced response with your existing structure + new features
    const response = {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        totalPoints: user.totalPoints,
        rank,
        twitterUsername: user.twitterUsername,
        twitterId: user.twitterId,
        twitterImage: user.twitterImage,
        // ADD: New fields without breaking existing ones
        twitterFollowers: user.twitterFollowers || 0,
        level: Math.floor(user.totalPoints / 1000) + 1,
        activityLevel: twitterActivityLevel,
        tokenAllocation: tokenAllocation
      },
      stats: {
        todayPoints: todayPoints._sum.points || 0,
        weeklyPoints: weeklyPoints._sum.points || 0,
        totalEngagements: user._count.engagements,
        referralCount: user._count.referrals,
        // ADD: New stats
        streak: await calculateStreak(user.id),
        nextLevelPoints: (Math.floor(user.totalPoints / 1000) + 1) * 1000 - user.totalPoints
      },
      recentActivity: recentActivity.map((activity:any | unknown) => ({
        id: activity.id,
        action: activity.description || activity.action,
        points: activity.points,
        createdAt: activity.createdAt.toISOString(),
        metadata: activity.metadata
      })),
      // ADD: Include achievements if available
      achievements: achievements
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

// ADD: Helper functions to enhance your existing functionality
async function calculateTwitterActivityLevel(user: any): Promise<'HIGH' | 'MEDIUM' | 'LOW'> {
  if (!user.twitterId) return 'LOW'
  
  try {
    const followers = user.twitterFollowers || 0
    const engagements = await prisma.twitterEngagement.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: subDays(new Date(), 30) // Last 30 days
        }
      }
    })

    // Activity level logic - can be configured via system config
    if (followers >= 1000 || engagements >= 50) return 'HIGH'
    if (followers >= 500 || engagements >= 20) return 'MEDIUM'
    return 'LOW'
  } catch (error) {
    console.error('Error calculating activity level:', error)
    return 'LOW'
  }
}

function getTokenAllocation(activityLevel: string, followers: number): number {
  // These can be moved to system config later
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
      recentDays.map((day: any | unknown) => startOfDay(day.createdAt).getTime())
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

async function getUserAchievements(userId: string) {
  try {
    // Check if achievements table exists
    const achievements = await prisma.achievement.findMany({
      take: 5, // Just get a few for now
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        requirements: true
      }
    })

    return achievements.map((achievement: any | unknown) => ({
      id: achievement.id,
      title: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      unlocked: false, // TODO: Calculate based on user progress
      progress: 0 // TODO: Calculate based on requirements
    }))
  } catch (error) {
    // If achievements don't exist yet, return empty array
    return []
  }
}