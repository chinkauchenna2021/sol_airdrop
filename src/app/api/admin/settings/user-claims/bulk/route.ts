import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userIds, enabled, reason } = await req.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      )
    }

    // Update multiple users' claim status
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        claimsEnabled: enabled,
        updatedAt: new Date()
      }
    })

    // Log the bulk action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: enabled ? 'BULK_CLAIMS_ENABLED' : 'BULK_CLAIMS_DISABLED',
        metadata: {
          userIds,
          count: result.count,
          reason: reason || 'Bulk operation',
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully ${enabled ? 'enabled' : 'disabled'} claims for ${result.count} users`,
      affectedCount: result.count
    })
  } catch (error) {
    console.error('Bulk update user claims error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update user claims' },
      { status: 500 }
    )
  }
}