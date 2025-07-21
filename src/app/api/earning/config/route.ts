import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  await requireAdmin(req)

  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['loginReward', 'referralReward', 'streakBonus7', 'streakBonus30', 'dailyEarningEnabled']
        }
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
      enabled: configMap.dailyEarningEnabled !== false
    })
  } catch (error) {
    console.error('Fetch earning config error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  await requireAdmin(req)

  try {
    const { loginReward, referralReward, streakBonus7, streakBonus30, enabled } = await req.json()

    const updates = [
      { key: 'loginReward', value: loginReward },
      { key: 'referralReward', value: referralReward },
      { key: 'streakBonus7', value: streakBonus7 },
      { key: 'streakBonus30', value: streakBonus30 },
      { key: 'dailyEarningEnabled', value: enabled }
    ]

    await Promise.all(
      updates.map(({ key, value }) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update earning config error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}