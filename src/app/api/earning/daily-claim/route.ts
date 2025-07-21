import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'
import { ENHANCED_CONFIG } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const today = startOfDay(new Date())

    // Check if already claimed today
    const existingClaim = await prisma.dailyEarning.findFirst({
      where: {
        userId,
        claimedAt: { gte: today }
      }
    })

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Already claimed today' },
        { status: 400 }
      )
    }

    // Calculate streak and bonus
    const yesterdayStart = subDays(today, 1)
    const yesterdayEnd = today
    
    const yesterdayClaim = await prisma.dailyEarning.findFirst({
      where: {
        userId,
        claimedAt: {
          gte: yesterdayStart,
          lt: yesterdayEnd
        }
      }
    })

    // Calculate current streak
    let currentStreak = 1
    if (yesterdayClaim) {
      // Get all claims in the last 60 days to calculate streak
      const recentClaims = await prisma.dailyEarning.findMany({
        where: {
          userId,
          claimedAt: { gte: subDays(today, 60) }
        },
        orderBy: { claimedAt: 'desc' }
      })

      let streak = 1
      let checkDate = subDays(today, 1)
      
      for (const claim of recentClaims) {
        const claimDate = startOfDay(new Date(claim.claimedAt))
        if (claimDate.getTime() === checkDate.getTime()) {
          streak++
          checkDate = subDays(checkDate, 1)
        } else {
          break
        }
      }
      
      currentStreak = streak
    }

    // Calculate bonus tokens for streaks
    let bonusTokens = 0
    if (currentStreak >= 30) {
      bonusTokens = 15 // 30-day streak bonus
    } else if (currentStreak >= 7) {
      bonusTokens = 5 // 7-day streak bonus
    }

    const totalTokens = ENHANCED_CONFIG.DAILY_EARNING.LOGIN_REWARD + bonusTokens

    // Create daily earning record
    const dailyEarning = await prisma.dailyEarning.create({
      data: {
        userId,
        tokens: totalTokens,
        type: 'LOGIN_BONUS',
        claimedAt: new Date(),
      }
    })

    // Update user's total earned tokens and streak
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalEarnedTokens: { increment: totalTokens },
        lastLoginReward: new Date(),
        streak: currentStreak,
      }
    })

    return NextResponse.json({
      success: true,
      tokens: totalTokens,
      baseReward: ENHANCED_CONFIG.DAILY_EARNING.LOGIN_REWARD,
      bonusTokens,
      currentStreak,
      message: `Earned ${totalTokens} CONNECT tokens! ${bonusTokens > 0 ? `(+${bonusTokens} streak bonus)` : ''}`
    })

  } catch (error) {
    console.error('Daily claim error:', error)
    return NextResponse.json(
      { error: 'Failed to process daily claim' },
      { status: 500 }
    )
  }
}