import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ENHANCED_CONFIG } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  const { referredUserId } = await req.json()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Verify the referred user exists
    const referredUser = await prisma.user.findUnique({
      where: { id: referredUserId }
    })

    if (!referredUser) {
      return NextResponse.json(
        { error: 'Referred user not found' },
        { status: 404 }
      )
    }

    // Check if referral already exists
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: userId,
        referredId: referredUserId
      }
    })

    if (existingReferral) {
      return NextResponse.json(
        { error: 'User already referred' },
        { status: 400 }
      )
    }

    // Create referral record
    await prisma.referral.create({
      data: {
        referrerId: userId,
        referredId: referredUserId,
        tokens: ENHANCED_CONFIG.TOKEN_EARNING.REFERRAL_REWARD,
        completed: true,
      }
    })

    // Award referral tokens
    await prisma.dailyEarning.create({
      data: {
        userId,
        tokens: ENHANCED_CONFIG.TOKEN_EARNING.REFERRAL_REWARD,
        type: 'REFERRAL_BONUS',
        claimedAt: new Date(),
      }
    })

    // Update user's total earned tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalEarnedTokens: { increment: ENHANCED_CONFIG.TOKEN_EARNING.REFERRAL_REWARD}
      }
    })

    return NextResponse.json({
      success: true,
      tokens: ENHANCED_CONFIG.TOKEN_EARNING.REFERRAL_REWARD,
      message: `Earned ${ENHANCED_CONFIG.TOKEN_EARNING.REFERRAL_REWARD} CONNECT tokens for successful referral!`
    })

  } catch (error) {
    console.error('Referral error:', error)
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    )
  }
}