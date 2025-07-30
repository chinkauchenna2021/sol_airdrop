// /api/admin/nft-claims/approve-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'



export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, approved } = await req.json()

    if (!userId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    await prisma.nftClaimApproval.upsert({
      where: { userId },
      update: { 
        approved, 
        approvedBy: session.user.id,
        approvedAt: new Date()
      },
      create: {
        userId,
        approved,
        approvedBy: session.user.id,
        approvedAt: new Date()
      }
    })

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: approved ? 'USER_APPROVED_NFT_CLAIM' : 'USER_REJECTED_NFT_CLAIM',
        metadata: {
          targetUserId: userId,
          approved,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Approve user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user approval' },
      { status: 500 }
    )
  }
}
