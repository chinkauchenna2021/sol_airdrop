// /app/api/nft-claims/approval-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Check if user exists and get approval status
    let user = await prisma.user.findUnique({
      where: { walletAddress: wallet }
    })

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: wallet,
        //   username: `user_${wallet.slice(0, 8)}`,
          totalPoints: 0
        }
      })
    }

    // Check NFT claim approval
    const approval = await prisma.nftClaimApproval.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            walletAddress: true
          }
        }
      }
    })

    // Check if already claimed
    const existingClaim = await prisma.nftClaim.findFirst({
      where: {
        userId: user.id,
        status: 'COMPLETED'
      }
    })

    const response = {
      approved: approval?.approved || false,
      claimed: !!existingClaim || approval?.claimed || false,
      approvedAt: approval?.approvedAt?.toISOString(),
      approvedBy: approval?.approvedBy || approval?.user?.walletAddress,
      claimedAt: approval?.claimedAt?.toISOString() || existingClaim?.createdAt?.toISOString(),
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Approval status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check approval status' },
      { status: 500 }
    )
  }
}