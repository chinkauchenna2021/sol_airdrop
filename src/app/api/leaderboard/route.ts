import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const range = url.searchParams.get('range') || 'all'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const search = url.searchParams.get('search')
    const activity = url.searchParams.get('activity')
    const hasTwitter = url.searchParams.get('hasTwitter')
    const minStreak = parseInt(url.searchParams.get('minStreak') || '0')
    const minPoints = parseInt(url.searchParams.get('minPoints') || '0')
    const maxPoints = parseInt(url.searchParams.get('maxPoints') || '1000000')
    const region = url.searchParams.get('region')
    const sortBy = url.searchParams.get('sortBy') || 'points'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Calculate time range
    let dateFilter = {}
    const now = new Date()
    
    switch (range) {
      case 'daily':
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
        break
      case 'weekly':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        dateFilter = { gte: weekStart }
        break
      case 'monthly':
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
        break
      case 'all':
      default:
        dateFilter = {}
        break
    }

    // Build where clause
    let where: any = {
      isActive: true,
      ...(minPoints > 0 && { totalPoints: { gte: minPoints } }),
      ...(maxPoints < 1000000 && { 
        totalPoints: { 
          ...(minPoints > 0 ? { gte: minPoints } : {}),
          lte: maxPoints 
        } 
      }),
      ...(minStreak > 0 && { streak: { gte: minStreak } }),
      ...(activity && activity !== 'ALL' && { twitterActivity: activity }),
      ...(hasTwitter === 'true' && { twitterUsername: { not: null } }),
      ...(hasTwitter === 'false' && { twitterUsername: null }),
    }

    // Add search filter
    if (search) {
      where.OR = [
        { twitterUsername: { contains: search, mode: 'insensitive' } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { twitterName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get previous rankings for change calculation
    const previousRankings = await getPreviousRankings(range)

    // Determine sort field
    let orderBy: any = {}
    switch (sortBy) {
      case 'points':
        orderBy = { totalPoints: sortOrder }
        break
      case 'change':
        // This would require a computed field, for now use points
        orderBy = { totalPoints: sortOrder }
        break
      case 'streak':
        orderBy = { streak: sortOrder }
        break
      case 'level':
        orderBy = { level: sortOrder }
        break
      default:
        orderBy = { totalPoints: sortOrder }
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where })

    // Get users with rankings
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        walletAddress: true,
        twitterUsername: true,
        twitterName: true,
        twitterImage: true,
        twitterFollowers: true,
        twitterActivity: true,
        totalPoints: true,
        level: true,
        streak: true,
        lastCheckIn: true,
        createdAt: true,
        lastActivity: true,
        engagements: {
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          select: {
            points: true,
            createdAt: true,
            engagementType: true
          }
        },
        pointHistory: {
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            points: true,
            action: true,
            createdAt: true
          }
        }
      }
    })

    // Calculate ranks and changes
    const leaderboardEntries = users.map((user, index) => {
      const currentRank = skip + index + 1
      const previousRank = previousRankings[user.id]?.rank
      const change = previousRank ? previousRank - currentRank : 0
      const pointsChange = calculatePointsChange(user, range)
      
      // Check if user is new (registered in current period)
      const isNew = isUserNew(user.createdAt, range)

      return {
        rank: currentRank,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          twitterUsername: user.twitterUsername,
          twitterName: user.twitterName,
          twitterImage: user.twitterImage,
          twitterFollowers: user.twitterFollowers,
          twitterActivity: user.twitterActivity,
          totalPoints: user.totalPoints,
          level: user.level || Math.floor(user.totalPoints / 1000) + 1,
          streak: user.streak || 0,
        },
        change,
        previousRank,
        pointsChange,
        isNew
      }
    })

    // Get current user's rank if authenticated
    let userRank = null
    const session = await getSession(req)
    if (session) {
      const userRankData = await getUserRank(session.user.id, where, orderBy)
      if (userRankData) {
        const previousUserRank = previousRankings[session.user.id]?.rank
        userRank = {
          rank: userRankData.rank,
          change: previousUserRank ? previousUserRank - userRankData.rank : 0,
          previousRank: previousUserRank,
          pointsChange: await getUserPointsChange(session.user.id, range)
        }
      }
    }

    // Get additional statistics
    const stats = await getLeaderboardStats(range, where)

    return NextResponse.json({
      leaderboard: leaderboardEntries,
      userRank,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      lastUpdated: new Date().toISOString(),
      stats,
      timeRange: range,
      filters: {
        search,
        activity,
        hasTwitter,
        minStreak,
        minPoints,
        maxPoints,
        region
      }
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

async function getPreviousRankings(range: string): Promise<Record<string, { rank: number; points: number }>> {
  try {
    // Calculate previous period
    const now = new Date()
    let previousPeriodStart: Date
    let previousPeriodEnd: Date

    switch (range) {
      case 'daily':
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        const lastWeekStart = new Date(now)
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
        lastWeekStart.setHours(0, 0, 0, 0)
        previousPeriodStart = lastWeekStart
        previousPeriodEnd = new Date(lastWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        // For 'all' time, check rankings from 24 hours ago
        previousPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        previousPeriodEnd = now
        break
    }

    // Get snapshot from analytics table or calculate from point history
    const analytics = await prisma.analytics.findFirst({
      where: {
        date: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd
        }
      },
      orderBy: { date: 'desc' }
    })

    if (analytics && analytics.metadata) {
      const metadata = analytics.metadata as any
      return metadata.rankings || {}
    }

    // Fallback: return empty rankings (no change data)
    return {}
  } catch (error) {
    console.error('Error getting previous rankings:', error)
    return {}
  }
}

function calculatePointsChange(user: any, range: string): number {
  try {
    const now = new Date()
    let startDate: Date

    switch (range) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
    }

    const recentPoints = user.pointHistory
      .filter((ph: any) => new Date(ph.createdAt) >= startDate)
      .reduce((sum: number, ph: any) => sum + ph.points, 0)

    return recentPoints
  } catch (error) {
    return 0
  }
}

function isUserNew(createdAt: Date, range: string): boolean {
  const now = new Date()
  const created = new Date(createdAt)

  switch (range) {
    case 'daily':
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return created >= dayStart
    case 'weekly':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      return created >= weekStart
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return created >= monthStart
    default:
      // For 'all', consider users new if registered in last 7 days
      return created >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
}

async function getUserRank(userId: string, where: any, orderBy: any): Promise<{ rank: number } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true }
    })

    if (!user) return null

    const rank = await prisma.user.count({
      where: {
        ...where,
        totalPoints: { gt: user.totalPoints }
      }
    })

    return { rank: rank + 1 }
  } catch (error) {
    console.error('Error getting user rank:', error)
    return null
  }
}

async function getUserPointsChange(userId: string, range: string): Promise<number> {
  try {
    const now = new Date()
    let startDate: Date

    switch (range) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
    }

    const result = await prisma.pointHistory.aggregate({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _sum: { points: true }
    })

    return result._sum.points || 0
  } catch (error) {
    console.error('Error getting user points change:', error)
    return 0
  }
}

async function getLeaderboardStats(range: string, where: any) {
  try {
    const [
      totalActiveUsers,
      totalPoints,
      totalEngagements,
      activityDistribution,
      topGainers,
      newUsers
    ] = await Promise.all([
      prisma.user.count({ where: { ...where, isActive: true } }),
      prisma.user.aggregate({
        where,
        _sum: { totalPoints: true }
      }),
      prisma.twitterEngagement.count({
        where: {
          userId: { in: await prisma.user.findMany({ where, select: { id: true } }).then(users => users.map(u => u.id)) }
        }
      }),
      prisma.user.groupBy({
        by: ['twitterActivity'],
        where,
        _count: true
      }),
      prisma.user.findMany({
        where,
        orderBy: { totalPoints: 'desc' },
        take: 10,
        select: {
          id: true,
          twitterUsername: true,
          walletAddress: true,
          totalPoints: true
        }
      }),
      prisma.user.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    return {
      totalActiveUsers,
      totalPoints: totalPoints._sum.totalPoints || 0,
      totalEngagements,
      activityDistribution,
      topGainers,
      newUsers,
      averagePoints: totalActiveUsers > 0 ? Math.round((totalPoints._sum.totalPoints || 0) / totalActiveUsers) : 0
    }
  } catch (error) {
    console.error('Error getting leaderboard stats:', error)
    return {
      totalActiveUsers: 0,
      totalPoints: 0,
      totalEngagements: 0,
      activityDistribution: [],
      topGainers: [],
      newUsers: 0,
      averagePoints: 0
    }
  }
}

// Additional endpoint for real-time updates
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { action, data } = await req.json()

    switch (action) {
      case 'refresh':
        // Trigger a manual refresh of rankings
        await updateRankingsSnapshot()
        return NextResponse.json({ success: true, message: 'Rankings refreshed' })
      
      case 'subscribe':
        // In a real implementation, this would set up WebSocket subscriptions
        return NextResponse.json({ success: true, message: 'Subscribed to updates' })
      
      case 'export':
        // Export current leaderboard
        const exportData = await exportLeaderboard(data.range, data.filters)
        return NextResponse.json({ success: true, data: exportData })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Leaderboard POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function updateRankingsSnapshot() {
  try {
    // Get current rankings
    const currentRankings = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { totalPoints: 'desc' },
      select: {
        id: true,
        totalPoints: true
      }
    })

    const rankingsMap = currentRankings.reduce((acc, user, index) => {
      acc[user.id] = {
        rank: index + 1,
        points: user.totalPoints
      }
      return acc
    }, {} as Record<string, { rank: number; points: number }>)

    // Store in analytics table
    await prisma.analytics.create({
      data: {
        date: new Date(),
        totalUsers: currentRankings.length,
        activeUsers: currentRankings.length,
        totalPoints: currentRankings.reduce((sum, user) => sum + user.totalPoints, 0),
        metadata: {
          rankings: rankingsMap,
          timestamp: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Error updating rankings snapshot:', error)
  }
}

async function exportLeaderboard(range: string, filters: any) {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(filters.activity && filters.activity !== 'ALL' && { twitterActivity: filters.activity }),
        ...(filters.hasTwitter === 'true' && { twitterUsername: { not: null } }),
        ...(filters.minPoints && { totalPoints: { gte: filters.minPoints } }),
      },
      orderBy: { totalPoints: 'desc' },
      select: {
        walletAddress: true,
        twitterUsername: true,
        twitterName: true,
        totalPoints: true,
        level: true,
        streak: true,
        twitterActivity: true,
        createdAt: true
      }
    })

    return {
      leaderboard: users.map((user, index) => ({
        rank: index + 1,
        ...user
      })),
      exportedAt: new Date().toISOString(),
      range,
      filters,
      totalUsers: users.length
    }
  } catch (error) {
    console.error('Error exporting leaderboard:', error)
    return null
  }
}