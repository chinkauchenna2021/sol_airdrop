// src/app/api/admin/config/route.ts - REPLACE your existing file
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
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
  // ADD: New activity-based token allocation keys
  'highActivityTokens',
  'mediumActivityTokens',
  'lowActivityTokens',
  'highActivityThreshold',
  'mediumActivityThreshold',
]

// FIX: Properly typed GET handler
export async function GET(req: NextRequest) {
  // Check admin authentication
  const session = await getSession(req)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
}

// FIX: Properly typed PUT handler
export async function PUT(req: NextRequest) {
  // Check admin authentication
  const session = await getSession(req)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
          adminId: session.user.id,
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
}

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
    // ADD: Default values for activity-based token allocation
    highActivityTokens: 4000,
    mediumActivityTokens: 3500,
    lowActivityTokens: 3000,
    highActivityThreshold: 1000,
    mediumActivityThreshold: 500,
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
    // ADD: Descriptions for activity-based configs
    highActivityTokens: 'Tokens allocated to high activity users (1000+ followers)',
    mediumActivityTokens: 'Tokens allocated to medium activity users (500+ followers)',
    lowActivityTokens: 'Tokens allocated to low activity users',
    highActivityThreshold: 'Follower count threshold for high activity classification',
    mediumActivityThreshold: 'Follower count threshold for medium activity classification',
  }
  return descriptions[key] || ''
}