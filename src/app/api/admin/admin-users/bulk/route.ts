import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, userIds, reason } = await req.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid user IDs provided' },
        { status: 400 }
      )
    }

    if (userIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot perform bulk operations on more than 100 users at once' },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let actionDescription = ''

    switch (action) {
      case 'ban':
        updateData = { isBanned: true, bannedAt: new Date() }
        actionDescription = 'banned'
        break
      case 'unban':
        updateData = { isBanned: false, bannedAt: null }
        actionDescription = 'unbanned'
        break
      case 'activate':
        updateData = { isActive: true }
        actionDescription = 'activated'
        break
      case 'deactivate':
        updateData = { isActive: false }
        actionDescription = 'deactivated'
        break
      case 'reset_points':
        updateData = { totalPoints: 0 }
        actionDescription = 'points reset'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid bulk action' },
          { status: 400 }
        )
    }

    // Perform bulk update
    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: updateData
    })

    // Log bulk action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: `BULK_${action.toUpperCase()}`,
        metadata: {
          userIds,
          affectedCount: result.count,
          reason: reason || 'No reason provided',
          changes: updateData,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Create point history entries for point resets
    if (action === 'reset_points') {
      await prisma.pointHistory.createMany({
        data: userIds.map((userId: string) => ({
          userId,
          points: 0,
          action: 'ADMIN_RESET',
          description: `Points reset by admin: ${reason || 'Bulk operation'}`,
          metadata: {
            adminId: session.user.id,
            bulkOperation: true
          }
        }))
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${actionDescription} ${result.count} user(s)`,
      affectedCount: result.count
    })
  } catch (error) {
    console.error('Bulk user operation error:', error)
    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    )
  }
}