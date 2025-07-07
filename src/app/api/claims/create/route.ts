import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createTokenTransfer, createSolTransfer } from '@/lib/solana'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { points, paymentMethod = 'SOLANA' } = await req.json()

    // Validate input
    if (!points || points <= 0) {
      return NextResponse.json(
        { error: 'Invalid points amount' },
        { status: 400 }
      )
    }

    // Get user and claim config
    const [user, config] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id }
      }),
      prisma.systemConfig.findMany({
        where: {
          key: {
            in: ['claimsEnabled', 'minClaimAmount', 'claimRate']
          }
        }
      })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse config
    const claimsEnabled = config.find((c:any | unknown) => c.key === 'claimsEnabled')?.value as boolean ?? true
    const minClaimAmount = config.find((c:any | unknown) => c.key === 'minClaimAmount')?.value as number ?? 100
    const claimRate = config.find((c:any | unknown) => c.key === 'claimRate')?.value as number ?? 0.001

    if (!claimsEnabled) {
      return NextResponse.json(
        { error: 'Claims are temporarily disabled' },
        { status: 400 }
      )
    }

    if (points < minClaimAmount) {
      return NextResponse.json(
        { error: `Minimum claim amount is ${minClaimAmount} points` },
        { status: 400 }
      )
    }

    if (points > user.totalPoints) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }

    // Calculate token amount
    const tokenAmount = points * claimRate

    // Create claim record
    const claim = await prisma.claim.create({
      data: {
        userId: user.id,
        amount: tokenAmount,
        status: 'PROCESSING',
        paymentMethod: paymentMethod as any,
        metadata: {
          points,
          claimRate,
          walletAddress: user.walletAddress,
        }
      }
    })

    // Process claim asynchronously
    processClaimAsync(claim.id, user.id, user.walletAddress, tokenAmount, points, paymentMethod)

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      message: 'Claim is being processed',
    })
  } catch (error) {
    console.error('Claim creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    )
  }
}

async function processClaimAsync(
  claimId: string,
  userId: string,
  walletAddress: string,
  amount: number,
  points: number,
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

    // Update claim status
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'COMPLETED',
        transactionHash,
        processedAt: new Date(),
      }
    })

    // Deduct points from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { decrement: points }
      }
    })

    // Record in point history
    await prisma.pointHistory.create({
      data: {
        userId,
        points: -points,
        action: 'CLAIM_TOKENS',
        description: `Claimed ${amount} tokens`,
        metadata: {
          claimId,
          transactionHash,
        }
      }
    })

  } catch (error) {
    console.error('Claim processing error:', error)
    
    // Update claim status to failed
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'FAILED',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
  }
}