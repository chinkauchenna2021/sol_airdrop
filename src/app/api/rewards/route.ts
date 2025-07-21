import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Define available rewards (you can also store these in the database)
    const rewards = [
      {
        id: 'bronze-badge',
        name: 'Bronze Badge',
        description: 'Reach 100 points to unlock this badge',
        cost: 100,
        type: 'BADGE',
        available: user.totalPoints >= 100
      },
      {
        id: 'silver-badge',
        name: 'Silver Badge',
        description: 'Reach 500 points to unlock this badge',
        cost: 500,
        type: 'BADGE',
        available: user.totalPoints >= 500
      },
      {
        id: 'gold-badge',
        name: 'Gold Badge',
        description: 'Reach 1000 points to unlock this badge',
        cost: 1000,
        type: 'BADGE',
        available: user.totalPoints >= 1000
      },
      {
        id: 'connect-tokens-50',
        name: '50 CONNECT Tokens',
        description: 'Exchange 50 points for CONNECT tokens',
        cost: 50,
        type: 'TOKEN',
        available: user.totalPoints >= 50
      },
      {
        id: 'connect-tokens-100',
        name: '100 CONNECT Tokens',
        description: 'Exchange 100 points for CONNECT tokens',
        cost: 100,
        type: 'TOKEN',
        available: user.totalPoints >= 100
      }
    ]

    return NextResponse.json({ rewards })

  } catch (error) {
    console.error('Rewards fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}
