import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { LIMITS, ACTIVITY_TYPES, ERROR_MESSAGES } from '@/lib/constants'
import { createSolTransfer, createTokenTransfer } from '@/lib/solana'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tokens, paymentMethod } = await req.json()
    const userId = session.user.id

    // Validate input
    if (!tokens || tokens <= 0) {
      return NextResponse.json(
        { error: 'Invalid token amount' },
        { status: 400 }
      )
    }

    if (!paymentMethod || !['SOLANA', 'USDC'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalTokens: true,      // CHANGED: Check token balance instead of points
        totalPoints: true,      // Keep for reference
        walletAddress: true,
        claimsEnabled: true,
        isActive: true,
        isBanned: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate user eligibility
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Account is banned' },
        { status: 403 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      )
    }

    if (user.claimsEnabled === false) {
      return NextResponse.json(
        { error: 'Claims are disabled for your account' },
        { status: 403 }
      )
    }

    // Check system configuration
    const config = await prisma.systemConfig.findMany({
      where: {
        key: { in: ['claimsEnabled', 'minClaimAmount', 'maxClaimAmount'] }
      }
    })

    const configMap = config.reduce((acc, item) => {
      acc[item.key] = item.value
      return acc
    }, {} as Record<string, any>)

    const claimsEnabled = configMap.claimsEnabled ?? true
    const minClaimAmount = configMap.minClaimAmount ?? LIMITS.MIN_TOKEN_CLAIM
    const maxClaimAmount = configMap.maxClaimAmount ?? LIMITS.MAX_CLAIM_AMOUNT

    if (!claimsEnabled) {
      return NextResponse.json(
        { error: 'Claims are temporarily disabled' },
        { status: 400 }
      )
    }

    // CHANGED: Validate token amount instead of points
    if (tokens < minClaimAmount) {
      return NextResponse.json(
        { error: `Minimum claim amount is ${minClaimAmount} tokens` },
        { status: 400 }
      )
    }

    if (tokens > maxClaimAmount) {
      return NextResponse.json(
        { error: `Maximum claim amount is ${maxClaimAmount} tokens` },
        { status: 400 }
      )
    }

    // CHANGED: Check token balance instead of points
    if (tokens > user.totalTokens) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INSUFFICIENT_TOKENS },
        { status: 400 }
      )
    }

    // REMOVED: No conversion rate needed - tokens are claimed directly
    const claimAmount = tokens // Direct token claim, no conversion

    // Create claim record
    const claim = await prisma.claim.create({
      data: {
        userId: userId,
        amount: claimAmount,
        status: 'PROCESSING',
        type: 'TOKEN', // Ensure it's marked as token claim
        paymentMethod: paymentMethod as any,
        metadata: {
          tokens,
          walletAddress: user.walletAddress,
          originalTokenBalance: user.totalTokens
        }
      }
    })

    // Process claim asynchronously
    processTokenClaimAsync(claim.id, userId, user.walletAddress, claimAmount, tokens, paymentMethod)

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      message: 'Token claim is being processed',
      amount: claimAmount,
      type: 'tokens'
    })
  } catch (error) {
    console.error('Token claim creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create token claim' },
      { status: 500 }
    )
  }
}

// UPDATED: Process token claims (not point conversions)
async function processTokenClaimAsync(
  claimId: string,
  userId: string,
  walletAddress: string,
  amount: number,
  tokens: number,
  paymentMethod: string
) {
  try {
    // Process the transfer
    let transactionHash: string

    if (paymentMethod === 'SOLANA') {
      transactionHash = await createSolTransfer(walletAddress, amount)
    } else {
      transactionHash = await createTokenTransfer(walletAddress, amount)
    }

    // Update claim status and user balances in transaction
    await prisma.$transaction(async (tx) => {
      // Update claim status
      await tx.claim.update({
        where: { id: claimId },
        data: {
          status: 'COMPLETED',
          transactionHash,
          processedAt: new Date(),
        }
      })

      // CHANGED: Deduct tokens from user balance (not points)
      await tx.user.update({
        where: { id: userId },
        data: {
          totalTokens: { decrement: tokens }
        }
      })

      // Record in activity history
      await tx.pointHistory.create({
        data: {
          userId,
          points: 0, // No points involved
          tokens: -tokens, // CHANGED: Track token deduction
          type: ACTIVITY_TYPES.TOKENS,
          action: 'CLAIM_TOKENS',
          description: `Claimed ${amount} tokens`,
          metadata: {
            claimId,
            transactionHash,
            paymentMethod,
            tokensClaimed: tokens
          }
        }
      })
    })

  } catch (error) {
    console.error('Token claim processing error:', error)
    
    // Update claim status to failed
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'FAILED',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date()
        }
      }
    })
  }
}

// GET route to fetch claim history and balance
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Get user balances and recent claims
    const [user, recentClaims] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalTokens: true,    // CHANGED: Show token balance
          totalPoints: true,    // Keep for display
          totalEarnedTokens: true,
          claimsEnabled: true
        }
      }),
      prisma.claim.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          paymentMethod: true,
          transactionHash: true,
          createdAt: true,
          processedAt: true,
          type: true
        }
      })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      balances: {
        claimableTokens: user.totalTokens,    // CHANGED: Tokens can be claimed
        totalPoints: user.totalPoints,        // Points cannot be claimed
        totalEarnedTokens: user.totalEarnedTokens,
        claimsEnabled: user.claimsEnabled
      },
      recentClaims: recentClaims.map(claim => ({
        id: claim.id,
        amount: claim.amount,
        status: claim.status,
        paymentMethod: claim.paymentMethod,
        transactionHash: claim.transactionHash,
        createdAt: claim.createdAt.toISOString(),
        processedAt: claim.processedAt?.toISOString(),
        type: claim.type || 'TOKEN'
      })),
      limits: {
        minClaimAmount: LIMITS.MIN_TOKEN_CLAIM,
        maxClaimAmount: LIMITS.MAX_CLAIM_AMOUNT
      },
      message: "Only tokens can be claimed. Points are non-transferable rewards."
    })

  } catch (error) {
    console.error('Claim balance fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim data' },
      { status: 500 }
    )
  }
}