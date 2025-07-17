import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthService } from '@/lib/admin-auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await AdminAuthService.verifyAdminSession(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      activeUsers,
      onlineAdmins,
      pendingClaims,
      suspiciousActivity,
      recentActions
    ] = await Promise.all([
      // Active users in last 24 hours
      prisma.user.count({
        where: {
          lastActivity: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Online admins
      prisma.adminSession.count({
        where: {
          expiresAt: { gt: new Date() },
          lastActivity: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
          }
        }
      }),

      // Pending claims
      prisma.claim.count({
        where: { status: 'PENDING' }
      }),

      // Suspicious activity alerts
      prisma.fraudAlert.count({
        where: { 
          status: 'PENDING',
          severity: { in: ['HIGH', 'CRITICAL'] }
        }
      }),

      // Recent admin actions
      prisma.adminAuditLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { admin: { select: { id: true, walletAddress: true } } }
      })
    ])

    // Mock performance metrics (in production, get from monitoring service)
    const performanceMetrics = {
      responseTime: Math.floor(Math.random() * 300) + 50,
      errorRate: Math.random() * 2,
      cpuUsage: Math.floor(Math.random() * 80) + 10,
      memoryUsage: Math.floor(Math.random() * 70) + 20
    }

    const systemHealth = performanceMetrics.responseTime < 200 && 
                        performanceMetrics.errorRate < 1 && 
                        performanceMetrics.cpuUsage < 70 
                        ? 'healthy' 
                        : performanceMetrics.errorRate > 5 || performanceMetrics.cpuUsage > 90
                        ? 'critical'
                        : 'warning'

    return NextResponse.json({
      activeUsers,
      onlineAdmins,
      pendingClaims,
      suspiciousActivity,
      systemHealth,
      alertCount: suspiciousActivity,
      performanceMetrics,
      recentActions: recentActions.map((action:any) => ({
        id: action.id,
        adminId: action.adminId,
        action: action.action,
        timestamp: action.timestamp,
        severity: action.metadata?.severity || 'low'
      }))
    })
  } catch (error) {
    console.error('Error fetching real-time metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
