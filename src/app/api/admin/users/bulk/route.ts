import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthService } from '@/lib/admin-auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await AdminAuthService.verifyAdminSession(req)
  if (!session || !await AdminAuthService.requirePermission(session, 'write_users')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, userIds } = await req.json()

    let result
    switch (action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true }
        })
        break

      case 'deactivate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false }
        })
        break

      case 'ban':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { 
            isActive: false,
            isBanned: true,
            bannedAt: new Date()
          }
        })
        break

      case 'export':
        // Generate CSV export
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            walletAddress: true,
            twitterUsername: true,
            totalPoints: true,
            level: true,
            createdAt: true
          }
        })
        
        const csv = generateCSV(users)
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="users.csv"'
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Log bulk action
    await AdminAuthService.logAdminAction(session.adminId, `BULK_${action.toUpperCase()}`, {
      userIds,
      count: userIds.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `${action} completed for ${userIds.length} users`,
      affectedRows: result?.count || 0
    })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}

function generateCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  )
  
  return [headers, ...rows].join('\n')
}