// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const search = url.searchParams.get('search')
    const filter = url.searchParams.get('filter')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    let where: any = {}
    
    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { twitterUsername: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (filter && filter !== 'all') {
      switch (filter) {
        case 'active':
          where.isActive = true
          break
        case 'inactive':
          where.isActive = false
          break
        case 'admin':
          where.isAdmin = true
          break
        case 'banned':
          where.isBanned = true
          break
        case 'high-risk':
          where.riskScore = { gte: 70 }
          break
      }
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          walletAddress: true,
          twitterUsername: true,
          twitterName: true,
          twitterFollowers: true,
          twitterActivity: true,
          totalPoints: true,
          level: true,
          streak: true,
          isActive: true,
          isAdmin: true,
          isBanned: true,
          riskScore: true,
          createdAt: true,
          lastActivity: true
        }
      }),
      prisma.user.count({ where })
    ])

    // Calculate ranks and token allocations
    const usersWithRanks = await Promise.all(
      users.map(async (user: any) => {
        const rank = await prisma.user.count({
          where: { totalPoints: { gt: user.totalPoints } }
        }) + 1

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
}
