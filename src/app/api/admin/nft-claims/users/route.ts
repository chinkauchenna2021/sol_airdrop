// /app/api/admin/nft-claims/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { deleteUser, resetApproval, updateUser } from '@/lib/admin-nftclaims'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') // 'all', 'approved', 'pending', 'claimed'
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build where clause for filtering
    let whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get users with their approval status
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        nftClaimApproval: {
          include: {
            approver: {
              select: {
                walletAddress: true
              }
            }
          }
        },
        nftClaims: {
          where: { status: 'COMPLETED' },
          select: { id: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    // Filter by approval status if specified
    let filteredUsers = users
    if (status && status !== 'all') {
      filteredUsers = users.filter(user => {
        switch (status) {
          case 'approved':
            return user.nftClaimApproval?.approved && !user.nftClaimApproval?.claimed
          case 'pending':
            return !user.nftClaimApproval?.approved
          case 'claimed':
            return user.nftClaimApproval?.claimed || user.nftClaims.length > 0
          default:
            return true
        }
      })
    }

    // Format user data
    const formattedUsers = filteredUsers.map(user => ({
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.walletAddress, // Using wallet address as username since schema doesn't have username
      totalPoints: user.totalPoints,
      createdAt: user.createdAt.toISOString(),
      approval: user.nftClaimApproval ? {
        approved: user.nftClaimApproval.approved,
        claimed: user.nftClaimApproval.claimed || user.nftClaims.length > 0,
        approvedAt: user.nftClaimApproval.approvedAt?.toISOString(),
        claimedAt: user.nftClaimApproval.claimedAt?.toISOString() || user.nftClaims[0]?.createdAt?.toISOString(),
        approvedBy: user.nftClaimApproval.approver?.walletAddress
      } : {
        approved: false,
        claimed: user.nftClaims.length > 0
      }
    }))

    // Get statistics
    const [
      totalUsers,
      approvedUsers,
      claimedUsers
    ] = await Promise.all([
      prisma.user.count({ where: search ? whereClause : {} }),
      prisma.nftClaimApproval.count({
        where: { approved: true }
      }),
      prisma.nftClaim.count({
        where: { status: 'COMPLETED' }
      })
    ])

    const stats = {
      total: totalUsers,
      approved: approvedUsers,
      pending: totalUsers - approvedUsers,
      claimed: claimedUsers
    }

    return NextResponse.json({
      users: formattedUsers,
      stats,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    })

  } catch (error: any) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, userId, ...data } = await req.json()

    switch (action) {
      case 'update_user':
        return await updateUser(userId, data, session.user.id)
      case 'delete_user':
        return await deleteUser(userId, session.user.id)
      case 'reset_approval':
        return await resetApproval(userId, session.user.id)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Admin user action error:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}

