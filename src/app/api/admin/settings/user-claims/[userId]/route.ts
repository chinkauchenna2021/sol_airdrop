import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  req: NextRequest
) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }


    const requestUrl = new URL(req.url);
    const userId = requestUrl.searchParams.get("userId");
    const { enabled, reason } = await req.json()

    // Update user's claim status
    const user = await prisma.user.update({
      where: { id: userId  as string },
      data: {
        claimsEnabled: enabled,
        updatedAt: new Date()
      }
    })

    // Log the action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: enabled ? 'USER_CLAIMS_ENABLED' : 'USER_CLAIMS_DISABLED',
        metadata: {
          targetUserId: userId,
          walletAddress: user.walletAddress,
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: `User claim status ${enabled ? 'enabled' : 'disabled'} successfully`
    })
  } catch (error) {
    console.error('Update user claim status error:', error)
    return NextResponse.json(
      { error: 'Failed to update user claim status' },
      { status: 500 }
    )
  }
}