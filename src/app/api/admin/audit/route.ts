// src/app/api/admin/audit/route.ts - Admin audit logs
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const action = url.searchParams.get('action')
    const adminId = url.searchParams.get('adminId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    let where: any = {}
    
    if (action) {
      where.action = { contains: action, mode: 'insensitive' }
    }
    
    if (adminId) {
      where.adminId = adminId
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          admin: {
            select: {
              walletAddress: true,
              twitterUsername: true
            }
          }
        }
      }),
      prisma.adminAuditLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}