import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { paginationSchema } from '../../../../lib/validation'

export const GET = requireAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''
    
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
    }

    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { twitterUsername: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get users with counts
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

    // Calculate ranks
    const usersWithRanks = await Promise.all(
      users.map(async (user) => {
        const rank = await prisma.user.count({
          where: {
            totalPoints: { gt: user.totalPoints }
          }
        }) + 1

        return { ...user, rank }
      })
    )

    return NextResponse.json({
      users: usersWithRanks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
})