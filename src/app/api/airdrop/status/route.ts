import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AIRDROP_CONFIG } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Get current active season
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: {
        status: {
          in: ['ACTIVE', 'CLAIMING']
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!currentSeason) {
      return NextResponse.json({
        seasonActive: false,
        claimingActive: false,
        isEligible: false,
        tier: null,
        allocation: 0,
        alreadyClaimed: false,
        requirements: {}
      })
    }

    // Check if user already claimed for this season
    const existingClaim = await prisma.airdropClaim.findFirst({
      where: {
        userId,
        seasonId: currentSeason.id
      }
    })

    // Get user data with Twitter info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        engagements: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check eligibility requirements
    const requirements = {
      twitterConnected: !!user.twitterUsername,
      walletConnected: !!user.walletAddress,
      minEngagements: user.engagements.length >= 5,
      accountAge: new Date(user.createdAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days old
    }

    const isEligible = Object.values(requirements).every(Boolean)

    // Determine tier based on Twitter activity
    let tier: 'HIGH' | 'MEDIUM' | 'LOW' | null = null
    let allocation = 0

    if (isEligible && user.twitterActivity) {
      tier = user.twitterActivity
      switch (tier) {
        case 'HIGH':
          allocation = AIRDROP_CONFIG.TIERS.HIGH_ENGAGEMENT.tokens
          break
        case 'MEDIUM':
          allocation = AIRDROP_CONFIG.TIERS.MEDIUM_ENGAGEMENT.tokens
          break
        case 'LOW':
          allocation = AIRDROP_CONFIG.TIERS.LOW_ENGAGEMENT.tokens
          break
      }
    }

    return NextResponse.json({
      seasonActive: currentSeason.status === 'ACTIVE' || currentSeason.status === 'CLAIMING',
      claimingActive: currentSeason.status === 'CLAIMING',
      isEligible,
      tier,
      allocation,
      alreadyClaimed: !!existingClaim,
      requirements,
      seasonName: currentSeason.name
    })

  } catch (error) {
    console.error('Error fetching airdrop status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}