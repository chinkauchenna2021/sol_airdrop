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











 


/**
 * @description used for the new auth provider
 */

export const AUTH_SYSTEM_CONFIG = {
  // Current active system
  ACTIVE_SYSTEM: process.env.AUTH_SYSTEM || 'LEGACY',
  
  // Better Auth Configuration
  BETTER_AUTH: {
    enabled: process.env.AUTH_SYSTEM === 'BETTER_AUTH',
    secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    url: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
    database: {
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`
    },
    features: {
      twoFactor: true,
      admin: true,
      sessionManagement: true,
      enhancedMonitoring: true
    }
  },

  // Legacy System Configuration  
  LEGACY: {
    enabled: process.env.AUTH_SYSTEM === 'LEGACY' || !process.env.AUTH_SYSTEM,
    api: {
      key: process.env.TWITTER_API_KEY,
      secret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN
    },
    oauth: {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    },
    features: {
      basicMonitoring: true,
      webhooks: true,
      oauth2: true
    }
  },

  // Monitoring Configuration
  MONITORING: {
    intervals: {
      highActivity: 30 * 60 * 1000,    // 30 minutes
      mediumActivity: 60 * 60 * 1000,  // 1 hour
      lowActivity: 4 * 60 * 60 * 1000  // 4 hours
    },
    batchSize: 100,
    maxRetries: 3,
    rateLimit: {
      requests: 100,
      windowMs: 15 * 60 * 1000 // 15 minutes
    }
  },

  // Point System Configuration
  POINTS: {
    engagements: {
      LIKE: parseInt(process.env.POINTS_PER_LIKE || '10'),
      RETWEET: parseInt(process.env.POINTS_PER_RETWEET || '20'),
      COMMENT: parseInt(process.env.POINTS_PER_COMMENT || '15'),
      QUOTE: parseInt(process.env.POINTS_PER_QUOTE || '25'),
      FOLLOW: parseInt(process.env.POINTS_PER_FOLLOW || '50')
    },
    bonuses: {
      WELCOME: 100,
      TWITTER_CONNECT: 50,
      DAILY_LOGIN: 5,
      STREAK_MULTIPLIER: 1.5
    },
    activityLevelBonuses: {
      HIGH: 100,
      MEDIUM: 50,
      LOW: 25
    }
  },

  // Database Configuration
  DATABASE: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    schema: 'public',
    ssl: process.env.NODE_ENV === 'production'
  },

  // Security Configuration
  SECURITY: {
    jwtSecret: process.env.NEXTAUTH_SECRET,
    cookiePrefix: 'airdrop-auth',
    sessionExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
  }
} as const

// Environment validation
export function validateEnvironment(): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Required for both systems
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required')
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push('NEXT_PUBLIC_APP_URL not set, using localhost:3000')
  }

  // Twitter OAuth (required for both systems)
  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    errors.push('Twitter OAuth credentials (TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET) are required')
  }

  // System-specific validation
  if (AUTH_SYSTEM_CONFIG.ACTIVE_SYSTEM === 'BETTER_AUTH') {
    if (!process.env.BETTER_AUTH_SECRET) {
      warnings.push('BETTER_AUTH_SECRET not set, using NEXTAUTH_SECRET')
    }
  } else {
    // Legacy system requirements
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      errors.push('Legacy system requires TWITTER_API_KEY and TWITTER_API_SECRET')
    }
    
    if (!process.env.TWITTER_BEARER_TOKEN) {
      warnings.push('TWITTER_BEARER_TOKEN recommended for enhanced API access')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Initialize system configuration
export async function initializeAuthSystem(): Promise<{
  success: boolean
  system: string
  message: string
}> {
  try {
    console.log('🚀 Initializing authentication system...')
    
    // Validate environment
    const validation = validateEnvironment()
    
    if (!validation.valid) {
      console.error('❌ Environment validation failed:')
      validation.errors.forEach(error => console.error(`  - ${error}`))
      return {
        success: false,
        system: AUTH_SYSTEM_CONFIG.ACTIVE_SYSTEM,
        message: `Environment validation failed: ${validation.errors.join(', ')}`
      }
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:')
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }

    console.log(`✅ Using ${AUTH_SYSTEM_CONFIG.ACTIVE_SYSTEM} authentication system`)
    
    // Log active features
    const features = AUTH_SYSTEM_CONFIG.ACTIVE_SYSTEM === 'BETTER_AUTH'
      ? Object.keys(AUTH_SYSTEM_CONFIG.BETTER_AUTH.features)
      : Object.keys(AUTH_SYSTEM_CONFIG.LEGACY.features)
    
    console.log('📋 Active features:', features.join(', '))

    return {
      success: true,
      system: AUTH_SYSTEM_CONFIG.ACTIVE_SYSTEM,
      message: `${AUTH_SYSTEM_CONFIG.ACTIVE_SYSTEM} system initialized successfully`
    }

  } catch (error) {
    console.error('❌ Failed to initialize auth system:', error)
    return {
      success: false,
      system: AUTH_SYSTEM_CONFIG.ACTIVE_SYSTEM,
      message: error instanceof Error ? error.message : 'Unknown initialization error'
    }
  }
}