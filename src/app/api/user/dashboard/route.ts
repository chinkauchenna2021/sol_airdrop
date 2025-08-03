import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'
import { ACTIVITY_TYPES } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const today = startOfDay(new Date())
    const yesterday = subDays(today, 1)
    const weekAgo = subDays(today, 7)

    // Get comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            engagements: true,
            referrals: { where: { completed: true } },
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get activity statistics (separated by points and tokens)
    const [todayPoints, todayTokens, weeklyPoints, weeklyTokens, recentActivity, totalEarned] = await Promise.all([
      // Today's points
      prisma.pointHistory.aggregate({
        where: {
          userId,
          type: ACTIVITY_TYPES.POINTS,
          createdAt: { gte: today }
        },
        _sum: { points: true }
      }),
      // Today's tokens
      prisma.pointHistory.aggregate({
        where: {
          userId,
          type: ACTIVITY_TYPES.TOKENS,
          createdAt: { gte: today }
        },
        _sum: { tokens: true }
      }),
      // Weekly points
      prisma.pointHistory.aggregate({
        where: {
          userId,
          type: ACTIVITY_TYPES.POINTS,
          createdAt: { gte: weekAgo }
        },
        _sum: { points: true }
      }),
      // Weekly tokens
      prisma.pointHistory.aggregate({
        where: {
          userId,
          type: ACTIVITY_TYPES.TOKENS,
          createdAt: { gte: weekAgo }
        },
        _sum: { tokens: true }
      }),
      // Recent activity (both points and tokens)
      prisma.pointHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          points: true,
          tokens: true,
          type: true,
          action: true,
          description: true,
          createdAt: true,
          metadata: true
        }
      }),
      // Total earned from referrals
      prisma.referral.aggregate({
        where: { 
          referrerId: userId,
          completed: true 
        },
        _sum: { tokens: true }
      })
    ])

    // Get user's rank based on total points (leaderboard still based on points)
    const higherRankedUsers = await prisma.user.count({
      where: {
        totalPoints: { gt: user.totalPoints },
        isActive: true
      }
    })
    const rank = higherRankedUsers + 1

    // Calculate streak and daily claim status
    const streak = await calculateStreak(user.id)
    const dailyClaimStatus = await getDailyClaimStatus(user.id)

    // Get referral data
    const referralData = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            walletAddress: true,
            twitterUsername: true,
            isActive: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Calculate Twitter activity level for airdrop eligibility
    const twitterActivityLevel = getTwitterActivityLevel(user)
    const tokenAllocation = getTokenAllocation(twitterActivityLevel)

    // UPDATED: Return separate points and tokens data
    const response = {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        totalPoints: user.totalPoints,              // Points balance
        totalTokens: user.totalTokens,              // NEW: Token balance
        totalEarnedTokens: user.totalEarnedTokens,  // Lifetime tokens
        rank,
        twitterUsername: user.twitterUsername,
        twitterId: user.twitterId,
        twitterImage: user.twitterImage,
        twitterFollowers: user.twitterFollowers || 0,
        level: Math.floor(user.totalPoints / 1000) + 1, // Level based on points
        twitterActivity: twitterActivityLevel,
        streak: streak,
        referralCode: user.referralCode,
        isActive: user.isActive,
        claimsEnabled: user.claimsEnabled
      },
      stats: {
        // Points statistics
        pointsStats: {
          todayPoints: todayPoints._sum.points || 0,
          weeklyPoints: weeklyPoints._sum.points || 0,
          totalPoints: user.totalPoints
        },
        // Token statistics  
        tokenStats: {
          todayTokens: todayTokens._sum.tokens || 0,
          weeklyTokens: weeklyTokens._sum.tokens || 0,
          totalTokens: user.totalTokens,
          totalEarnedTokens: user.totalEarnedTokens,
          claimableTokens: user.totalTokens // What can be claimed
        },
        // General stats
        totalEngagements: user._count.engagements,
        referralCount: user._count.referrals,
        tokenAllocation: tokenAllocation,
        // Daily claim status
        dailyEarningStatus: dailyClaimStatus
      },
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        action: activity.description || activity.action,
        points: activity.points || 0,
        tokens: activity.tokens || 0,
        type: activity.type,
        createdAt: activity.createdAt.toISOString(),
        metadata: activity.metadata
      })),
      referrals: {
        totalReferrals: referralData.length,
        activeReferrals: referralData.filter(r => r.completed && r.referred.isActive).length,
        totalEarnedTokens: totalEarned._sum.tokens || 0, // CHANGED: Referrals give tokens
        recentReferrals: referralData.map(r => ({
          id: r.id,
          walletAddress: r.referred.walletAddress,
          twitterUsername: r.referred.twitterUsername,
          tokens: r.tokens, // CHANGED: Show tokens instead of points
          completed: r.completed,
          createdAt: r.createdAt.toISOString()
        }))
      },
      // Separate balances for clarity
      balances: {
        points: {
          current: user.totalPoints,
          todayEarned: todayPoints._sum.points || 0,
          weeklyEarned: weeklyPoints._sum.points || 0,
          canClaim: false, // Points cannot be claimed
          description: "Points are earned from daily activities and tasks. They cannot be claimed."
        },
        tokens: {
          current: user.totalTokens,
          todayEarned: todayTokens._sum.tokens || 0,
          weeklyEarned: weeklyTokens._sum.tokens || 0,
          lifetime: user.totalEarnedTokens,
          canClaim: true, // Tokens can be claimed
          description: "Tokens are earned from referrals and Twitter activities. They can be claimed."
        }
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

function getTwitterActivityLevel(user: any): string {
  if (!user.twitterId) return 'NONE'
  
  // Calculate based on followers and engagement
  const followers = user.twitterFollowers || 0
  
  if (followers >= 1000) return 'HIGH'
  if (followers >= 500) return 'MEDIUM'
  return 'LOW'
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

async function getDailyClaimStatus(userId: string) {
  try {
    const today = startOfDay(new Date())
    
    // Check if claimed today
    const todayClaim = await prisma.pointHistory.findFirst({
      where: {
        userId,
        action: 'DAILY_CHECK_IN',
        createdAt: { gte: today }
      }
    })

    // Get recent earnings
    const recentEarnings = await prisma.pointHistory.aggregate({
      where: {
        userId,
        action: 'DAILY_CHECK_IN',
        createdAt: { gte: subDays(new Date(), 30) }
      },
      _sum: { points: true },
      _count: true
    })

    return {
      canClaim: !todayClaim,
      currentStreak: await calculateStreak(userId),
      totalEarned: recentEarnings._sum.points || 0,
      claimCount: recentEarnings._count,
      nextClaimIn: todayClaim ? 24 : 0 // Hours
    }
  } catch (error) {
    console.error('Error getting daily claim status:', error)
    return {
      canClaim: false,
      currentStreak: 0,
      totalEarned: 0,
      claimCount: 0,
      nextClaimIn: 24
    }
  }
}