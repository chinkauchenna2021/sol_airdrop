// /app/api/claim/controls/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['claimingEnabled', 'minClaimAmount', 'maxClaimAmount', 'claimFeePercentage']
        }
      }
    })

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      claimingEnabled: configMap.claimingEnabled ?? true,
      minClaimAmount: configMap.minClaimAmount ?? 1,
      maxClaimAmount: configMap.maxClaimAmount ?? 10000,
      claimFeePercentage: configMap.claimFeePercentage ?? 2
    })

  } catch (error: any) {
    console.error('Controls fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch controls' },
      { status: 500 }
    )
  }
}