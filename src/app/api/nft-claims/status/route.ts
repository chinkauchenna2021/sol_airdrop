// /api/nft-claims/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        claims: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get system settings
    const settings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['claimingEnabled', 'nftPassRequired', 'requireApproval', 'claimingFee']
        }
      }
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, any>)

    // Check if user is approved (if approval required)
    const userApproval = await prisma.nftClaimApproval.findUnique({
      where: { userId: user.id }
    })

    // Get current season
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: { status: { in: ['ACTIVE', 'CLAIMING'] } },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate user tier based on Twitter activity
    const getUserTier = (activity: string | null, followers: number = 0) => {
      if (!activity) return null
      if (activity === 'HIGH' || followers >= 1000) return 'HIGH'
      if (activity === 'MEDIUM' || followers >= 500) return 'MEDIUM'
      return 'LOW'
    }

    const userTier = getUserTier(user.twitterActivity, user.twitterFollowers || 0)
    
    // Get allocation based on tier
    const getAllocation = (tier: string | null) => {
      switch (tier) {
        case 'HIGH': return 4500
        case 'MEDIUM': return 4000
        case 'LOW': return 3000
        default: return 0
      }
    }

    const allocation = getAllocation(userTier)

    // Check if already claimed
    const alreadyClaimed = user.claims.some(claim => 
      claim?.type === 'NFT_TOKEN' && claim.status === 'COMPLETED'
    )

    return NextResponse.json({
      isEnabled: settingsMap.claimingEnabled ?? true,
      userApproved: userApproval?.approved ?? false,
      seasonActive: currentSeason?.status === 'ACTIVE',
      userTier,
      allocation,
      claimingFee: settingsMap.claimingFee ?? 4,
      alreadyClaimed,
      requirements: {
        nftPassRequired: settingsMap.nftPassRequired ?? true,
        twitterConnected: !!user.twitterId,
        walletConnected: !!user.walletAddress,
        minimumEngagement: (user.totalPoints || 0) >= 100,
        adminApproval: !settingsMap.requireApproval || (userApproval?.approved ?? false)
      },
      currentSeason: currentSeason ? {
        id: currentSeason.id,
        name: currentSeason.name,
        status: currentSeason.status,
        totalAllocation: currentSeason.totalAllocation,
        claimedPercentage: (Number(currentSeason.claimedAmount) / Number(currentSeason.totalAllocation)) * 100,
        endDate: currentSeason.endDate
      } : null
    })

  } catch (error: any) {
    console.error('Get claim status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim status' },
      { status: 500 }
    )
  }
}
