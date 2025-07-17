// src/app/api/admin/sessions/route.ts - Admin session management
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { AdminAuthService } from '@/lib/admin-auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const adminId = url.searchParams.get('adminId')

    let sessions
    if (adminId) {
      sessions = await AdminAuthService.getActiveSessions(adminId)
    } else {
      sessions = await prisma.adminSession.findMany({
        where: {
          expiresAt: { gt: new Date() }
        },
        include: {
          admin: {
            select: {
              walletAddress: true,
              twitterUsername: true
            }
          }
        },
        orderBy: { lastActivity: 'desc' }
      })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { sessionId, adminId, all } = await req.json()

    if (all && adminId) {
      await AdminAuthService.revokeAllSessions(adminId)
      
      await prisma.adminAuditLog.create({
        data: {
          adminId: session.user.id,
          action: 'REVOKE_ALL_SESSIONS',
          metadata: {
            targetAdminId: adminId,
            timestamp: new Date().toISOString()
          },
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'All sessions revoked' 
      })
    } else if (sessionId) {
      await AdminAuthService.revokeSession(sessionId)
      
      await prisma.adminAuditLog.create({
        data: {
          adminId: session.user.id,
          action: 'REVOKE_SESSION',
          metadata: {
            revokedSessionId: sessionId,
            timestamp: new Date().toISOString()
          },
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Session revoked' 
      })
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Revoke session error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    )
  }
}
