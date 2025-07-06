import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { adminUserUpdateSchema } from '@/lib/validation'

export const GET = requireAdmin(async (
  req: NextRequest,
  { params }: { params: { userId: string } }
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
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

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
})

export const PATCH = requireAdmin(async (
  req: NextRequest,
  { params }: { params: { userId: string } }
) => {
  try {
    const body = await req.json()
    const validatedData = adminUserUpdateSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: validatedData
    })

    // Log admin action
    await prisma.pointHistory.create({
      data: {
        userId: params.userId,
        points: 0,
        action: 'ADMIN_UPDATE',
        description: `Admin updated user settings`,
        metadata: validatedData
      }
    })

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
})

export const DELETE = requireAdmin(async (
  req: NextRequest,
  { params }: { params: { userId: string } }
) => {
  try {
    // Soft delete - just deactivate the user
    await prisma.user.update({
      where: { id: params.userId },
      data: { isActive: false }
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
})