import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { enabled } = await req.json()

    await prisma.systemConfig.upsert({
      where: { key: 'maintenanceMode' },
      update: { 
        value: enabled,
        updatedAt: new Date()
      },
      create: {
        key: 'maintenanceMode',
        value: enabled,
        description: 'Enable maintenance mode'
      }
    })

    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
        metadata: {
          enabled,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`
    })
  } catch (error) {
    console.error('Toggle maintenance mode error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle maintenance mode' },
      { status: 500 }
    )
  }
}
