import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

const CONFIG_KEYS = [
  'claimsEnabled',
  'minClaimAmount',
  'claimRate',
  'claimFeePercentage',
  'pointsPerLike',
  'pointsPerRetweet',
  'pointsPerComment',
  'pointsPerFollow',
  'pointsPerReferral',
  'dailyCheckInPoints',
]

export const GET = requireAdmin(async (req: NextRequest) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { in: CONFIG_KEYS }
      }
    })

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {} as Record<string, any>)

    // Ensure all keys have values
    const fullConfig = CONFIG_KEYS.reduce((acc, key) => {
      acc[key] = configMap[key] ?? getDefaultValue(key)
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json(fullConfig)
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
})

export const PUT = requireAdmin(async (req: NextRequest) => {
  try {
    const updates = await req.json()

    // Validate and update each config
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      if (!CONFIG_KEYS.includes(key)) {
        throw new Error(`Invalid config key: ${key}`)
      }

      return prisma.systemConfig.upsert({
        where: { key },
        update: { value: serializeConfigValue(value) },
        create: {
          key,
          value: serializeConfigValue(value),
          description: getConfigDescription(key),
        }
      })
    })

    await Promise.all(updatePromises)

    // Log admin action
    await prisma.analytics.create({
      data: {
        metadata: {
          action: 'CONFIG_UPDATE',
          updates,
          adminId: req.headers.get('x-user-id'),
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    })
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
})

function serializeConfigValue(value: unknown): any {
  // Accept primitives as-is, stringify objects/arrays, otherwise null
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return null;
}

function getDefaultValue(key: string): any {
  const defaults: Record<string, any> = {
    claimsEnabled: true,
    minClaimAmount: 100,
    claimRate: 0.001,
    claimFeePercentage: 2.5,
    pointsPerLike: 10,
    pointsPerRetweet: 20,
    pointsPerComment: 15,
    pointsPerFollow: 50,
    pointsPerReferral: 100,
    dailyCheckInPoints: 5,
  }
  return defaults[key] ?? null
}

function getConfigDescription(key: string): string {
  const descriptions: Record<string, string> = {
    claimsEnabled: 'Enable or disable token claims globally',
    minClaimAmount: 'Minimum points required to make a claim',
    claimRate: 'Conversion rate from points to tokens',
    claimFeePercentage: 'Percentage fee deducted from claims',
    pointsPerLike: 'Points awarded for liking a tweet',
    pointsPerRetweet: 'Points awarded for retweeting',
    pointsPerComment: 'Points awarded for commenting',
    pointsPerFollow: 'Points awarded for following',
    pointsPerReferral: 'Points awarded for successful referral',
    dailyCheckInPoints: 'Points awarded for daily check-in',
  }
  return descriptions[key] || ''
}