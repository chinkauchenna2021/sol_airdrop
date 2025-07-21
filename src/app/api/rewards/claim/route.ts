import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rewardId } = await req.json()
    const userId = session.user.id

    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true, totalEarnedTokens: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Define reward costs (should match the rewards in GET route)
    const rewardCosts: Record<string, number> = {
      'bronze-badge': 100,
      'silver-badge': 500,
      'gold-badge': 1000,
      'connect-tokens-50': 50,
      'connect-tokens-100': 100
    }

    const cost = rewardCosts[rewardId]
    if (!cost) {
      return NextResponse.json({ error: 'Invalid reward' }, { status: 400 })
    }

    if (user.totalPoints < cost) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Process the reward claim
    await prisma.$transaction(async (tx) => {
      // Deduct points
      await tx.user.update({
        where: { id: userId },
        data: { totalPoints: { decrement: cost } }
      })

      // Add to point history
      await tx.pointHistory.create({
        data: {
          userId,
          points: -cost,
          action: 'REWARD_CLAIM',
          description: `Claimed reward: ${rewardId}`,
          metadata: { rewardId }
        }
      })

      // If it's a token reward, add tokens
      if (rewardId.includes('connect-tokens')) {
        const tokenAmount = rewardId === 'connect-tokens-50' ? 5 : 10 // 10:1 ratio
        
        await tx.user.update({
          where: { id: userId },
          data: { totalEarnedTokens: { increment: tokenAmount } }
        })

        await tx.dailyEarning.create({
          data: {
            userId,
            tokens: tokenAmount,
            type: 'REWARD_EXCHANGE'
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${rewardId}!`
    })

  } catch (error) {
    console.error('Reward claim error:', error)
    return NextResponse.json(
      { error: 'Failed to claim reward' },
      { status: 500 }
    )
  }
}
