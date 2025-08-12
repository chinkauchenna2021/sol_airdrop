import { NextRequest, NextResponse } from 'next/server'
import prisma from './prisma'

export async function updateUser(userId: string, data: any, adminId: string) {
  const { totalPoints, isActive } = data

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(typeof totalPoints === 'number' && { totalPoints }),
      ...(typeof isActive === 'boolean' && { isActive })
    }
  })

  // Log admin action
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action: 'USER_UPDATED',
      metadata: {
        targetUserId: userId,
        updates: data,
        timestamp: new Date().toISOString()
      },
      ipAddress: 'unknown'
    }
  })

  return NextResponse.json({ success: true })
}

export async function deleteUser(userId: string, adminId: string) {
  // Delete user and all related data (cascades)
  await prisma.user.delete({
    where: { id: userId }
  })

  // Log admin action
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action: 'USER_DELETED',
      metadata: {
        targetUserId: userId,
        timestamp: new Date().toISOString()
      },
      ipAddress: 'unknown'
    }
  })

  return NextResponse.json({ success: true })
}

export async function resetApproval(userId: string, adminId: string) {
  // Reset approval status
  await prisma.nftClaimApproval.deleteMany({
    where: { userId }
  })

  // Log admin action
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action: 'APPROVAL_RESET',
      metadata: {
        targetUserId: userId,
        timestamp: new Date().toISOString()
      },
      ipAddress: 'unknown'
    }
  })

  return NextResponse.json({ success: true })
}