import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession(req)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { userId } = params

    // Verify user access
    if (session.user.id !== userId && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get engagement statistics
    const [
      totalEngagements,
      todayEngagements,
      weeklyEngagements,
      monthlyEngagements,
      recentActivity,
      userInfo
    ] = await Promise.all([
      // Total engagements
      prisma.twitterEngagement.count({
        where: { userId }
      }),
      
      // Today's engagements
      prisma.twitterEngagement.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      // Weekly engagements
      prisma.twitterEngagement.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Monthly engagements
      prisma.twitterEngagement.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Recent activity
      prisma.twitterEngagement.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          engagementType: true,
          tokens: true, // Get tokens instead of points
          createdAt: true,
          tweetId: true
        }
      }),

      // Get user's activity level and token info
      prisma.user.findUnique({
        where: { id: userId },
        select: { 
          twitterActivity: true,
          totalTokens: true,
          totalEarnedTokens: true
        }
      })
    ])

    // Calculate engagement breakdown by type with tokens
    const engagementBreakdown = await prisma.twitterEngagement.groupBy({
      by: ['engagementType'],
      where: { userId },
      _count: { engagementType: true },
      _sum: { tokens: true } // Sum tokens instead of points
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalEngagements,
        todayEngagements,
        weeklyEngagements,
        monthlyEngagements,
        activityLevel: userInfo?.twitterActivity || 'LOW',
        totalTokens: userInfo?.totalTokens || 0,
        totalEarnedTokens: userInfo?.totalEarnedTokens || 0,
        breakdown: engagementBreakdown.map(item => ({
          type: item.engagementType,
          count: item._count.engagementType,
          tokens: item._sum.tokens || 0 // Return tokens instead of points
        })),
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.engagementType,
          tokens: activity.tokens, // Return tokens instead of points
          createdAt: activity.createdAt.toISOString(),
          tweetId: activity.tweetId
        }))
      }
    })

  } catch (error) {
    console.error('❌ Error fetching engagement stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement statistics' },
      { status: 500 }
    )
  }
}