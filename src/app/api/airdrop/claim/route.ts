import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AIRDROP_CONFIG } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  const { paymentSignature } = await req.json()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Get current claiming season
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: { status: 'CLAIMING' },
      orderBy: { createdAt: 'desc' }
    })

    if (!currentSeason) {
      return NextResponse.json(
        { error: 'No active claiming season' },
        { status: 400 }
      )
    }

    // Check if already claimed
    const existingClaim = await prisma.airdropClaim.findFirst({
      where: {
        userId,
        seasonId: currentSeason.id
      }
    })

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Airdrop already claimed for this season' },
        { status: 400 }
      )
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.twitterActivity) {
      return NextResponse.json(
        { error: 'User not eligible for airdrop' },
        { status: 400 }
      )
    }

    // Calculate tokens based on tier
    let tokens = 0
    const tier = user.twitterActivity

    switch (tier) {
      case 'HIGH':
        tokens = AIRDROP_CONFIG.TIERS.HIGH_ENGAGEMENT.tokens
        break
      case 'MEDIUM':
        tokens = AIRDROP_CONFIG.TIERS.MEDIUM_ENGAGEMENT.tokens
        break
      case 'LOW':
        tokens = AIRDROP_CONFIG.TIERS.LOW_ENGAGEMENT.tokens
        break
      default:
        return NextResponse.json(
          { error: 'Invalid tier for airdrop' },
          { status: 400 }
        )
    }

    // TODO: Verify payment signature here
    // This would involve checking the Solana transaction signature
    // and verifying that the correct amount of SOL was paid

    // Create airdrop claim record
    const airdropClaim = await prisma.airdropClaim.create({
      data: {
        userId,
        seasonId: currentSeason.id,
        tokens,
        tier,
        paymentSignature,
        status: 'COMPLETED',
        claimedAt: new Date(),
      }
    })

    // Update user's total earned tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalEarnedTokens: { increment: tokens }
      }
    })

    return NextResponse.json({
      success: true,
      tokens,
      tier,
      transactionId: airdropClaim.id,
      message: `Successfully claimed ${tokens} CONNECT tokens!`
    })

  } catch (error) {
    console.error('Airdrop claim error:', error)
    return NextResponse.json(
      { error: 'Failed to process airdrop claim' },
      { status: 500 }
    )
  }
}