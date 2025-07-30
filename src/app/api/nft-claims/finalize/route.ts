// /api/nft-claims/finalize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { claimId, signature, userWallet } = await req.json()

    if (!claimId || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get claim
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { user: true }
    })

    if (!claim || claim.userId !== session.user.id) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Calculate token allocation based on user tier
    const user = claim.user
    const getUserTier = (activity: string | null, followers: number = 0) => {
      if (!activity) return null
      if (activity === 'HIGH' || followers >= 1000) return 'HIGH'
      if (activity === 'MEDIUM' || followers >= 500) return 'MEDIUM'
      return 'LOW'
    }

    const userTier = getUserTier(user.twitterActivity, user.twitterFollowers || 0)
    const getAllocation = (tier: string | null) => {
      switch (tier) {
        case 'HIGH': return 4500
        case 'MEDIUM': return 4000
        case 'LOW': return 3000
        default: return 0
      }
    }

    const allocation = getAllocation(userTier)

    // Update claim as completed
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'COMPLETED',
        amount: allocation,
        transactionHash: signature,
        metadata: JSON.stringify({
          ...JSON.parse(claim.metadata as string),
          signature,
          allocation,
          userTier,
          completedAt: new Date().toISOString()
        })
      }
    })

    // Update user's token balance (if you're tracking it)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalEarnedTokens: allocation  
      }
    })

    return NextResponse.json({
      success: true,
      allocation,
      signature
    })

  } catch (error: any) {
    console.error('Finalize claim error:', error)
    return NextResponse.json(
      { error: 'Failed to finalize claim' },
      { status: 500 }
    )
  }
}
