import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all system configurations
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' }
    })

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.walletAddress,
      totalConfigs: configs.length,
      configurations: configs.map(config => ({
        key: config.key,
        value: config.value,
        description: config.description,
        updatedAt: config.updatedAt
      }))
    }

    // Log export action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'SETTINGS_EXPORTED',
        metadata: {
          configCount: configs.length,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="settings-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Export settings error:', error)
    return NextResponse.json(
      { error: 'Failed to export settings' },
      { status: 500 }
    )
  }
}