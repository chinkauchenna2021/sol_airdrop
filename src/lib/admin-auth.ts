import { NextRequest } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import prisma from './prisma'
import crypto from 'crypto'

interface AdminSession {
  adminId: string
  walletAddress: string
  permissions: string[]
  sessionId: string
  lastActivity: Date
  ipAddress: string
  userAgent: string
  mfaVerified: boolean
}

export class AdminAuthService {
  private static secret = new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'admin-secret'
  )

  static async createAdminSession(
    adminId: string,
    walletAddress: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ token: string; sessionId: string }> {
    // Get admin permissions
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { 
        id: true, 
        walletAddress: true, 
        isAdmin: true,
        permissions: true 
      }
    })

    if (!admin?.isAdmin) {
      throw new Error('User is not an admin')
    }

    const sessionId = crypto.randomUUID()
    const permissions = admin.permissions as string[] || [
      'read_users', 'write_users', 'view_analytics'
    ]

    // Create session record
    await prisma.adminSession.create({
      data: {
        id: sessionId,
        adminId,
        ipAddress,
        userAgent,
        permissions,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        lastActivity: new Date()
      }
    })

    // Create JWT token
    const token = await new SignJWT({
      adminId,
      walletAddress,
      permissions,
      sessionId,
      ipAddress,
      userAgent,
      mfaVerified: false
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(this.secret)

    // Log admin login
    await this.logAdminAction(adminId, 'ADMIN_LOGIN', {
      sessionId,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    })

    return { token, sessionId }
  }

  static async verifyAdminSession(req: NextRequest): Promise<AdminSession | null> {
    try {
      const token = req.cookies.get('admin-token')?.value
      if (!token) return null

      const { payload } = await jwtVerify(token, this.secret)
      const sessionData = payload as any

      // Verify session exists and is active
      const session = await prisma.adminSession.findUnique({
        where: { id: sessionData.sessionId },
        include: { admin: true }
      })

      if (!session || session.expiresAt < new Date()) {
        return null
      }

      // Check IP address consistency (optional security)
      const currentIp = (req as any).ip || req.headers.get('x-forwarded-for') || 'unknown'
      if (session.ipAddress !== currentIp && process.env.ENFORCE_IP_CONSISTENCY === 'true') {
        await this.logAdminAction(sessionData.adminId, 'SUSPICIOUS_IP_CHANGE', {
          originalIp: session.ipAddress,
          newIp: currentIp,
          sessionId: session.id
        })
        return null
      }

      // Update last activity
      await prisma.adminSession.update({
        where: { id: session.id },
        data: { lastActivity: new Date() }
      })

      return {
        adminId: session.adminId,
        walletAddress: session.admin.walletAddress,
        permissions: session.permissions as string[],
        sessionId: session.id,
        lastActivity: session.lastActivity,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        mfaVerified: sessionData.mfaVerified || false
      }
    } catch (error) {
      console.error('Admin session verification error:', error)
      return null
    }
  }

  static async requirePermission(
    session: AdminSession,
    permission: string
  ): Promise<boolean> {
    return session.permissions.includes(permission) || 
           session.permissions.includes('super_admin')
  }

  static async logAdminAction(
    adminId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId,
          action,
          metadata,
          timestamp: new Date(),
          ipAddress: metadata.ipAddress || 'unknown'
        }
      })
    } catch (error) {
      console.error('Error logging admin action:', error)
    }
  }

  static async revokeSession(sessionId: string): Promise<void> {
    await prisma.adminSession.delete({
      where: { id: sessionId }
    })
  }

  static async revokeAllSessions(adminId: string): Promise<void> {
    await prisma.adminSession.deleteMany({
      where: { adminId }
    })
  }

  // Additional utility methods
  static async getActiveSessions(adminId: string): Promise<any[]> {
    return await prisma.adminSession.findMany({
      where: { 
        adminId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastActivity: 'desc' }
    })
  }

  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.adminSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
    return result.count
  }
}