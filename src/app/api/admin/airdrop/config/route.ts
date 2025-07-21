import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  await requireAdmin(req)

  try {
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: {
        status: { in: ['ACTIVE', 'CLAIMING'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { in: ['highTierTokens', 'mediumTierTokens', 'lowTierTokens'] }
      }
    })

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      name: currentSeason?.name || '',
      totalAllocation: currentSeason ? Number(currentSeason.totalAllocation) : 400000000,
      claimingEnabled: currentSeason?.status === 'CLAIMING',
      highTierTokens: configMap.highTierTokens || 4500,
      mediumTierTokens: configMap.mediumTierTokens || 4000,
      lowTierTokens: configMap.lowTierTokens || 3000
    })

  } catch (error) {
    console.error('Error fetching airdrop config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
