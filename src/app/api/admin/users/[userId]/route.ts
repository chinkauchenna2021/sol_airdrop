// src/app/api/admin/users/[userid]/route.ts - REPLACE your existing file
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { adminUserUpdateSchema } from '@/lib/validation'

export async function GET(
  req: NextRequest
) {
  // Check admin authentication
  const requestUrl = new URL(req.url);
  const userid = requestUrl.searchParams.get("userid");
  const session = await getSession(req)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userid  as string},
      include: {
        engagements: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        claims: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        pointHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        // ADD: Include achievements if available
        achievements: {
          include: {
            achievement: {
              select: {
                name: true,
                description: true,
                icon: true
              }
            }
          }
        },
        _count: {
          select: {
            engagements: true,
            claims: true,
            referrals: true,
            tasks: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // ADD: Calculate user's rank
    const rank = await prisma.user.count({
      where: { totalPoints: { gt: user.totalPoints } }
    }) + 1

    // ADD: Calculate token allocation based on activity
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
  { params }: { params: { userid: string } }
) {
  // Check admin authentication
  const session = await getSession(req)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validatedData = adminUserUpdateSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: params.userid },
      data: validatedData
    })

    // Log admin action
    await prisma.pointHistory.create({
      data: {
        userId: params.userid,
        points: 0,
        action: 'ADMIN_UPDATE',
        description: `Admin updated user settings`,
        metadata: {
          adminId: session.user.id,
          changes: validatedData,
          timestamp: new Date().toISOString()
        }
      }
    })

    // ADD: If twitterActivity was updated, recalculate level
    if (validatedData) {
      const updatedUser = await prisma.user.update({
        where: { id: params.userid },
        data: {
          level: Math.floor(user.totalPoints / 1000) + 1
        }
      })
      return NextResponse.json({
        success: true,
        user: updatedUser
      })
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userid: string } }
) {
  // Check admin authentication
  const session = await getSession(req)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Soft delete - just deactivate the user
    await prisma.user.update({
      where: { id: params.userid },
      data: { isActive: false }
    })

    // Log admin action
    await prisma.pointHistory.create({
      data: {
        userId: params.userid,
        points: 0,
        action: 'ADMIN_DEACTIVATE',
        description: `Admin deactivated user account`,
        metadata: {
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}