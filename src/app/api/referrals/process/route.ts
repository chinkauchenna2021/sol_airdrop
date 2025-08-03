import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { POINTS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const { referralCode, newUserId } = await req.json()

    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true, isActive: true }
    })

    if (!referrer || !referrer.isActive) {
      return NextResponse.json({ error: 'Invalid referrer' }, { status: 404 })
    }

    // Check if this user was already referred
    const existingReferral = await prisma.referral.findUnique({
      where: { referredId: newUserId }
    })

    if (existingReferral) {
      return NextResponse.json({ error: 'User already referred' }, { status: 400 })
    }

    // Check if user is trying to refer themselves
    if (referrer.id === newUserId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    const referralPoints = POINTS.REFERRAL

    // Create referral relationship and award points
    await prisma.$transaction(async (tx) => {
      // Create referral record
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: newUserId,
          tokens: referralPoints,
          completed: true
        }
      })

      // Award points to referrer
      await tx.pointHistory.create({
        data: {
          userId: referrer.id,
          points: referralPoints,
          action: 'REFERRAL_BONUS',
          description: 'Referred a new user',
          metadata: {
            referredUserId: newUserId,
            timestamp: new Date().toISOString()
          }
        }
      })

      // Update referrer's total points
      await tx.user.update({
        where: { id: referrer.id },
        data: { totalPoints: { increment: referralPoints } }
      })

      // Award bonus points to new user
      await tx.pointHistory.create({
        data: {
          userId: newUserId,
          points: referralPoints,
          action: 'REFERRAL_WELCOME',
          description: 'Welcome bonus for joining via referral',
          metadata: {
            referrerId: referrer.id,
            timestamp: new Date().toISOString()
          }
        }
      })

      // Update new user's total points
      await tx.user.update({
        where: { id: newUserId },
        data: { totalPoints: { increment: referralPoints } }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Referral processed successfully',
      points: referralPoints
    })
  } catch (error) {
    console.error('Referral processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    )
  }
}
