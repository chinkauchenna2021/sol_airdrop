// /api/admin/nft-claims/controls/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import  prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get current season
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: { status: 'ACTIVE' }
    })

    if (!currentSeason) {
      return NextResponse.json({
        claimingEnabled: false,
        nftPassRequired: true,
        requireApproval: false,
        seasonStatus: 'ENDED',
        feeAmount: 4,
        approvedUsers: []
      })
    }

    // Get approved users
    const approvals = await prisma.nftClaimApproval.findMany({
      where: { approved: true }
    })

    return NextResponse.json({
      claimingEnabled: currentSeason.status === 'ACTIVE',
      nftPassRequired: currentSeason.nftPassRequired,
      requireApproval: currentSeason.requireApproval,
      seasonStatus: currentSeason.status,
      feeAmount: Number(currentSeason.feeAmount),
      approvedUsers: approvals.map(a => a.userId)
    })

  } catch (error: any) {
    console.error('Get controls error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin controls' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const updates = await req.json()

    // Get current season
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: { status: 'ACTIVE' }
    })

    if (!currentSeason) {
      return NextResponse.json({ error: 'No active season to update' }, { status: 400 })
    }

    // Update season settings
    const updateData: any = {}
    
    if ('claimingEnabled' in updates) {
      updateData.status = updates.claimingEnabled ? 'ACTIVE' : 'PAUSED'
    }
    if ('nftPassRequired' in updates) {
      updateData.nftPassRequired = updates.nftPassRequired
    }
    if ('requireApproval' in updates) {
      updateData.requireApproval = updates.requireApproval
    }
    if ('feeAmount' in updates) {
      updateData.feeAmount = updates.feeAmount
    }

    await prisma.airdropSeason.update({
      where: { id: currentSeason.id },
      data: updateData
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update controls error:', error)
    return NextResponse.json(
      { error: 'Failed to update admin controls' },
      { status: 500 }
    )
  }
}