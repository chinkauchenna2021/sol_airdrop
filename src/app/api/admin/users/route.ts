// src/app/api/admin/users/route.ts - REPLACE your existing file
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { paginationSchema } from '@/lib/validation'

export async function GET(req: NextRequest) {
  // Check admin authentication
  const session = await getSession(req)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''
    const activityFilter = searchParams.get('activity') || '' // ADD: Activity filter
    
    // Parse pagination params
    const { page, limit, sortBy, sortOrder } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder'),
    })

    // Build where clause
    let where: any = {}
    
    if (filter === 'active') {
      where.isActive = true
    } else if (filter === 'inactive') {
      where.isActive = false
    } else if (filter === 'admin') {
      where.isAdmin = true
    } else if (filter === 'twitter') {
      // ADD: Filter for users with Twitter connected
      where.twitterId = { not: null }
    }

    // ADD: Activity level filter
    if (activityFilter && ['HIGH', 'MEDIUM', 'LOW'].includes(activityFilter)) {
      where.twitterActivity = activityFilter
    }

    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { twitterUsername: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get users with enhanced data
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              engagements: true,
              claims: true,
              referrals: true,
            }
          }
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    // Calculate ranks and enhance user data
    const usersWithRanks = await Promise.all(
      users.map(async (user) => {
        const rank = await prisma.user.count({
          where: {
            totalPoints: { gt: user.totalPoints }
          }
        }) + 1

        // ADD: Calculate token allocation and other enhanced fields
        const tokenAllocation = user.twitterActivity === 'HIGH' ? 4000 
                              : user.twitterActivity === 'MEDIUM' ? 3500 
                              : 3000

        const level = Math.floor(user.totalPoints / 1000) + 1

        return { 
          ...user, 
          rank,
          tokenAllocation,
          level: user.level || level
        }
      })
    )

    // ADD: Get activity distribution summary
    const activitySummary = await prisma.user.groupBy({
      by: ['twitterActivity'],
      _count: true,
      where: {
        twitterActivity: { not: null }
      }
    })

    return NextResponse.json({
      users: usersWithRanks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      // ADD: Activity distribution summary for admin insights
      activitySummary: activitySummary.map(stat => ({
        activity: stat.twitterActivity,
        count: stat._count,
        tokensPerUser: stat.twitterActivity === 'HIGH' ? 4000 
                      : stat.twitterActivity === 'MEDIUM' ? 3500 
                      : 3000
      })),
      // ADD: Filter options for frontend
      filters: {
        available: ['all', 'active', 'inactive', 'admin', 'twitter'],
        activities: ['HIGH', 'MEDIUM', 'LOW']
      }
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}