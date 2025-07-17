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
  'highActivityTokens',
  'mediumActivityTokens',
  'lowActivityTokens',
  'highActivityThreshold',
  'mediumActivityThreshold',
  'maxClaimAmount',
  'minPointsToWithdraw'
]

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { in: CONFIG_KEYS }
      }
    })

    const configMap = configs.reduce((acc: any, config: any) => {
      acc[config.key] = config.value
      return acc
    }, {})

    // Set defaults for missing configs
    const fullConfig = CONFIG_KEYS.reduce((acc: any, key) => {
      acc[key] = configMap[key] ?? getDefaultValue(key)
      return acc
    }, {})

    return NextResponse.json(fullConfig)
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validatedConfig = validateConfigData(body)

    if (!validatedConfig.isValid) {
      return NextResponse.json(
        { error: 'Invalid configuration data', details: validatedConfig.errors },
        { status: 400 }
      )
    }

    // Update each config value
    const updatedConfigs = []
    for (const [key, value] of Object.entries(body)) {
      if (CONFIG_KEYS.includes(key)) {
        const config = await prisma.systemConfig.upsert({
          where: { key },
          update: { 
            //@ts-ignore
            value, 
            updatedAt: new Date() 
          },
          create: {
            key,
          //@ts-ignore
           value,
            description: getConfigDescription(key)
          }
        })
        updatedConfigs.push({ key, value })
      }
    }

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'CONFIG_UPDATE',
        //@ts-ignore
        metadata: {
          changes: updatedConfigs,
          timestamp: new Date().toISOString(),
          changedBy: session.user.walletAddress
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updatedConfigs.length} configuration(s)`,
      updated: updatedConfigs
    })
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

// Helper function to get default values
function getDefaultValue(key: string): any {
  const defaults: Record<string, any> = {
    claimsEnabled: true,
    minClaimAmount: 100,
    claimRate: 0.1,
    claimFeePercentage: 2.5,
    pointsPerLike: 10,
    pointsPerRetweet: 25,
    pointsPerComment: 15,
    pointsPerFollow: 50,
    pointsPerReferral: 100,
    dailyCheckInPoints: 25,
    highActivityTokens: 4000,
    mediumActivityTokens: 3500,
    lowActivityTokens: 3000,
    highActivityThreshold: 1000,
    mediumActivityThreshold: 500,
    maxClaimAmount: 10000,
    minPointsToWithdraw: 1000
  }
  return defaults[key] || 0
}

// Helper function to get config descriptions
function getConfigDescription(key: string): string {
  const descriptions: Record<string, string> = {
    claimsEnabled: 'Enable or disable token claims globally',
    minClaimAmount: 'Minimum amount of tokens that can be claimed',
    claimRate: 'Rate at which points convert to tokens',
    claimFeePercentage: 'Fee percentage for processing claims',
    pointsPerLike: 'Points awarded for each Twitter like',
    pointsPerRetweet: 'Points awarded for each Twitter retweet',
    pointsPerComment: 'Points awarded for each Twitter comment',
    pointsPerFollow: 'Points awarded for each Twitter follow',
    pointsPerReferral: 'Points awarded for successful referrals',
    dailyCheckInPoints: 'Points awarded for daily check-ins',
    highActivityTokens: 'Token allocation for high activity users',
    mediumActivityTokens: 'Token allocation for medium activity users',
    lowActivityTokens: 'Token allocation for low activity users',
    highActivityThreshold: 'Minimum points threshold for high activity',
    mediumActivityThreshold: 'Minimum points threshold for medium activity',
    maxClaimAmount: 'Maximum amount of tokens that can be claimed at once',
    minPointsToWithdraw: 'Minimum points required to initiate a withdrawal'
  }
  return descriptions[key] || `Configuration value for ${key}`
}

// Helper function to validate config data
function validateConfigData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [key, value] of Object.entries(data)) {
    if (!CONFIG_KEYS.includes(key)) {
      errors.push(`Invalid configuration key: ${key}`)
      continue
    }

    // Type validation
    switch (key) {
      case 'claimsEnabled':
        if (typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`)
        }
        break
      
      case 'minClaimAmount':
      case 'maxClaimAmount':
      case 'highActivityTokens':
      case 'mediumActivityTokens':
      case 'lowActivityTokens':
      case 'pointsPerLike':
      case 'pointsPerRetweet':
      case 'pointsPerComment':
      case 'pointsPerFollow':
      case 'pointsPerReferral':
      case 'dailyCheckInPoints':
      case 'highActivityThreshold':
      case 'mediumActivityThreshold':
      case 'minPointsToWithdraw':
        if (typeof value !== 'number' || value < 0) {
          errors.push(`${key} must be a positive number`)
        }
        break
      
      case 'claimRate':
      case 'claimFeePercentage':
        if (typeof value !== 'number' || value < 0 || value > 100) {
          errors.push(`${key} must be a number between 0 and 100`)
        }
        break
    }
  }

  // Business logic validation
  if (data.minClaimAmount && data.maxClaimAmount && data.minClaimAmount > data.maxClaimAmount) {
    errors.push('Minimum claim amount cannot be greater than maximum claim amount')
  }

  if (data.highActivityThreshold && data.mediumActivityThreshold && 
      data.mediumActivityThreshold >= data.highActivityThreshold) {
    errors.push('Medium activity threshold must be less than high activity threshold')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Optional: Add a route to get configuration history
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { key } = await req.json()

    if (!key || !CONFIG_KEYS.includes(key)) {
      return NextResponse.json(
        { error: 'Invalid configuration key' },
        { status: 400 }
      )
    }

    // Reset to default value
    const defaultValue = getDefaultValue(key)
    
    await prisma.systemConfig.upsert({
      where: { key },
      update: { 
        value: defaultValue, 
        updatedAt: new Date() 
      },
      create: {
        key,
        value: defaultValue,
        description: getConfigDescription(key)
      }
    })

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'CONFIG_RESET',
        metadata: {
          key,
          resetTo: defaultValue,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Reset ${key} to default value`,
      key,
      value: defaultValue
    })
  } catch (error) {
    console.error('Reset config error:', error)
    return NextResponse.json(
      { error: 'Failed to reset configuration' },
      { status: 500 }
    )
  }
}