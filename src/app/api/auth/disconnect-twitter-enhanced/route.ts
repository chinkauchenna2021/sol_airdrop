import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { stopMonitoringForUser } from '@/lib/twitter-monitor-enhanced'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Verify user access
    if (session.user.id !== userId && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Stop monitoring
    await stopMonitoringForUser(userId)

    // Clear Twitter data from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterId: null,
        twitterUsername: null,
        twitterName: null,
        twitterImage: null,
        twitterFollowers: null,
        twitterActivity: null,
      },
    })

    // Clean up monitoring configuration
    await prisma.systemConfig.deleteMany({
      where: {
        OR: [
          { key: `twitter_monitoring_${userId}` },
          { key: `better_auth_user_${userId}` },
          { key: { startsWith: `session_migration_${userId}` } }
        ]
      }
    })

    // Log disconnection with tokens field
    await prisma.pointHistory.create({
      data: {
        userId,
        points: 0,
        tokens: 0,
        type: 'TOKENS',
        action: 'TWITTER_DISCONNECT',
        description: 'Disconnected Twitter account',
        metadata: {
          timestamp: new Date().toISOString(),
          system: 'better-auth'
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Twitter account disconnected successfully',
      disconnectedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Enhanced Twitter disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Twitter account' },
      { status: 500 }
    )
  }
}