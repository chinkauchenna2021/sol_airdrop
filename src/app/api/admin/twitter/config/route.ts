import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  await requireAdmin(req)

  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['twitterMonitoringEnabled', 'trackingInterval', 'highActivityThreshold', 'mediumActivityThreshold']
        }
      }
    })

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      enabled: configMap.twitterMonitoringEnabled ?? true,
      trackingInterval: configMap.trackingInterval ?? 60,
      highEngagementThreshold: configMap.highActivityThreshold ?? 1000,
      mediumEngagementThreshold: configMap.mediumActivityThreshold ?? 500
    })

  } catch (error) {
    console.error('Error fetching Twitter config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAdmin(req)

  try {
    const { enabled, trackingInterval, highEngagementThreshold, mediumEngagementThreshold } = await req.json()

    const configs = [
      { key: 'twitterMonitoringEnabled', value: enabled },
      { key: 'trackingInterval', value: trackingInterval },
      { key: 'highActivityThreshold', value: highEngagementThreshold },
      { key: 'mediumActivityThreshold', value: mediumEngagementThreshold }
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
          description: `Twitter monitoring configuration for ${config.key}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Twitter monitoring configuration updated successfully'
    })

  } catch (error) {
    console.error('Error updating Twitter config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
