import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status } = body

    const alert = await prisma.fraudAlert.update({
      where: { id: params.alertId },
      data: {
        status,
        investigatedBy: session?.user.id,
        resolvedAt: ['RESOLVED', 'FALSE_POSITIVE'].includes(status) ? new Date() : null
      }
    })

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'FRAUD_ALERT_UPDATE',
        metadata: {
          alertId: params.alertId,
          newStatus: status,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      alert
    })
  } catch (error) {
    console.error('Update fraud alert error:', error)
    return NextResponse.json(
      { error: 'Failed to update fraud alert' },
      { status: 500 }
    )
  }
}
