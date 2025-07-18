import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest
) {
  try {
const requestUrl = new URL(req.url);
  const userid = requestUrl.searchParams.get("userId");
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userid as string },
      include: {
        engagements: { take: 10, orderBy: { createdAt: 'desc' } },
        claims: { take: 10, orderBy: { createdAt: 'desc' } },
        pointHistory: { take: 20, orderBy: { createdAt: 'desc' } }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const rank = await prisma.user.count({
      where: { totalPoints: { gt: user.totalPoints } }
    }) + 1

    const tokenAllocation = user.twitterActivity === 'HIGH' ? 4000 
                          : user.twitterActivity === 'MEDIUM' ? 3500 
                          : 3000

    return NextResponse.json({ 
      user: {
        ...user,
        rank,
        tokenAllocation
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { action } = body

    let updateData: any = {}

    switch (action) {
      case 'ban':
        updateData = { isBanned: true, bannedAt: new Date() }
        break
      case 'unban':
        updateData = { isBanned: false, bannedAt: null }
        break
      case 'activate':
        updateData = { isActive: true }
        break
      case 'deactivate':
        updateData = { isActive: false }
        break
      case 'make_admin':
        updateData = { isAdmin: true }
        break
      case 'remove_admin':
        updateData = { isAdmin: false }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: updateData
    })

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: `USER_${action.toUpperCase()}`,
        metadata: {
          targetUserId: params.userId,
          changes: updateData,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

function getDefaultValue(key: string): any {
  const defaults: Record<string, any> = {
    claimsEnabled: true,
    minClaimAmount: 100,
    pointsPerLike: 10,
    pointsPerRetweet: 25,
    pointsPerComment: 15,
    pointsPerFollow: 50,
    highActivityTokens: 4000,
    mediumActivityTokens: 3500,
    lowActivityTokens: 3000
  }
  return defaults[key] || 0
}