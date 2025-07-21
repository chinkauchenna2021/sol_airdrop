import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  await requireAdmin(req)

  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { in: ['loginReward', 'referralReward', 'streakBonus7', 'streakBonus30', 'earningEnabled'] }
      }
    })

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      loginReward: configMap.loginReward || 5,
      referralReward: configMap.referralReward || 3,
      streakBonus7: configMap.streakBonus7 || 5,
      streakBonus30: configMap.streakBonus30 || 15,
      enabled: configMap.earningEnabled ?? true
    })

  } catch (error) {
    console.error('Error fetching earning config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAdmin(req)

  try {
    const { loginReward, referralReward, streakBonus7, streakBonus30, enabled } = await req.json()

    const configs = [
      { key: 'loginReward', value: loginReward },
      { key: 'referralReward', value: referralReward },
      { key: 'streakBonus7', value: streakBonus7 },
      { key: 'streakBonus30', value: streakBonus30 },
      { key: 'earningEnabled', value: enabled }
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
          description: `Daily earning configuration for ${config.key}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Earning configuration updated successfully'
    })

  } catch (error) {
    console.error('Error updating earning config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}