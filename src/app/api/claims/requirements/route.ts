// /api/claim/requirements/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSolAmountForUsd } from '@/utils'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get system settings
    const settings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'claimingEnabled', 'nftPassRequired', 'minimumSolBalance', 
            'claimFeeSOL', 'minimumConnectTokens', 'cooldownPeriod', 
            'dailyLimit', 'kycRequired'
          ]
        }
      }
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, any>)

    // Get user data for tier calculation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // Determine user tier
    let userTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' = 'BRONZE'
    if (user) {
      const points = user.totalPoints
      if (points >= 100000) userTier = 'DIAMOND'
      else if (points >= 50000) userTier = 'PLATINUM'
      else if (points >= 25000) userTier = 'GOLD'
      else if (points >= 10000) userTier = 'SILVER'
    }

    // Get current SOL prices
    const { solAmount: claimFeeSOL } = await getSolAmountForUsd(0.1) // $0.10 claim fee
    const { solAmount: nftPassPrice } = await getSolAmountForUsd(4) // $4 NFT pass

    const requirements = {
      minimumSolBalance: parseFloat(settingsMap.minimumSolBalance || '0.01'),
      claimFeeSOL,
      minimumConnectTokens: parseInt(settingsMap.minimumConnectTokens || '100'),
      cooldownPeriod: parseInt(settingsMap.cooldownPeriod || '24'),
      dailyLimit: parseInt(settingsMap.dailyLimit || '10000'),
      userTier,
      kycRequired: settingsMap.kycRequired === 'true',
      claimsEnabled: settingsMap.claimingEnabled === 'true',
      nftPassRequired: settingsMap.nftPassRequired === 'true',
      nftPassPrice
    }

    return NextResponse.json({ requirements })

  } catch (error: any) {
    console.error('Requirements error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim requirements' },
      { status: 500 }
    )
  }
}
