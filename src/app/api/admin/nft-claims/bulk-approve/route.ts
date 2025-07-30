// /api/admin/nft-claims/bulk-approve/route.ts
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

    const { userIds, approved } = await req.json()

    if (!Array.isArray(userIds) || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Bulk update approvals
    const operations = userIds.map(userId => ({
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
    }))

    await Promise.all(
      operations.map(op => prisma.nftClaimApproval.upsert(op))
    )

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: approved ? 'BULK_APPROVED_NFT_CLAIMS' : 'BULK_REJECTED_NFT_CLAIMS',
        metadata: {
          userIds,
          approved,
          count: userIds.length,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true,
      message: `${userIds.length} users ${approved ? 'approved' : 'rejected'} successfully`
    })

  } catch (error: any) {
    console.error('Bulk approve error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update approvals' },
      { status: 500 }
    )
  }
}