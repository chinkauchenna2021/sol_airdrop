import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfMonth, startOfWeek } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || 'all'
  const limit = parseInt(searchParams.get('limit') || '100')
  const page = parseInt(searchParams.get('page') || '1')
  
  const session = await getSession(req)

  try {
    let dateFilter = {}
    
    if (range === 'monthly') {
      dateFilter = { createdAt: { gte: startOfMonth(new Date()) } }
    } else if (range === 'weekly') {
      dateFilter = { createdAt: { gte: startOfWeek(new Date(), { weekStartsOn: 1 }) } }
    }

    // Get top users
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        totalPoints: { gt: 0 },
        ...dateFilter
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        walletAddress: true,
        twitterUsername: true,
        twitterImage: true,
        totalPoints: true,
      }
    })

    // Calculate rank changes (simplified - in production, track historical ranks)
    const leaderboard = users.map((user, index) => ({
      rank: (page - 1) * limit + index + 1,
      user,
      change: 0, // In production, calculate from historical data
    }))

    // Get current user's rank if authenticated
    let userRank = null
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { totalPoints: true }
      })

      if (user) {
        const usersAhead = await prisma.user.count({
          where: {
            totalPoints: { gt: user.totalPoints },
            isActive: true,
            ...dateFilter
          }
        })
        
        userRank = {
          rank: usersAhead + 1,
          change: 0,
        }
      }
    }

    return NextResponse.json({
      leaderboard,
      userRank,
      pagination: {
        page,
        limit,
        total: await prisma.user.count({ 
          where: { 
            isActive: true, 
            totalPoints: { gt: 0 },
            ...dateFilter 
          } 
        })
      }
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}