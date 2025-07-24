import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user claim controls from database
    const userControls = await prisma.user.findMany({
      where: {
        OR: [
          { claimsEnabled: false }, // Users with claims disabled
          { isAdmin: true } // Include admins for reference
        ]
      },
      select: {
        id: true,
        walletAddress: true,
        twitterUsername: true,
        claimsEnabled: true,
        updatedAt: true
      }
    })

    const controls = userControls.map((user:any) => ({
      userId: user.id,
      walletAddress: user.walletAddress,
      twitterUsername: user.twitterUsername,
      claimsEnabled: user.claimsEnabled,
      reason: 'Manual control', // Could be stored in a separate field
      updatedAt: user.updatedAt,
      updatedBy: 'System' // Could track which admin made the change
    }))

    return NextResponse.json({ controls })
  } catch (error) {
    console.error('Get user claim controls error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user claim controls' },
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

    const { walletAddress, enabled, reason } = await req.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user's claim status
    await prisma.user.update({
      where: { id: user.id },
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
          targetUserId: user.id,
          walletAddress,
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
    console.error('Add user claim control error:', error)
    return NextResponse.json(
      { error: 'Failed to add user claim control' },
      { status: 500 }
    )
  }
}
