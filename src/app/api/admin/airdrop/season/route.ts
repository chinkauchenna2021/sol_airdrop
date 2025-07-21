import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  await requireAdmin(req)

  try {
    const { name, totalAllocation, highTierTokens, mediumTierTokens, lowTierTokens } = await req.json()

    // Update system configs for tier tokens
    const configs = [
      { key: 'highTierTokens', value: highTierTokens },
      { key: 'mediumTierTokens', value: mediumTierTokens },
      { key: 'lowTierTokens', value: lowTierTokens }
    ]

    for (const config of configs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { 
          value: config.value,
          updatedAt: new Date()
        },
        create: {
          key: config.key,
          value: config.value,
          description: `Airdrop tier configuration for ${config.key}`
        }
      })
    }

    // Check if there's an active season to update, or create new one
    const currentSeason = await prisma.airdropSeason.findFirst({
      where: {
        status: { in: ['ACTIVE', 'CLAIMING'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (currentSeason) {
      // Update existing season
      await prisma.airdropSeason.update({
        where: { id: currentSeason.id },
        data: {
          name,
          totalAllocation: BigInt(totalAllocation)
        }
      })
    } else {
      // Create new season
      await prisma.airdropSeason.create({
        data: {
          name,
          status: 'ACTIVE',
          totalAllocation: BigInt(totalAllocation),
          startDate: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Airdrop season configuration updated successfully'
    })

  } catch (error) {
    console.error('Error updating airdrop season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}