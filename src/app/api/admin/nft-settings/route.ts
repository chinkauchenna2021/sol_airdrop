// /api/admin/nft-settings/route.ts
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
          in: ['mintingEnabled', 'distributionEnabled', 'defaultSupply', 'mintingFee']
        }
      }
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      mintingEnabled: settingsMap.mintingEnabled ?? true,
      distributionEnabled: settingsMap.distributionEnabled ?? true,
      defaultSupply: settingsMap.defaultSupply ?? 1000,
      mintingFee: settingsMap.mintingFee ?? 0.01
    })

  } catch (error: any) {
    console.error('Get NFT settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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
    const validKeys = ['mintingEnabled', 'distributionEnabled', 'defaultSupply', 'mintingFee']

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue

      await prisma.systemConfig.upsert({
        where: { key },
        update: { value, updatedAt: new Date() } as any,
        create: {
          key,
          value: value as any,
          description: `NFT ${key} setting`
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update NFT settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
