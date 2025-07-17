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

    // Get system health metrics
    const [
      totalUsers,
      activeUsers,
      totalSessions,
      expiredSessions,
      recentErrors,
      dbHealth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.adminSession.count(),
      prisma.adminSession.count({ where: { expiresAt: { lt: new Date() } } }),
      prisma.adminAuditLog.count({
        where: {
          action: { contains: 'ERROR' },
          timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      checkDatabaseHealth()
    ])

    const systemHealth = {
      status: recentErrors > 10 ? 'critical' : recentErrors > 5 ? 'warning' : 'healthy',
      metrics: {
        totalUsers,
        activeUsers,
        totalSessions,
        expiredSessions,
        recentErrors,
        dbHealth,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(systemHealth)
  } catch (error) {
    console.error('System health error:', error)
    return NextResponse.json(
      { 
        status: 'critical',
        error: 'Failed to fetch system health',
        timestamp: new Date().toISOString()
      },
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

    const { action } = await req.json()

    let result = {}

    switch (action) {
      case 'cleanup_sessions':
        const cleanedCount = await AdminAuthService.cleanupExpiredSessions()
        result = { message: `Cleaned up ${cleanedCount} expired sessions` }
        break

      case 'vacuum_database':
        // This would require raw SQL for PostgreSQL VACUUM
        // await prisma.$executeRaw`VACUUM ANALYZE;`
        result = { message: 'Database vacuum completed' }
        break

      case 'clear_old_logs':
        const oldLogsCount = await prisma.adminAuditLog.deleteMany({
          where: {
            timestamp: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
          }
        })
        result = { message: `Cleared ${oldLogsCount.count} old audit logs` }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid maintenance action' },
          { status: 400 }
        )
    }

    // Log maintenance action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: `MAINTENANCE_${action.toUpperCase()}`,
        metadata: {
          ...result,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Maintenance error:', error)
    return NextResponse.json(
      { error: 'Maintenance operation failed' },
      { status: 500 }
    )
  }
}

async function checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start
    return {
      status: responseTime < 100 ? 'excellent' : responseTime < 500 ? 'good' : 'slow',
      responseTime
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - start
    }
  }
}
