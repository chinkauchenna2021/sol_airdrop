// /api/claim/process/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { checkNftOwnership, getSolAmountForUsd } from '@/utils'
import   prisma   from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { amount, walletAddress, hasNFTPass } = await req.json()

    if (!amount || !walletAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get current season
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: { status: 'ACTIVE' }
    })

    if (!currentSeason) {
      return NextResponse.json({ error: 'No active airdrop season' }, { status: 400 })
    }

    // Check if NFT pass is required
    if (currentSeason.nftPassRequired) {
      // Check user's NFT holdings
      const nftHolding = await prisma.userNftHolding.findFirst({
        where: {
          userId: session.user.id,
          mintAddress: process.env.NEXT_PUBLIC_NFT_MINT_ADDRESS!
        }
      })

      if (!nftHolding) {
        return NextResponse.json({ error: 'NFT pass required for claiming' }, { status: 403 })
      }
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        airdropClaims: {
          where: { 
            seasonId: currentSeason.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check daily claim limit
    const dailyClaimedAmount = user?.airdropClaims?.reduce((sum: any, claim: { tokens: any }) => sum + claim.tokens, 0)
    const dailyLimit = 10000

    if (dailyClaimedAmount + amount > dailyLimit) {
      return NextResponse.json({ 
        error: `Daily claim limit exceeded. You can claim ${dailyLimit - dailyClaimedAmount} more tokens today.` 
      }, { status: 400 })
    }

    // Check if user has enough claimable tokens
    if (user.totalEarnedTokens < amount) {
      return NextResponse.json({ error: 'Insufficient claimable tokens' }, { status: 400 })
    }

    // Get claim fee
    const { solAmount: feeAmount } = await getSolAmountForUsd(0.1)

    // Determine user tier
    let tier = 'LOW'
    if (user.twitterActivity === 'HIGH') tier = 'HIGH'
    else if (user.twitterActivity === 'MEDIUM') tier = 'MEDIUM'

    // Generate mock transaction hash
    const mockTransactionHash = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create airdrop claim
    const airdropClaim = await prisma.airdropClaim.create({
      data: {
        userId: session.user.id,
        seasonId: currentSeason.id,
        tokens: amount,
        tier,
        paymentSignature: `payment_${Date.now()}`,
        transactionSignature: mockTransactionHash,
        status: 'COMPLETED'
      }
    })

    // Create general claim record
    await prisma.claim.create({
      data: {
        userId: session.user.id,
        type: 'TOKEN',
        amount,
        status: 'COMPLETED',
        transactionHash: mockTransactionHash,
        feesPaid: feeAmount,
        userTier: tier,
        metadata: {
          walletAddress,
          hasNFTPass,
          feeUSD: 0.1,
          seasonId: currentSeason.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    // Update user's earned tokens
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalEarnedTokens: {
          decrement: amount
        }
      }
    })

    // Update season claimed amount
    await prisma.airdropSeason.update({
      where: { id: currentSeason.id },
      data: {
        claimedAmount: {
          increment: BigInt(amount)
        }
      }
    })

    return NextResponse.json({
      success: true,
      claimId: airdropClaim.id,
      transactionHash: mockTransactionHash,
      message: `Successfully claimed ${amount} CONNECT tokens`
    })

  } catch (error: any) {
    console.error('Token claim error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process token claim' },
      { status: 500 }
    )
  }
}
