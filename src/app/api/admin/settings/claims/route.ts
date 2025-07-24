import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get claim-related configurations from systemConfig
    const claimConfigs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'globalClaimsEnabled',
            'minClaimAmount', 
            'claimFeeSOL',
            'claimCooldownHours',
            'maxDailyClaimsPerUser',
            'requireSOLBalance',
            'minSOLBalance',
            'claimsEnabled'
          ]
        }
      }
    })

    const configMap = claimConfigs.reduce((acc: any, config) => {
      acc[config.key] = config.value
      return acc
    }, {})

    const settings = {
      globalClaimsEnabled: configMap.globalClaimsEnabled ?? configMap.claimsEnabled ?? true,
      minClaimAmount: configMap.minClaimAmount ?? 100,
      claimFeeSOL: configMap.claimFeeSOL ?? 0.01,
      claimCooldownHours: configMap.claimCooldownHours ?? 24,
      maxDailyClaimsPerUser: configMap.maxDailyClaimsPerUser ?? 1,
      requireSOLBalance: configMap.requireSOLBalance ?? true,
      minSOLBalance: configMap.minSOLBalance ?? 0.01,
      blacklistedUsers: [], // Could be stored in a separate table
      whitelistedUsers: [], // Could be stored in a separate table
      claimSchedule: {
        enabled: false,
        startTime: '00:00',
        endTime: '23:59',
        timezone: 'UTC'
      },
      autoApproval: {
        enabled: false,
        maxAmount: 1000,
        minUserLevel: 5
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get claim settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim settings' },
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
    const {
      globalClaimsEnabled,
      minClaimAmount,
      claimFeeSOL,
      claimCooldownHours,
      maxDailyClaimsPerUser,
      requireSOLBalance,
      minSOLBalance,
      claimSchedule,
      autoApproval
    } = body

    // Update system configurations
    const configUpdates = [
      { key: 'globalClaimsEnabled', value: globalClaimsEnabled },
      { key: 'claimsEnabled', value: globalClaimsEnabled }, // Keep backward compatibility
      { key: 'minClaimAmount', value: minClaimAmount },
      { key: 'claimFeeSOL', value: claimFeeSOL },
      { key: 'claimCooldownHours', value: claimCooldownHours },
      { key: 'maxDailyClaimsPerUser', value: maxDailyClaimsPerUser },
      { key: 'requireSOLBalance', value: requireSOLBalance },
      { key: 'minSOLBalance', value: minSOLBalance }
    ]

    for (const config of configUpdates) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { 
          value: config.value,
          updatedAt: new Date()
        },
        create: {
          key: config.key,
          value: config.value,
          description: getConfigDescription(config.key)
        }
      })
    }

    // Store claim schedule and auto approval settings
    if (claimSchedule) {
      await prisma.systemConfig.upsert({
        where: { key: 'claimSchedule' },
        update: { 
          value: claimSchedule,
          updatedAt: new Date()
        },
        create: {
          key: 'claimSchedule',
          value: claimSchedule,
          description: 'Claim scheduling configuration'
        }
      })
    }

    if (autoApproval) {
      await prisma.systemConfig.upsert({
        where: { key: 'autoApproval' },
        update: { 
          value: autoApproval,
          updatedAt: new Date()
        },
        create: {
          key: 'autoApproval',
          value: autoApproval,
          description: 'Auto approval configuration'
        }
      })
    }

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'CLAIM_SETTINGS_UPDATE',
        metadata: {
          changes: body,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Claim settings updated successfully'
    })
  } catch (error) {
    console.error('Update claim settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update claim settings' },
      { status: 500 }
    )
  }
}

 function getConfigDescription(key: string): string {
  const descriptions: Record<string, string> = {
    globalClaimsEnabled: 'Enable or disable token claims globally',
    claimsEnabled: 'Enable or disable token claims globally (legacy)',
    minClaimAmount: 'Minimum amount of tokens that can be claimed',
    claimFeeSOL: 'SOL fee required for processing claims',
    claimCooldownHours: 'Hours between allowed claims per user',
    maxDailyClaimsPerUser: 'Maximum claims per user per day',
    requireSOLBalance: 'Require minimum SOL balance to claim',
    minSOLBalance: 'Minimum SOL balance required to claim'
  }
  return descriptions[key] || `Configuration for ${key}`
}
