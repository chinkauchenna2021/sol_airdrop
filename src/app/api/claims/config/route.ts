import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'claimsEnabled',
            'minClaimAmount',
            'claimRate',
            'claimFeePercentage'
          ]
        }
      }
    })

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      claimsEnabled: configMap.claimsEnabled ?? true,
      minClaimAmount: configMap.minClaimAmount ?? 100,
      claimRate: configMap.claimRate ?? 0.001,
      feePercentage: configMap.claimFeePercentage ?? 2.5,
    })
  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}