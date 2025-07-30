// /api/admin/nft-claims/controls/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { createAndMintNftCollection } from '@/utils'
import  prisma  from '@/lib/prisma'


export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const settings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['claimingEnabled', 'nftPassRequired', 'requireApproval', 'seasonStatus', 'feeAmount']
        }
      }
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, any>)

    // Get approved users
    const approvals = await prisma.nftClaimApproval.findMany({
      where: { approved: true }
    })

    return NextResponse.json({
      claimingEnabled: settingsMap.claimingEnabled ?? true,
      nftPassRequired: settingsMap.nftPassRequired ?? true,
      requireApproval: settingsMap.requireApproval ?? false,
      seasonStatus: settingsMap.seasonStatus ?? 'ACTIVE',
      feeAmount: settingsMap.feeAmount ?? 4,
      approvedUsers: approvals.map(a => a.userId)
    })

  } catch (error: any) {
    console.error('Get admin controls error:', error)
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
    const validKeys = ['claimingEnabled', 'nftPassRequired', 'requireApproval', 'seasonStatus', 'feeAmount']

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue

      await prisma.systemConfig.upsert({
        where: { key },
        update: { value, updatedAt: new Date() } as any,
        create: {
          key,
          value: value as any,
          description: `NFT claim ${key} setting`
        }
      })
    }

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id as string,
        action: 'NFT_CLAIM_SETTINGS_UPDATED',
        metadata: {
          updates,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update admin controls error:', error)
    return NextResponse.json(
      { error: 'Failed to update admin controls' },
      { status: 500 }
    )
  }
}