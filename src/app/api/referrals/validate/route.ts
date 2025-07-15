import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { referralCode } = await req.json()

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: {
        id: true,
        walletAddress: true,
        twitterUsername: true,
        isActive: true
      }
    })

    if (!referrer || !referrer.isActive) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        id: referrer.id,
        walletAddress: referrer.walletAddress,
        twitterUsername: referrer.twitterUsername
      }
    })
  } catch (error) {
    console.error('Referral validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    )
  }
}
