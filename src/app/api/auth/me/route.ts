import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        walletAddress: true,
        twitterUsername: true,
        twitterId: true,
        twitterImage: true,
        email: true,
        totalPoints: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    // Calculate user rank
    const rank = await prisma.user.count({
      where: {
        totalPoints: { gt: user.totalPoints }
      }
    }) + 1

    return NextResponse.json({
      user: {
        ...user,
        rank,
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}